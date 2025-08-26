import { describe, it, expect } from "vitest";
import { SubscriptionFactory } from "#domain/factories";
import { TokenTarget, NftTarget } from "#domain/entities/target";
import { PriceChangeStrategy, TimeIntervalStrategy } from "#domain/entities/strategy";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException, InvalidNumberException, InvalidDateException } from "#domain/exceptions";

describe("SubscriptionFactory", () => {
  describe("createPriceChangeSubscription", () => {
    it("should create price change subscription with TokenTarget", () => {
      const subscription = SubscriptionFactory.createPriceChangeSubscription(
        10, // threshold
        "percentage",
        "token",
        100, // current price
        new Date("2025-01-01")
      );

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(TokenTarget);
      expect(subscription.target.type).toBe("token");
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      
      expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
      expect(subscription.strategy.type).toBe("price-change");
      expect(subscription.strategy.config.threshold).toBe(10);
      expect(subscription.strategy.config.mode).toBe("percentage");
    });

    it("should create price change subscription with NftTarget", () => {
      const subscription = SubscriptionFactory.createPriceChangeSubscription(
        0.5, // threshold
        "absolute",
        "nft",
        2.5, // current price
        new Date("2025-01-01")
      );

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(NftTarget);
      expect(subscription.target.type).toBe("nft");
      expect(subscription.target.state.lastNotifiedPrice).toBe(2.5);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      
      expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
      expect(subscription.strategy.config.threshold).toBe(0.5);
      expect(subscription.strategy.config.mode).toBe("absolute");
    });

    it("should use current date as default when lastNotifiedAt is not provided", () => {
      const beforeCreation = new Date();
      
      const subscription = SubscriptionFactory.createPriceChangeSubscription(
        15,
        "percentage",
        "token",
        200
      );

      const afterCreation = new Date();
      const createdAt = subscription.target.state.lastNotifiedAt;

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it("should handle different price change modes", () => {
      const percentageSubscription = SubscriptionFactory.createPriceChangeSubscription(
        25,
        "percentage",
        "token",
        100
      );

      const absoluteSubscription = SubscriptionFactory.createPriceChangeSubscription(
        50,
        "absolute",
        "token",
        100
      );

      expect(percentageSubscription.strategy.config.mode).toBe("percentage");
      expect(absoluteSubscription.strategy.config.mode).toBe("absolute");
    });

    it("should handle edge case values", () => {
      // Zero threshold
      const zeroThreshold = SubscriptionFactory.createPriceChangeSubscription(
        0,
        "percentage",
        "token",
        100
      );
      expect(zeroThreshold.strategy.config.threshold).toBe(0);

      // Zero price
      const zeroPrice = SubscriptionFactory.createPriceChangeSubscription(
        10,
        "absolute",
        "nft",
        0
      );
      expect(zeroPrice.target.state.lastNotifiedPrice).toBe(0);

      // Very small values
      const smallValues = SubscriptionFactory.createPriceChangeSubscription(
        0.001,
        "percentage",
        "token",
        0.0001
      );
      expect(smallValues.strategy.config.threshold).toBe(0.001);
      expect(smallValues.target.state.lastNotifiedPrice).toBe(0.0001);

      // Large values
      const largeValues = SubscriptionFactory.createPriceChangeSubscription(
        1000000,
        "absolute",
        "token",
        Number.MAX_SAFE_INTEGER
      );
      expect(largeValues.strategy.config.threshold).toBe(1000000);
      expect(largeValues.target.state.lastNotifiedPrice).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("createPriceChangeSubscription - Error Cases", () => {
    const validDate = new Date();

    it("should throw FactoryException for unknown target type", () => {
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "unknown" as any,
          100,
          validDate
        );
      }).toThrow(FactoryException);

      try {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "unknown" as any,
          100,
          validDate
        );
      } catch (error) {
        expect(error).toBeInstanceOf(FactoryException);
        expect((error as FactoryException).message).toContain("unknown target type");
        expect((error as FactoryException).message).toContain("unknown");
      }
    });

    it("should throw InvalidNumberException for invalid threshold", () => {
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          NaN,
          "percentage",
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          -10,
          "percentage",
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          Infinity,
          "percentage",
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for invalid currentPrice", () => {
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "token",
          NaN,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "token",
          -100,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "token",
          Infinity,
          validDate
        );
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidDateException for invalid date", () => {
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "token",
          100,
          new Date("invalid")
        );
      }).toThrow(InvalidDateException);

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          10,
          "percentage",
          "token",
          100,
          new Date(NaN)
        );
      }).toThrow(InvalidDateException);
    });
  });

  describe("createIntervalChangeSubscription", () => {
    it("should create interval change subscription with TokenTarget", () => {
      const subscription = SubscriptionFactory.createIntervalChangeSubscription(
        3600000, // 1 hour
        "token",
        100,
        new Date("2025-01-01")
      );

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(TokenTarget);
      expect(subscription.target.type).toBe("token");
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      
      expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
      expect(subscription.strategy.type).toBe("interval-change");
      expect(subscription.strategy.config.intervalMs).toBe(3600000);
    });

    it("should create interval change subscription with NftTarget", () => {
      const subscription = SubscriptionFactory.createIntervalChangeSubscription(
        1800000, // 30 minutes
        "nft",
        5.5,
        new Date("2025-01-01")
      );

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(NftTarget);
      expect(subscription.target.type).toBe("nft");
      expect(subscription.target.state.lastNotifiedPrice).toBe(5.5);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      
      expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
      expect(subscription.strategy.config.intervalMs).toBe(1800000);
    });

    it("should use current date as default when lastNotifiedAt is not provided", () => {
      const beforeCreation = new Date();
      
      const subscription = SubscriptionFactory.createIntervalChangeSubscription(
        60000, // 1 minute
        "token",
        150
      );

      const afterCreation = new Date();
      const createdAt = subscription.target.state.lastNotifiedAt;

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it("should handle different interval values", () => {
      const intervals = [
        { ms: 1000, desc: "1 second" },
        { ms: 60000, desc: "1 minute" },
        { ms: 3600000, desc: "1 hour" },
        { ms: 86400000, desc: "1 day" },
      ];

      intervals.forEach(({ ms }) => {
        const subscription = SubscriptionFactory.createIntervalChangeSubscription(
          ms,
          "token",
          100
        );
        expect(subscription.strategy.config.intervalMs).toBe(ms);
      });
    });

    it("should handle edge case values", () => {
      // Minimum allowed interval
      const minInterval = SubscriptionFactory.createIntervalChangeSubscription(
        1000,
        "token",
        100
      );
      expect(minInterval.strategy.config.intervalMs).toBe(1000);

      // Fractional interval above minimum
      const fractionalInterval = SubscriptionFactory.createIntervalChangeSubscription(
        1500.5,
        "token",
        100
      );
      expect(fractionalInterval.strategy.config.intervalMs).toBe(1500.5);

      // Large interval
      const largeInterval = SubscriptionFactory.createIntervalChangeSubscription(
        Number.MAX_SAFE_INTEGER,
        "token",
        100
      );
      expect(largeInterval.strategy.config.intervalMs).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("createIntervalChangeSubscription - Error Cases", () => {
    const validDate = new Date();

    it("should throw FactoryException for unknown target type", () => {
      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          3600000,
          "unknown" as any,
          100,
          validDate
        );
      }).toThrow(FactoryException);

      try {
        SubscriptionFactory.createIntervalChangeSubscription(
          3600000,
          "unknown" as any,
          100,
          validDate
        );
      } catch (error) {
        expect(error).toBeInstanceOf(FactoryException);
        expect((error as FactoryException).message).toContain("unknown target type");
        expect((error as FactoryException).message).toContain("unknown");
      }
    });

    it("should throw InvalidNumberException for invalid intervalMs", () => {
      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          NaN,
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          -3600000,
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          Infinity,
          "token",
          100,
          validDate
        );
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for invalid currentPrice", () => {
      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          3600000,
          "token",
          NaN,
          validDate
        );
      }).toThrow(InvalidNumberException);

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          3600000,
          "token",
          -100,
          validDate
        );
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidDateException for invalid date", () => {
      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          3600000,
          "token",
          100,
          new Date("invalid")
        );
      }).toThrow(InvalidDateException);
    });
  });

  describe("Private createTarget Method (through public methods)", () => {
    it("should create correct target types", () => {
      const tokenSubscription = SubscriptionFactory.createPriceChangeSubscription(
        10,
        "percentage",
        "token",
        100
      );

      const nftSubscription = SubscriptionFactory.createPriceChangeSubscription(
        10,
        "percentage",
        "nft",
        100
      );

      expect(tokenSubscription.target.type).toBe("token");
      expect(tokenSubscription.target).toBeInstanceOf(TokenTarget);
      
      expect(nftSubscription.target.type).toBe("nft");
      expect(nftSubscription.target).toBeInstanceOf(NftTarget);
    });

    it("should pass state correctly to targets", () => {
      const testDate = new Date("2025-06-15T14:30:00Z");
      const testPrice = 42.5;

      const subscription = SubscriptionFactory.createPriceChangeSubscription(
        5,
        "absolute",
        "nft",
        testPrice,
        testDate
      );

      expect(subscription.target.state.lastNotifiedPrice).toBe(testPrice);
      expect(subscription.target.state.lastNotifiedAt).toEqual(testDate);
    });
  });

  describe("Integration Tests", () => {
    it("should create functional price change subscription", () => {
      const subscription = SubscriptionFactory.createPriceChangeSubscription(
        10, // 10% threshold
        "percentage",
        "token",
        100,
        new Date("2025-01-01")
      );

      // Test that the subscription works correctly
      expect(subscription.shouldNotify(120)).toBe(true); // 20% increase
      expect(subscription.shouldNotify(105)).toBe(false); // 5% increase

      // Test notification and update
      const updated = subscription.notifyAndUpdate(120);
      expect(updated.target.state.lastNotifiedPrice).toBe(120);
      expect(updated.target).not.toBe(subscription.target);
    });

    it("should create functional interval change subscription", () => {
      const subscription = SubscriptionFactory.createIntervalChangeSubscription(
        3600000, // 1 hour
        "nft",
        2.5,
        new Date("2025-01-01T00:00:00Z")
      );

      // Test that the subscription works correctly
      const after2hours = new Date("2025-01-01T02:00:00Z");
      const after30min = new Date("2025-01-01T00:30:00Z");

      expect(subscription.shouldNotify(after2hours)).toBe(true); // 2 hours > 1 hour
      expect(subscription.shouldNotify(after30min)).toBe(false); // 30 min < 1 hour

      // Test notification and update
      const updated = subscription.notifyAndUpdate(3.0);
      expect(updated.target.state.lastNotifiedPrice).toBe(3.0);
      expect(updated.target.state.lastNotifiedAt.getTime()).toBeGreaterThan(
        subscription.target.state.lastNotifiedAt.getTime()
      );
    });
  });

  describe("Real-World Factory Usage Scenarios", () => {
    it("should create crypto price monitoring subscriptions", () => {
      const btcSubscription = SubscriptionFactory.createPriceChangeSubscription(
        5, // 5% threshold
        "percentage",
        "token",
        50000, // $50k
        new Date()
      );

      const ethSubscription = SubscriptionFactory.createPriceChangeSubscription(
        100, // $100 absolute threshold
        "absolute",
        "token",
        3000, // $3k
        new Date()
      );

      expect(btcSubscription.strategy.config.threshold).toBe(5);
      expect(btcSubscription.strategy.config.mode).toBe("percentage");
      expect(ethSubscription.strategy.config.threshold).toBe(100);
      expect(ethSubscription.strategy.config.mode).toBe("absolute");
    });

    it("should create NFT floor price monitoring subscriptions", () => {
      const nftFloorSubscription = SubscriptionFactory.createPriceChangeSubscription(
        0.1, // 0.1 ETH threshold
        "absolute",
        "nft",
        5.5, // 5.5 ETH floor
        new Date()
      );

      const nftPercentageSubscription = SubscriptionFactory.createPriceChangeSubscription(
        15, // 15% threshold
        "percentage",
        "nft",
        2.0, // 2 ETH floor
        new Date()
      );

      expect(nftFloorSubscription.target.type).toBe("nft");
      expect(nftFloorSubscription.strategy.config.mode).toBe("absolute");
      expect(nftPercentageSubscription.strategy.config.mode).toBe("percentage");
    });

    it("should create time-based notification subscriptions", () => {
      const hourlyCheck = SubscriptionFactory.createIntervalChangeSubscription(
        3600000, // 1 hour
        "token",
        1000,
        new Date()
      );

      const dailyReport = SubscriptionFactory.createIntervalChangeSubscription(
        86400000, // 24 hours
        "nft",
        10.0,
        new Date()
      );

      expect(hourlyCheck.strategy.config.intervalMs).toBe(3600000);
      expect(dailyReport.strategy.config.intervalMs).toBe(86400000);
      expect(dailyReport.target.type).toBe("nft");
    });
  });

  describe("Factory Method Consistency", () => {
    it("should create subscriptions with consistent internal structure", () => {
      const priceSubscription = SubscriptionFactory.createPriceChangeSubscription(
        10,
        "percentage",
        "token",
        100
      );

      const intervalSubscription = SubscriptionFactory.createIntervalChangeSubscription(
        3600000,
        "token",
        100
      );

      // Both should have the same target structure when created with same parameters
      expect(priceSubscription.target.state.lastNotifiedPrice).toBe(
        intervalSubscription.target.state.lastNotifiedPrice
      );
      expect(priceSubscription.target.type).toBe(intervalSubscription.target.type);
      
      // But different strategy types
      expect(priceSubscription.strategy.type).toBe("price-change");
      expect(intervalSubscription.strategy.type).toBe("interval-change");
    });

    it("should handle parameter validation consistently", () => {
      const validParams = {
        threshold: 10,
        mode: "percentage" as const,
        intervalMs: 3600000,
        type: "token" as const,
        price: 100,
        date: new Date(),
      };

      // All valid parameters should work
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(
          validParams.threshold,
          validParams.mode,
          validParams.type,
          validParams.price,
          validParams.date
        );
      }).not.toThrow();

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(
          validParams.intervalMs,
          validParams.type,
          validParams.price,
          validParams.date
        );
      }).not.toThrow();
    });
  });
});