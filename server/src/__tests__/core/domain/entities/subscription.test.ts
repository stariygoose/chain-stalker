import { describe, it, expect, beforeEach } from "vitest";
import { Subscription } from "#domain/entities/subscription";
import { TokenTarget, NftTarget } from "#domain/entities/target";
import { PriceChangeStrategy, TimeIntervalStrategy } from "#domain/entities/strategy";
import { StrategyException, SubscriptionException } from "#domain/exceptions";

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
      expect(subscription.isActive).toBe(true); // Default is true
    });

    it("should create subscription with NftTarget and TimeIntervalStrategy", () => {
      const target = new NftTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 5.0,
      });
      const strategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });

      const subscription = new Subscription(target, strategy, false);

      expect(subscription.target).toBe(target);
      expect(subscription.strategy).toBe(strategy);
      expect(subscription.isActive).toBe(false);
    });

    it("should create subscription with default active state when not specified", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      const subscription = new Subscription(target, strategy); // No isActive parameter

      expect(subscription.isActive).toBe(true); // Should default to true
    });

    it("should create subscription with explicit active state", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      const activeSubscription = new Subscription(target, strategy, true);
      const inactiveSubscription = new Subscription(target, strategy, false);

      expect(activeSubscription.isActive).toBe(true);
      expect(inactiveSubscription.isActive).toBe(false);
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
      subscription = new Subscription(target, strategy); // Uses default active=true
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
      const sub = new Subscription(target, strategy); // Uses default active=true

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
      const sub = new Subscription(target, strategy); // Uses default active=true

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
      const sub = new Subscription(target, strategy); // Uses default active=true

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
      subscription = new Subscription(target, strategy); // Uses default active=true
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
      const sub = new Subscription(target, strategy); // Uses default active=true

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

      const subscription = new Subscription(target, unknownStrategy as any, true);

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(nftTarget, strategy, true);

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(target, strategy); // Uses default active=true

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
      const subscription = new Subscription(originalTarget, strategy, true);

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

  describe("Activation and Deactivation", () => {
    let subscription: Subscription<PriceChangeStrategy>;

    beforeEach(() => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      subscription = new Subscription(target, strategy, false);
    });

    describe("activate", () => {
      it("should activate an inactive subscription", () => {
        expect(subscription.isActive).toBe(false);
        
        subscription.activate();
        
        expect(subscription.isActive).toBe(true);
      });

      it("should work on already active subscription", () => {
        subscription.activate();
        expect(subscription.isActive).toBe(true);
        
        subscription.activate();
        
        expect(subscription.isActive).toBe(true);
      });
    });

    describe("deactivate", () => {
      it("should deactivate an active subscription", () => {
        subscription.activate();
        expect(subscription.isActive).toBe(true);
        
        subscription.deactivate();
        
        expect(subscription.isActive).toBe(false);
      });

      it("should work on already inactive subscription", () => {
        expect(subscription.isActive).toBe(false);
        
        subscription.deactivate();
        
        expect(subscription.isActive).toBe(false);
      });
    });

    describe("activation state effects", () => {
      it("should allow shouldNotify when active", () => {
        subscription.activate();
        
        expect(() => subscription.shouldNotify(120)).not.toThrow();
        expect(subscription.shouldNotify(120)).toBe(true);
      });

      it("should throw SubscriptionException when calling shouldNotify on inactive subscription", () => {
        expect(subscription.isActive).toBe(false);
        
        expect(() => subscription.shouldNotify(120)).toThrow(SubscriptionException);
        expect(() => subscription.shouldNotify(120)).toThrow("Domain logic error. Reason: subscription is not active");
      });

      it("should allow notifyAndUpdate when active", () => {
        subscription.activate();
        
        expect(() => subscription.notifyAndUpdate(120)).not.toThrow();
        const updated = subscription.notifyAndUpdate(120);
        expect(updated.target.state.lastNotifiedPrice).toBe(120);
      });

      it("should throw SubscriptionException when calling notifyAndUpdate on inactive subscription", () => {
        expect(subscription.isActive).toBe(false);
        
        expect(() => subscription.notifyAndUpdate(120)).toThrow(SubscriptionException);
        expect(() => subscription.notifyAndUpdate(120)).toThrow("Domain logic error. Reason: subscription is not active");
      });

      it("should preserve active state after notifyAndUpdate", () => {
        subscription.activate();
        
        const updated = subscription.notifyAndUpdate(120);
        
        expect(updated.isActive).toBe(true);
        expect(() => updated.shouldNotify(140)).not.toThrow();
      });

      it("should preserve inactive state after updateStrategy", () => {
        expect(subscription.isActive).toBe(false);
        
        const newStrategy = new TimeIntervalStrategy({ intervalMs: 3600000 });
        const updated = subscription.updateStrategy(newStrategy);
        
        expect(updated.isActive).toBe(false);
        expect(() => updated.shouldNotify(new Date())).toThrow(SubscriptionException);
      });
    });
  });

  describe("updateStrategy Method", () => {
    let subscription: Subscription<PriceChangeStrategy>;

    beforeEach(() => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      subscription = new Subscription(target, strategy); // Uses default active=true
    });

    it("should create new subscription with updated strategy", () => {
      const newStrategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });

      const updated = subscription.updateStrategy(newStrategy);

      expect(updated).not.toBe(subscription);
      expect(updated.strategy).toBe(newStrategy);
      expect(updated.strategy).not.toBe(subscription.strategy);
      expect(updated.target).toBe(subscription.target); // Same target
      expect(updated.isActive).toBe(subscription.isActive); // Same active state
    });

    it("should work with different strategy types", () => {
      // Start with PriceChangeStrategy
      expect(subscription.strategy.type).toBe("price-change");

      const timeStrategy = new TimeIntervalStrategy({
        intervalMs: 1800000, // 30 minutes
      });

      const updated = subscription.updateStrategy(timeStrategy);

      expect(updated.strategy.type).toBe("interval-change");
      expect(updated.strategy).toBe(timeStrategy);
      expect(subscription.strategy.type).toBe("price-change"); // Original unchanged
    });

    it("should preserve target and active state during strategy update", () => {
      const originalTarget = subscription.target;
      const originalActiveState = subscription.isActive;

      const newStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 50,
      });

      const updated = subscription.updateStrategy(newStrategy);

      expect(updated.target).toBe(originalTarget);
      expect(updated.isActive).toBe(originalActiveState);
      expect(updated.strategy).toBe(newStrategy);
    });

    it("should work with inactive subscriptions", () => {
      subscription.deactivate();
      expect(subscription.isActive).toBe(false);

      const newStrategy = new TimeIntervalStrategy({
        intervalMs: 600000, // 10 minutes
      });

      const updated = subscription.updateStrategy(newStrategy);

      expect(updated.isActive).toBe(false);
      expect(updated.strategy).toBe(newStrategy);
      expect(() => updated.shouldNotify(new Date())).toThrow(SubscriptionException);
    });

    it("should maintain immutability", () => {
      const originalStrategy = subscription.strategy;
      const originalTarget = subscription.target;

      const newStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 25,
      });

      const updated = subscription.updateStrategy(newStrategy);

      // Original subscription should remain unchanged
      expect(subscription.strategy).toBe(originalStrategy);
      expect(subscription.target).toBe(originalTarget);
      expect(subscription.isActive).toBe(true);

      // Updated subscription should have new strategy
      expect(updated.strategy).toBe(newStrategy);
      expect(updated.target).toBe(originalTarget);
      expect(updated.isActive).toBe(true);
    });
  });

  describe("SubscriptionException Tests", () => {
    let inactiveSubscription: Subscription<PriceChangeStrategy>;

    beforeEach(() => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      inactiveSubscription = new Subscription(target, strategy, false);
    });

    it("should throw SubscriptionException with correct message for shouldNotify", () => {
      try {
        inactiveSubscription.shouldNotify(120);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(SubscriptionException);
        expect((error as SubscriptionException).message).toBe("Domain logic error. Reason: subscription is not active");
      }
    });

    it("should throw SubscriptionException with correct message for notifyAndUpdate", () => {
      try {
        inactiveSubscription.notifyAndUpdate(120);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(SubscriptionException);
        expect((error as SubscriptionException).message).toBe("Domain logic error. Reason: subscription is not active");
      }
    });

    it("should not throw SubscriptionException for updateStrategy on inactive subscription", () => {
      const newStrategy = new TimeIntervalStrategy({
        intervalMs: 3600000,
      });

      expect(() => inactiveSubscription.updateStrategy(newStrategy)).not.toThrow();
      
      const updated = inactiveSubscription.updateStrategy(newStrategy);
      expect(updated.isActive).toBe(false);
    });

    it("should not throw SubscriptionException for activate/deactivate operations", () => {
      expect(() => inactiveSubscription.activate()).not.toThrow();
      expect(() => inactiveSubscription.deactivate()).not.toThrow();
    });
  });

  describe("Default Active State Behavior", () => {
    it("should create active subscription by default", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      const subscription = new Subscription(target, strategy);

      expect(subscription.isActive).toBe(true);
      expect(() => subscription.shouldNotify(120)).not.toThrow();
      expect(subscription.shouldNotify(120)).toBe(true);
    });

    it("should allow explicit inactive creation", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      const subscription = new Subscription(target, strategy, false);

      expect(subscription.isActive).toBe(false);
      expect(() => subscription.shouldNotify(120)).toThrow(SubscriptionException);
    });

    it("should demonstrate factory creates active subscriptions by default", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      // Both explicit true and default should behave the same
      const explicitActive = new Subscription(target, strategy, true);
      const defaultActive = new Subscription(target, strategy);

      expect(explicitActive.isActive).toBe(defaultActive.isActive);
      expect(explicitActive.isActive).toBe(true);
      expect(defaultActive.isActive).toBe(true);
    });
  });

  describe("Integration Tests with New Functionality", () => {
    it("should work in complete lifecycle with activation/deactivation", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
        lastNotifiedPrice: 100,
      });
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 15,
      });
      const subscription = new Subscription(target, strategy, false);

      // Initially inactive - should throw
      expect(() => subscription.shouldNotify(120)).toThrow(SubscriptionException);

      // Activate and test
      subscription.activate();
      expect(subscription.shouldNotify(120)).toBe(true);

      // Update and verify still active
      const updated1 = subscription.notifyAndUpdate(120);
      expect(updated1.isActive).toBe(true);
      expect(updated1.shouldNotify(140)).toBe(true);

      // Deactivate and test
      updated1.deactivate();
      expect(() => updated1.shouldNotify(150)).toThrow(SubscriptionException);

      // Update strategy while inactive
      const newStrategy = new TimeIntervalStrategy({ intervalMs: 3600000 });
      const updated2 = updated1.updateStrategy(newStrategy);
      expect(updated2.isActive).toBe(false);
      expect(() => updated2.shouldNotify(new Date())).toThrow(SubscriptionException);

      // Activate with new strategy
      updated2.activate();
      expect(() => updated2.shouldNotify(new Date())).not.toThrow();
    });

    it("should handle complex strategy switching scenarios", () => {
      const target = new TokenTarget({
        lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
        lastNotifiedPrice: 100,
      });
      
      // Start with price strategy
      const priceStrategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });
      const subscription1 = new Subscription(target, priceStrategy, true);
      
      expect(subscription1.shouldNotify(115)).toBe(true); // 15% change
      
      // Switch to time strategy
      const timeStrategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });
      const subscription2 = subscription1.updateStrategy(timeStrategy);
      
      const futureTime = new Date("2025-01-01T01:30:00Z");
      expect(subscription2.shouldNotify(futureTime)).toBe(true);
      
      // Switch back to price strategy with different config
      const newPriceStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 50,
      });
      const subscription3 = subscription2.updateStrategy(newPriceStrategy);
      
      expect(subscription3.shouldNotify(160)).toBe(true); // 60 absolute change
      expect(subscription3.shouldNotify(130)).toBe(false); // 30 absolute change
    });
  });
});