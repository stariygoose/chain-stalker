import { describe, it, expect } from "vitest";
import { Subscription } from "#domain/entities/subscription";
import { TokenTarget, NftTarget } from "#domain/entities/target";
import { PriceChangeStrategy, TimeIntervalStrategy } from "#domain/entities/strategy";
import { StrategyException } from "#domain/exceptions";

describe("Subscription Entity", () => {
  describe("Constructor", () => {
    it("should create subscription with TokenTarget and PriceChangeStrategy", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      const subscription = new Subscription(target, strategy);

      expect(subscription.target).toBe(target);
      expect(subscription.strategy).toBe(strategy);
    });

    it("should create subscription with NftTarget and TimeIntervalStrategy", () => {
      const target = new NftTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 5.0,
      });
      const strategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });

      const subscription = new Subscription(target, strategy);

      expect(subscription.target).toBe(target);
      expect(subscription.strategy).toBe(strategy);
    });

  });

  describe("shouldNotify Method - Price Change Strategy", () => {
    let subscription: Subscription<PriceChangeStrategy>;

    beforeEach(() => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10, // 10% threshold
      });
      subscription = new Subscription(target, strategy);
    });

    it("should notify when percentage change exceeds threshold", () => {
      // 100 -> 115 = 15% increase, should notify (threshold 10%)
      expect(subscription.shouldNotify(115)).toBe(true);

      // 100 -> 125 = 25% increase, should notify
      expect(subscription.shouldNotify(125)).toBe(true);
    });

    it("should not notify when percentage change is below threshold", () => {
      // 100 -> 105 = 5% increase, should not notify (threshold 10%)
      expect(subscription.shouldNotify(105)).toBe(false);

      // 100 -> 109 = 9% increase, should not notify
      expect(subscription.shouldNotify(109)).toBe(false);
    });

    it("should handle exact threshold boundary", () => {
      // 100 -> 110 = exactly 10% increase, should notify
      expect(subscription.shouldNotify(110)).toBe(true);
    });

    it("should work with absolute mode", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 15, // absolute change of 15
      });
      const sub = new Subscription(target, strategy);

      // 100 -> 120 = 20 absolute change, should notify (threshold 15)
      expect(sub.shouldNotify(120)).toBe(true);

      // 100 -> 110 = 10 absolute change, should not notify
      expect(sub.shouldNotify(110)).toBe(false);

      // 100 -> 85 = 15 absolute change, should notify
      expect(sub.shouldNotify(85)).toBe(true);
    });

    it("should handle zero price scenarios", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 0,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      const sub = new Subscription(target, strategy);

      // From 0 to any positive value should notify (infinite % change)
      expect(sub.shouldNotify(0.01)).toBe(true);
      expect(sub.shouldNotify(100)).toBe(true);
    });

    it("should handle price drops", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 20, // 20% threshold
      });
      const sub = new Subscription(target, strategy);

      // 100 -> 75 = 25% drop, should notify
      expect(sub.shouldNotify(75)).toBe(true);

      // 100 -> 85 = 15% drop, should not notify
      expect(sub.shouldNotify(85)).toBe(false);
    });
  });

  describe("shouldNotify Method - Time Interval Strategy", () => {
    let subscription: Subscription<TimeIntervalStrategy>;

    beforeEach(() => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
        lastNotifiedPrice: 100,
      });
      const strategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });
      subscription = new Subscription(target, strategy);
    });

    it("should notify when time interval has passed", () => {
      const newTime = new Date("2025-01-01T01:30:00Z"); // 1.5 hours later
      expect(subscription.shouldNotify(newTime)).toBe(true);

      const newTime2 = new Date("2025-01-01T02:00:00Z"); // 2 hours later
      expect(subscription.shouldNotify(newTime2)).toBe(true);
    });

    it("should not notify when time interval has not passed", () => {
      const newTime = new Date("2025-01-01T00:30:00Z"); // 30 minutes later
      expect(subscription.shouldNotify(newTime)).toBe(false);

      const newTime2 = new Date("2025-01-01T00:59:59Z"); // Almost 1 hour
      expect(subscription.shouldNotify(newTime2)).toBe(false);
    });

    it("should handle exact interval boundary", () => {
      const newTime = new Date("2025-01-01T01:00:00Z"); // Exactly 1 hour
      expect(subscription.shouldNotify(newTime)).toBe(true);
    });

    it("should work with different intervals", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
        lastNotifiedPrice: 100,
      });
      const strategy = new TimeIntervalStrategy({
        intervalMs: 300000, // 5 minutes
      });
      const sub = new Subscription(target, strategy);

      const after3min = new Date("2025-01-01T00:03:00Z");
      expect(sub.shouldNotify(after3min)).toBe(false);

      const after6min = new Date("2025-01-01T00:06:00Z");
      expect(sub.shouldNotify(after6min)).toBe(true);
    });
  });

  describe("shouldNotify Method - Error Cases", () => {
    it("should throw StrategyException for unknown strategy type", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });
      
      // Create a mock strategy with unknown type
      const unknownStrategy = {
        type: "unknown-strategy" as any,
        config: {},
        shouldNotify: () => true,
      };

      const subscription = new Subscription(target, unknownStrategy as any);

      expect(() => {
        subscription.shouldNotify(110);
      }).toThrow(StrategyException);

      try {
        subscription.shouldNotify(110);
      } catch (error) {
        expect(error).toBeInstanceOf(StrategyException);
        expect((error as StrategyException).message).toContain("unknown strategy type");
        expect((error as StrategyException).message).toContain("unknown-strategy");
      }
    });
  });

  describe("notifyAndUpdate Method", () => {
    it("should create new subscription with updated target state", () => {
      const originalDate = new Date("2025-01-01T00:00:00Z");
      const target = new TokenTarget({
        lastNotifiedAt: originalDate,
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      const subscription = new Subscription(target, strategy);

      const newPrice = 150;
      const updated = subscription.notifyAndUpdate(newPrice);

      expect(updated).not.toBe(subscription);
      expect(updated.target).not.toBe(subscription.target);
      expect(updated.strategy).toBe(subscription.strategy); // Same strategy
      
      expect(updated.target.state.lastNotifiedPrice).toBe(newPrice);
      expect(updated.target.state.lastNotifiedAt).toBeInstanceOf(Date);
      expect(updated.target.state.lastNotifiedAt.getTime()).toBeGreaterThan(originalDate.getTime());
      
      // Original should remain unchanged
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(subscription.target.state.lastNotifiedAt).toEqual(originalDate);
    });

    it("should work with different target types", () => {
      const nftTarget = new NftTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 5.0,
      });
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 1.0,
      });
      const subscription = new Subscription(nftTarget, strategy);

      const updated = subscription.notifyAndUpdate(7.5);

      expect(updated.target.type).toBe("nft");
      expect(updated.target.state.lastNotifiedPrice).toBe(7.5);
      expect(updated.target).toBeInstanceOf(NftTarget);
    });

    it("should handle zero price updates", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 50,
      });
      const subscription = new Subscription(target, strategy);

      const updated = subscription.notifyAndUpdate(0);

      expect(updated.target.state.lastNotifiedPrice).toBe(0);
    });

    it("should handle extreme price updates", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 1,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 100,
      });
      const subscription = new Subscription(target, strategy);

      const extremePrice = Number.MAX_SAFE_INTEGER;
      const updated = subscription.notifyAndUpdate(extremePrice);

      expect(updated.target.state.lastNotifiedPrice).toBe(extremePrice);
    });

    it("should validate updated price through target validation", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 10,
      });
      const subscription = new Subscription(target, strategy);

      // This should not throw because validation happens in target creation
      const updated = subscription.notifyAndUpdate(200);
      expect(updated.target.state.lastNotifiedPrice).toBe(200);
    });
  });

  describe("Integration Tests", () => {
    it("should work in complete notification cycle", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 15, // 15% threshold
      });
      const subscription = new Subscription(target, strategy);

      // Price goes up 20% -> should notify
      expect(subscription.shouldNotify(120)).toBe(true);

      // Update subscription after notification
      const updated1 = subscription.notifyAndUpdate(120);
      expect(updated1.target.state.lastNotifiedPrice).toBe(120);

      // Price goes up 10% from 120 -> 132 (10% of 120), should not notify (threshold 15%)
      expect(updated1.shouldNotify(132)).toBe(false);

      // Price goes up 20% from 120 -> 144 (20% of 120), should notify
      expect(updated1.shouldNotify(144)).toBe(true);

      // Update again
      const updated2 = updated1.notifyAndUpdate(144);
      expect(updated2.target.state.lastNotifiedPrice).toBe(144);

      // Verify all instances are different
      expect(updated1).not.toBe(subscription);
      expect(updated2).not.toBe(updated1);
      expect(updated2).not.toBe(subscription);
    });

    it("should work with time-based notifications", () => {
      const startTime = new Date("2025-01-01T00:00:00Z");
      const target = new TokenTarget({
        lastNotifiedAt: startTime,
        lastNotifiedPrice: 100,
      });
      const strategy = new TimeIntervalStrategy({
        intervalMs: 1800000, // 30 minutes
      });
      const subscription = new Subscription(target, strategy);

      const after15min = new Date("2025-01-01T00:15:00Z");
      expect(subscription.shouldNotify(after15min)).toBe(false);

      const after45min = new Date("2025-01-01T00:45:00Z");
      expect(subscription.shouldNotify(after45min)).toBe(true);

      // Update subscription
      const updated = subscription.notifyAndUpdate(110);
      
      // Check that the time was updated
      expect(updated.target.state.lastNotifiedAt.getTime()).toBeGreaterThan(startTime.getTime());
      expect(updated.target.state.lastNotifiedPrice).toBe(110);
    });
  });

  describe("Immutability", () => {
    it("should maintain immutability throughout operations", () => {
      const originalTarget = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 10,
      });
      const subscription = new Subscription(originalTarget, strategy);

      const updated1 = subscription.notifyAndUpdate(150);
      const updated2 = updated1.notifyAndUpdate(200);

      // All instances should be different
      expect(subscription.target).toBe(originalTarget);
      expect(updated1.target).not.toBe(originalTarget);
      expect(updated2.target).not.toBe(originalTarget);
      expect(updated2.target).not.toBe(updated1.target);

      // Original values should remain unchanged
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(updated1.target.state.lastNotifiedPrice).toBe(150);
      expect(updated2.target.state.lastNotifiedPrice).toBe(200);
    });
  });
});