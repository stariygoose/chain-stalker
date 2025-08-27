import { describe, it, expect } from "vitest";
import { SubscriptionFactory, PriceChangeSubscriptionParams, IntervalSubscriptionParams } from "#domain/factories";
import { TokenTarget, NftTarget } from "#domain/entities/target";
import { PriceChangeStrategy, TimeIntervalStrategy } from "#domain/entities/strategy";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException } from "#domain/exceptions";

describe("SubscriptionFactory", () => {
  describe("createPriceChangeSubscription", () => {
    it("should create price change subscription with TokenTarget", () => {
      const params: PriceChangeSubscriptionParams = {
        userId: "user123",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") }
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(TokenTarget);
      expect(subscription.target.type).toBe("token");
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      expect(subscription.userId).toBe("user123");
      expect(subscription.isActive).toBe(true);
      
      expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
      expect(subscription.strategy.type).toBe("price-change");
      expect(subscription.strategy.config.threshold).toBe(10);
      expect(subscription.strategy.config.mode).toBe("percentage");
    });

    it("should create price change subscription with NftTarget", () => {
      const params: PriceChangeSubscriptionParams = {
        userId: "user456",
        threshold: 0.5,
        mode: "absolute",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "123" },
        targetState: { lastNotifiedPrice: 2.5, lastNotifiedAt: new Date("2025-01-01") }
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(NftTarget);
      expect(subscription.target.type).toBe("nft");
      expect(subscription.target.state.lastNotifiedPrice).toBe(2.5);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      expect(subscription.userId).toBe("user456");
      
      expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
      expect(subscription.strategy.config.threshold).toBe(0.5);
      expect(subscription.strategy.config.mode).toBe("absolute");
    });

    it("should use default values when optional parameters are not provided", () => {
      const beforeCreation = new Date();
      
      const params: PriceChangeSubscriptionParams = {
        userId: "user789",
        threshold: 15,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "ETH", address: "0x456" },
        targetState: { lastNotifiedPrice: 200, lastNotifiedAt: new Date() }
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);

      const afterCreation = new Date();

      expect(subscription.isActive).toBe(true);
      expect(subscription._id).toBe(null);
      expect(subscription.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(subscription.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(subscription.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it("should handle different price change modes", () => {
      const percentageParams: PriceChangeSubscriptionParams = {
        userId: "user1",
        threshold: 25,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const absoluteParams: PriceChangeSubscriptionParams = {
        userId: "user2",
        threshold: 50,
        mode: "absolute",
        targetType: "token",
        targetMeta: { symbol: "ETH", address: "0x456" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const percentageSubscription = SubscriptionFactory.createPriceChangeSubscription(percentageParams);
      const absoluteSubscription = SubscriptionFactory.createPriceChangeSubscription(absoluteParams);

      expect(percentageSubscription.strategy.config.mode).toBe("percentage");
      expect(absoluteSubscription.strategy.config.mode).toBe("absolute");
    });

    it("should handle edge case values", () => {
      // Zero threshold
      const zeroThresholdParams: PriceChangeSubscriptionParams = {
        userId: "user1",
        threshold: 0,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };
      const zeroThreshold = SubscriptionFactory.createPriceChangeSubscription(zeroThresholdParams);
      expect(zeroThreshold.strategy.config.threshold).toBe(0);

      // Zero price
      const zeroPriceParams: PriceChangeSubscriptionParams = {
        userId: "user2",
        threshold: 10,
        mode: "absolute",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "456" },
        targetState: { lastNotifiedPrice: 0, lastNotifiedAt: new Date() }
      };
      const zeroPrice = SubscriptionFactory.createPriceChangeSubscription(zeroPriceParams);
      expect(zeroPrice.target.state.lastNotifiedPrice).toBe(0);

      // Very small values
      const smallValuesParams: PriceChangeSubscriptionParams = {
        userId: "user3",
        threshold: 0.001,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "SHIB", address: "0x789" },
        targetState: { lastNotifiedPrice: 0.0001, lastNotifiedAt: new Date() }
      };
      const smallValues = SubscriptionFactory.createPriceChangeSubscription(smallValuesParams);
      expect(smallValues.strategy.config.threshold).toBe(0.001);
      expect(smallValues.target.state.lastNotifiedPrice).toBe(0.0001);

      // Large values
      const largeValuesParams: PriceChangeSubscriptionParams = {
        userId: "user4",
        threshold: 1000000,
        mode: "absolute",
        targetType: "token",
        targetMeta: { symbol: "LARGE", address: "0xdef" },
        targetState: { lastNotifiedPrice: Number.MAX_SAFE_INTEGER, lastNotifiedAt: new Date() }
      };
      const largeValues = SubscriptionFactory.createPriceChangeSubscription(largeValuesParams);
      expect(largeValues.strategy.config.threshold).toBe(1000000);
      expect(largeValues.target.state.lastNotifiedPrice).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("createPriceChangeSubscription - Error Cases", () => {
    it("should throw FactoryException for unknown target type", () => {
      const invalidParams = {
        userId: "user1",
        threshold: 10,
        mode: "percentage" as const,
        targetType: "unknown" as any,
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(invalidParams);
      }).toThrow(FactoryException);

      try {
        SubscriptionFactory.createPriceChangeSubscription(invalidParams);
      } catch (error) {
        expect(error).toBeInstanceOf(FactoryException);
        expect((error as FactoryException).message).toContain("unknown target type");
        expect((error as FactoryException).message).toContain("unknown");
      }
    });

    it("should handle custom _id and timestamps", () => {
      const customDate = new Date("2025-01-01");
      const params: PriceChangeSubscriptionParams = {
        _id: "custom123",
        userId: "user1",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        isActive: false,
        createdAt: customDate,
        updatedAt: customDate
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);
      
      expect(subscription._id).toBe("custom123");
      expect(subscription.isActive).toBe(false);
      expect(subscription.createdAt).toEqual(customDate);
      expect(subscription.updatedAt).toEqual(customDate);
    });
  });

  describe("createIntervalChangeSubscription", () => {
    it("should create interval change subscription with TokenTarget", () => {
      const params: IntervalSubscriptionParams = {
        userId: "user123",
        intervalMs: 3600000,
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") }
      };

      const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(TokenTarget);
      expect(subscription.target.type).toBe("token");
      expect(subscription.target.state.lastNotifiedPrice).toBe(100);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      expect(subscription.userId).toBe("user123");
      expect(subscription.isActive).toBe(true);
      
      expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
      expect(subscription.strategy.type).toBe("interval-change");
      expect(subscription.strategy.config.intervalMs).toBe(3600000);
    });

    it("should create interval change subscription with NftTarget", () => {
      const params: IntervalSubscriptionParams = {
        userId: "user456",
        intervalMs: 1800000,
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "123" },
        targetState: { lastNotifiedPrice: 5.5, lastNotifiedAt: new Date("2025-01-01") }
      };

      const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.target).toBeInstanceOf(NftTarget);
      expect(subscription.target.type).toBe("nft");
      expect(subscription.target.state.lastNotifiedPrice).toBe(5.5);
      expect(subscription.target.state.lastNotifiedAt).toEqual(new Date("2025-01-01"));
      expect(subscription.userId).toBe("user456");
      
      expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
      expect(subscription.strategy.config.intervalMs).toBe(1800000);
    });

    it("should use default values when optional parameters are not provided", () => {
      const beforeCreation = new Date();
      
      const params: IntervalSubscriptionParams = {
        userId: "user789",
        intervalMs: 60000,
        targetType: "token",
        targetMeta: { symbol: "ETH", address: "0x456" },
        targetState: { lastNotifiedPrice: 150, lastNotifiedAt: new Date() }
      };

      const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);

      const afterCreation = new Date();

      expect(subscription.isActive).toBe(true);
      expect(subscription._id).toBe(null);
      expect(subscription.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(subscription.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(subscription.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it("should handle different interval values", () => {
      const intervals = [
        { ms: 1000, desc: "1 second" },
        { ms: 60000, desc: "1 minute" },
        { ms: 3600000, desc: "1 hour" },
        { ms: 86400000, desc: "1 day" },
      ];

      intervals.forEach(({ ms }) => {
        const params: IntervalSubscriptionParams = {
          userId: `user${ms}`,
          intervalMs: ms,
          targetType: "token",
          targetMeta: { symbol: "TEST", address: "0x123" },
          targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
        };
        const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);
        expect(subscription.strategy.config.intervalMs).toBe(ms);
      });
    });

    it("should handle edge case values", () => {
      // Minimum allowed interval
      const minIntervalParams: IntervalSubscriptionParams = {
        userId: "user1",
        intervalMs: 1000,
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };
      const minInterval = SubscriptionFactory.createIntervalChangeSubscription(minIntervalParams);
      expect(minInterval.strategy.config.intervalMs).toBe(1000);

      // Fractional interval above minimum
      const fractionalIntervalParams: IntervalSubscriptionParams = {
        userId: "user2",
        intervalMs: 1500.5,
        targetType: "token",
        targetMeta: { symbol: "ETH", address: "0x456" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };
      const fractionalInterval = SubscriptionFactory.createIntervalChangeSubscription(fractionalIntervalParams);
      expect(fractionalInterval.strategy.config.intervalMs).toBe(1500.5);

      // Large interval
      const largeIntervalParams: IntervalSubscriptionParams = {
        userId: "user3",
        intervalMs: Number.MAX_SAFE_INTEGER,
        targetType: "token",
        targetMeta: { symbol: "LARGE", address: "0x789" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };
      const largeInterval = SubscriptionFactory.createIntervalChangeSubscription(largeIntervalParams);
      expect(largeInterval.strategy.config.intervalMs).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe("createIntervalChangeSubscription - Error Cases", () => {
    it("should throw FactoryException for unknown target type", () => {
      const invalidParams = {
        userId: "user1",
        intervalMs: 3600000,
        targetType: "unknown" as any,
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(invalidParams);
      }).toThrow(FactoryException);

      try {
        SubscriptionFactory.createIntervalChangeSubscription(invalidParams);
      } catch (error) {
        expect(error).toBeInstanceOf(FactoryException);
        expect((error as FactoryException).message).toContain("unknown target type");
        expect((error as FactoryException).message).toContain("unknown");
      }
    });

    it("should handle custom _id and timestamps", () => {
      const customDate = new Date("2025-01-01");
      const params: IntervalSubscriptionParams = {
        _id: "custom456",
        userId: "user1",
        intervalMs: 3600000,
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        isActive: false,
        createdAt: customDate,
        updatedAt: customDate
      };

      const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);
      
      expect(subscription._id).toBe("custom456");
      expect(subscription.isActive).toBe(false);
      expect(subscription.createdAt).toEqual(customDate);
      expect(subscription.updatedAt).toEqual(customDate);
    });
  });

  describe("Private createTarget Method (through public methods)", () => {
    it("should create correct target types", () => {
      const tokenParams: PriceChangeSubscriptionParams = {
        userId: "user1",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const nftParams: PriceChangeSubscriptionParams = {
        userId: "user2",
        threshold: 10,
        mode: "percentage",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "456" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const tokenSubscription = SubscriptionFactory.createPriceChangeSubscription(tokenParams);
      const nftSubscription = SubscriptionFactory.createPriceChangeSubscription(nftParams);

      expect(tokenSubscription.target.type).toBe("token");
      expect(tokenSubscription.target).toBeInstanceOf(TokenTarget);
      
      expect(nftSubscription.target.type).toBe("nft");
      expect(nftSubscription.target).toBeInstanceOf(NftTarget);
    });

    it("should pass state correctly to targets", () => {
      const testDate = new Date("2025-06-15T14:30:00Z");
      const testPrice = 42.5;

      const params: PriceChangeSubscriptionParams = {
        userId: "user1",
        threshold: 5,
        mode: "absolute",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "789" },
        targetState: { lastNotifiedPrice: testPrice, lastNotifiedAt: testDate }
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);

      expect(subscription.target.state.lastNotifiedPrice).toBe(testPrice);
      expect(subscription.target.state.lastNotifiedAt).toEqual(testDate);
    });
  });

  describe("Integration Tests", () => {
    it("should create functional price change subscription", () => {
      const params: PriceChangeSubscriptionParams = {
        userId: "user1",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0x123" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") }
      };

      const subscription = SubscriptionFactory.createPriceChangeSubscription(params);

      // Test that the subscription works correctly
      expect(subscription.shouldNotify(120)).toBe(true); // 20% increase
      expect(subscription.shouldNotify(105)).toBe(false); // 5% increase

      // Test notification and update
      const updated = subscription.notifyAndUpdate(120);
      expect(updated.target.state.lastNotifiedPrice).toBe(120);
      expect(updated.target).not.toBe(subscription.target);
    });

    it("should create functional interval change subscription", () => {
      const params: IntervalSubscriptionParams = {
        userId: "user2",
        intervalMs: 3600000,
        targetType: "nft",
        targetMeta: { collectionAddress: "0xabc", tokenId: "123" },
        targetState: { lastNotifiedPrice: 2.5, lastNotifiedAt: new Date("2025-01-01T00:00:00Z") }
      };

      const subscription = SubscriptionFactory.createIntervalChangeSubscription(params);

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
      const btcParams: PriceChangeSubscriptionParams = {
        userId: "crypto_user1",
        threshold: 5,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "BTC", address: "0xbtc123" },
        targetState: { lastNotifiedPrice: 50000, lastNotifiedAt: new Date() }
      };

      const ethParams: PriceChangeSubscriptionParams = {
        userId: "crypto_user2",
        threshold: 100,
        mode: "absolute",
        targetType: "token",
        targetMeta: { symbol: "ETH", address: "0xeth456" },
        targetState: { lastNotifiedPrice: 3000, lastNotifiedAt: new Date() }
      };

      const btcSubscription = SubscriptionFactory.createPriceChangeSubscription(btcParams);
      const ethSubscription = SubscriptionFactory.createPriceChangeSubscription(ethParams);

      expect(btcSubscription.strategy.config.threshold).toBe(5);
      expect(btcSubscription.strategy.config.mode).toBe("percentage");
      expect(ethSubscription.strategy.config.threshold).toBe(100);
      expect(ethSubscription.strategy.config.mode).toBe("absolute");
    });

    it("should create NFT floor price monitoring subscriptions", () => {
      const nftFloorParams: PriceChangeSubscriptionParams = {
        userId: "nft_user1",
        threshold: 0.1,
        mode: "absolute",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xpunks", tokenId: "1234" },
        targetState: { lastNotifiedPrice: 5.5, lastNotifiedAt: new Date() }
      };

      const nftPercentageParams: PriceChangeSubscriptionParams = {
        userId: "nft_user2",
        threshold: 15,
        mode: "percentage",
        targetType: "nft",
        targetMeta: { collectionAddress: "0xbayc", tokenId: "5678" },
        targetState: { lastNotifiedPrice: 2.0, lastNotifiedAt: new Date() }
      };

      const nftFloorSubscription = SubscriptionFactory.createPriceChangeSubscription(nftFloorParams);
      const nftPercentageSubscription = SubscriptionFactory.createPriceChangeSubscription(nftPercentageParams);

      expect(nftFloorSubscription.target.type).toBe("nft");
      expect(nftFloorSubscription.strategy.config.mode).toBe("absolute");
      expect(nftPercentageSubscription.strategy.config.mode).toBe("percentage");
    });

    it("should create time-based notification subscriptions", () => {
      const hourlyParams: IntervalSubscriptionParams = {
        userId: "time_user1",
        intervalMs: 3600000,
        targetType: "token",
        targetMeta: { symbol: "USDC", address: "0xusdc" },
        targetState: { lastNotifiedPrice: 1000, lastNotifiedAt: new Date() }
      };

      const dailyParams: IntervalSubscriptionParams = {
        userId: "time_user2",
        intervalMs: 86400000,
        targetType: "nft",
        targetMeta: { collectionAddress: "0xart", tokenId: "999" },
        targetState: { lastNotifiedPrice: 10.0, lastNotifiedAt: new Date() }
      };

      const hourlyCheck = SubscriptionFactory.createIntervalChangeSubscription(hourlyParams);
      const dailyReport = SubscriptionFactory.createIntervalChangeSubscription(dailyParams);

      expect(hourlyCheck.strategy.config.intervalMs).toBe(3600000);
      expect(dailyReport.strategy.config.intervalMs).toBe(86400000);
      expect(dailyReport.target.type).toBe("nft");
    });
  });

  describe("Factory Method Consistency", () => {
    it("should create subscriptions with consistent internal structure", () => {
      const priceParams: PriceChangeSubscriptionParams = {
        userId: "consistency_user",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "TEST", address: "0xtest" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const intervalParams: IntervalSubscriptionParams = {
        userId: "consistency_user",
        intervalMs: 3600000,
        targetType: "token",
        targetMeta: { symbol: "TEST", address: "0xtest" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const priceSubscription = SubscriptionFactory.createPriceChangeSubscription(priceParams);
      const intervalSubscription = SubscriptionFactory.createIntervalChangeSubscription(intervalParams);

      // Both should have the same target structure when created with same parameters
      expect(priceSubscription.target.state.lastNotifiedPrice).toBe(
        intervalSubscription.target.state.lastNotifiedPrice
      );
      expect(priceSubscription.target.type).toBe(intervalSubscription.target.type);
      expect(priceSubscription.userId).toBe(intervalSubscription.userId);
      
      // But different strategy types
      expect(priceSubscription.strategy.type).toBe("price-change");
      expect(intervalSubscription.strategy.type).toBe("interval-change");
    });

    it("should handle parameter validation consistently", () => {
      const validPriceParams: PriceChangeSubscriptionParams = {
        userId: "validation_user1",
        threshold: 10,
        mode: "percentage",
        targetType: "token",
        targetMeta: { symbol: "TEST", address: "0xtest" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      const validIntervalParams: IntervalSubscriptionParams = {
        userId: "validation_user2",
        intervalMs: 3600000,
        targetType: "token",
        targetMeta: { symbol: "TEST", address: "0xtest" },
        targetState: { lastNotifiedPrice: 100, lastNotifiedAt: new Date() }
      };

      // All valid parameters should work
      expect(() => {
        SubscriptionFactory.createPriceChangeSubscription(validPriceParams);
      }).not.toThrow();

      expect(() => {
        SubscriptionFactory.createIntervalChangeSubscription(validIntervalParams);
      }).not.toThrow();
    });
  });
});