import { describe, it, expect } from "vitest";
import { SubscriptionFactory } from "#domain/factories";
import { TokenTarget, NftTarget } from "#domain/entities/target";
import {
  PriceChangeStrategy,
  TimeIntervalStrategy,
} from "#domain/entities/strategy";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException } from "#domain/exceptions";

describe("SubscriptionFactory", () => {
  describe("createSubscription", () => {
    let nftTarget: NftTarget;
    let tokenTarget: TokenTarget;

    beforeEach(() => {
      nftTarget = new NftTarget(
        {
          name: "NFT COLLECTION",
          slug: "nft-slug",
          source: "opensea",
          chain: "ethereum",
          symbol: "ETH",
        },
        { lastNotifiedPrice: 2.5, lastNotifiedAt: new Date("2025-01-01") },
      );

      tokenTarget = new TokenTarget(
        { symbol: "BTC", source: "binance", decimals: 18 },
        { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") },
      );
    });

    describe("Price Change Subscriptions", () => {
      it("should create price change subscription with TokenTarget", () => {
        const strategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });

        const dto = {
          _id: null,
          userId: "user123",
          target: tokenTarget,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        expect(subscription).toBeInstanceOf(Subscription);
        expect(subscription.target).toBeInstanceOf(TokenTarget);
        expect(subscription.target.type).toBe("token");
        expect(subscription.target.state.lastNotifiedPrice).toBe(100);
        expect(subscription.target.state.lastNotifiedAt).toEqual(
          new Date("2025-01-01"),
        );
        expect(subscription.userId).toBe("user123");
        expect(subscription.isActive).toBe(true);

        expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
        expect(subscription.strategy.type).toBe("price-change");
        expect(
          (subscription.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(10);
        expect((subscription.strategy as PriceChangeStrategy).config.mode).toBe(
          "percentage",
        );
      });

      it("should create price change subscription with NftTarget", () => {
        const strategy = new PriceChangeStrategy({
          threshold: 0.5,
          mode: "absolute",
        });

        const dto = {
          _id: null,
          userId: "user456",
          target: nftTarget,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        expect(subscription).toBeInstanceOf(Subscription);
        expect(subscription.target).toBeInstanceOf(NftTarget);
        expect(subscription.target.type).toBe("nft");
        expect(subscription.target.state.lastNotifiedPrice).toBe(2.5);
        expect(subscription.target.state.lastNotifiedAt).toEqual(
          new Date("2025-01-01"),
        );
        expect(subscription.userId).toBe("user456");

        expect(subscription.strategy).toBeInstanceOf(PriceChangeStrategy);
        expect(
          (subscription.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(0.5);
        expect((subscription.strategy as PriceChangeStrategy).config.mode).toBe(
          "absolute",
        );
      });

      it("should handle different price change modes", () => {
        const percentageStrategy = new PriceChangeStrategy({
          threshold: 25,
          mode: "percentage",
        });

        const absoluteStrategy = new PriceChangeStrategy({
          threshold: 50,
          mode: "absolute",
        });

        const percentageDto = {
          _id: null,
          userId: "user1",
          target: tokenTarget,
          strategy: percentageStrategy,
          isActive: true,
        };

        const absoluteDto = {
          _id: null,
          userId: "user2",
          target: tokenTarget,
          strategy: absoluteStrategy,
          isActive: true,
        };

        const percentageSubscription =
          SubscriptionFactory.createSubscription(percentageDto);
        const absoluteSubscription =
          SubscriptionFactory.createSubscription(absoluteDto);

        expect(
          (percentageSubscription.strategy as PriceChangeStrategy).config.mode,
        ).toBe("percentage");
        expect(
          (absoluteSubscription.strategy as PriceChangeStrategy).config.mode,
        ).toBe("absolute");
      });

      it("should handle edge case values", () => {
        const zeroStrategy = new PriceChangeStrategy({
          threshold: 0,
          mode: "percentage",
        });
        const zeroDto = {
          _id: null,
          userId: "user1",
          target: tokenTarget,
          strategy: zeroStrategy,
          isActive: true,
        };
        const zeroThreshold = SubscriptionFactory.createSubscription(zeroDto);
        expect(
          (zeroThreshold.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(0);

        // Zero price
        const zeroPriceTarget = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 0, lastNotifiedAt: new Date() },
        );
        const zeroPriceStrategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "absolute",
        });
        const zeroPriceDto = {
          _id: null,
          userId: "user2",
          target: zeroPriceTarget,
          strategy: zeroPriceStrategy,
          isActive: true,
        };
        const zeroPrice = SubscriptionFactory.createSubscription(zeroPriceDto);
        expect(zeroPrice.target.state.lastNotifiedPrice).toBe(0);

        // Very small values
        const smallTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 0.0001, lastNotifiedAt: new Date() },
        );
        const smallStrategy = new PriceChangeStrategy({
          threshold: 0.001,
          mode: "percentage",
        });
        const smallDto = {
          _id: null,
          userId: "user3",
          target: smallTarget,
          strategy: smallStrategy,
          isActive: true,
        };
        const smallValues = SubscriptionFactory.createSubscription(smallDto);
        expect(
          (smallValues.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(0.001);
        expect(smallValues.target.state.lastNotifiedPrice).toBe(0.0001);

        // Large values
        const largeTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          {
            lastNotifiedPrice: Number.MAX_SAFE_INTEGER,
            lastNotifiedAt: new Date(),
          },
        );
        const largeStrategy = new PriceChangeStrategy({
          threshold: 1000000,
          mode: "absolute",
        });
        const largeDto = {
          _id: null,
          userId: "user4",
          target: largeTarget,
          strategy: largeStrategy,
          isActive: true,
        };
        const largeValues = SubscriptionFactory.createSubscription(largeDto);
        expect(
          (largeValues.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(1000000);
        expect(largeValues.target.state.lastNotifiedPrice).toBe(
          Number.MAX_SAFE_INTEGER,
        );
      });
    });

    describe("Interval Change Subscriptions", () => {
      it("should create interval change subscription with TokenTarget", () => {
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") },
        );

        const strategy = new TimeIntervalStrategy({
          intervalMs: 3600000,
        });

        const dto = {
          _id: null,
          userId: "user123",
          target,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        expect(subscription).toBeInstanceOf(Subscription);
        expect(subscription.target).toBeInstanceOf(TokenTarget);
        expect(subscription.target.type).toBe("token");
        expect(subscription.target.state.lastNotifiedPrice).toBe(100);
        expect(subscription.target.state.lastNotifiedAt).toEqual(
          new Date("2025-01-01"),
        );
        expect(subscription.userId).toBe("user123");
        expect(subscription.isActive).toBe(true);

        expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
        expect(subscription.strategy.type).toBe("interval-change");
        expect(
          (subscription.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(3600000);
      });

      it("should create interval change subscription with NftTarget", () => {
        const target = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 5.5, lastNotifiedAt: new Date("2025-01-01") },
        );

        const strategy = new TimeIntervalStrategy({
          intervalMs: 1800000,
        });

        const dto = {
          _id: null,
          userId: "user456",
          target,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        expect(subscription).toBeInstanceOf(Subscription);
        expect(subscription.target).toBeInstanceOf(NftTarget);
        expect(subscription.target.type).toBe("nft");
        expect(subscription.target.state.lastNotifiedPrice).toBe(5.5);
        expect(subscription.target.state.lastNotifiedAt).toEqual(
          new Date("2025-01-01"),
        );
        expect(subscription.userId).toBe("user456");

        expect(subscription.strategy).toBeInstanceOf(TimeIntervalStrategy);
        expect(
          (subscription.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(1800000);
      });

      it("should handle different interval values", () => {
        const intervals = [
          { ms: 1000, desc: "1 second" },
          { ms: 60000, desc: "1 minute" },
          { ms: 3600000, desc: "1 hour" },
          { ms: 86400000, desc: "1 day" },
        ];

        intervals.forEach(({ ms }) => {
          const target = new TokenTarget(
            { symbol: "BTC", source: "binance", decimals: 18 },
            { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
          );
          const strategy = new TimeIntervalStrategy({ intervalMs: ms });
          const dto = {
            _id: null,
            userId: `user${ms}`,
            target,
            strategy,
            isActive: true,
          };
          const subscription = SubscriptionFactory.createSubscription(dto);
          expect(
            (subscription.strategy as TimeIntervalStrategy).config.intervalMs,
          ).toBe(ms);
        });
      });

      it("should handle edge case values", () => {
        // Minimum allowed interval
        const minTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );
        const minStrategy = new TimeIntervalStrategy({ intervalMs: 1000 });
        const minDto = {
          _id: null,
          userId: "user1",
          target: minTarget,
          strategy: minStrategy,
          isActive: true,
        };
        const minInterval = SubscriptionFactory.createSubscription(minDto);
        expect(
          (minInterval.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(1000);

        // Fractional interval above minimum
        const fractionalTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );
        const fractionalStrategy = new TimeIntervalStrategy({
          intervalMs: 1500.5,
        });
        const fractionalDto = {
          _id: null,
          userId: "user2",
          target: fractionalTarget,
          strategy: fractionalStrategy,
          isActive: true,
        };
        const fractionalInterval =
          SubscriptionFactory.createSubscription(fractionalDto);
        expect(
          (fractionalInterval.strategy as TimeIntervalStrategy).config
            .intervalMs,
        ).toBe(1500.5);

        // Large interval
        const largeTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );
        const largeStrategy = new TimeIntervalStrategy({
          intervalMs: Number.MAX_SAFE_INTEGER,
        });
        const largeDto = {
          _id: null,
          userId: "user3",
          target: largeTarget,
          strategy: largeStrategy,
          isActive: true,
        };
        const largeInterval = SubscriptionFactory.createSubscription(largeDto);
        expect(
          (largeInterval.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe("Factory Configuration", () => {
      it("should use default values when optional parameters are not provided", () => {
        const beforeCreation = new Date();

        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 150, lastNotifiedAt: new Date() },
        );
        const strategy = new PriceChangeStrategy({
          threshold: 15,
          mode: "percentage",
        });
        const dto = {
          _id: null,
          userId: "user789",
          target,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        const afterCreation = new Date();

        expect(subscription.isActive).toBe(true);
        expect(subscription._id).toBe(null);
        expect(subscription.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreation.getTime(),
        );
        expect(subscription.createdAt.getTime()).toBeLessThanOrEqual(
          afterCreation.getTime(),
        );
        expect(subscription.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreation.getTime(),
        );
        expect(subscription.updatedAt.getTime()).toBeLessThanOrEqual(
          afterCreation.getTime(),
        );
      });

      it("should handle custom _id and timestamps", () => {
        const customDate = new Date("2025-01-01");
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );
        const strategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });
        const dto = {
          _id: "custom123",
          userId: "user1",
          target,
          strategy,
          isActive: false,
          createdAt: customDate,
          updatedAt: customDate,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        expect(subscription._id).toBe("custom123");
        expect(subscription.isActive).toBe(false);
        expect(subscription.createdAt).toEqual(customDate);
        expect(subscription.updatedAt).toEqual(customDate);
      });

      it("should handle both active and inactive subscriptions", () => {
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );
        const strategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });

        const activeDto = {
          _id: null,
          userId: "user1",
          target,
          strategy,
          isActive: true,
        };

        const inactiveDto = {
          _id: null,
          userId: "user2",
          target,
          strategy,
          isActive: false,
        };

        const activeSubscription =
          SubscriptionFactory.createSubscription(activeDto);
        const inactiveSubscription =
          SubscriptionFactory.createSubscription(inactiveDto);

        expect(activeSubscription.isActive).toBe(true);
        expect(inactiveSubscription.isActive).toBe(false);
      });
    });

    describe("Error Cases", () => {
      it("should throw FactoryException for unknown strategy type", () => {
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );

        // Create a mock strategy with unknown type
        const invalidStrategy = {
          type: "unknown-strategy" as any,
          config: { threshold: 10, mode: "percentage" },
        };

        const dto = {
          _id: null,
          userId: "user1",
          target,
          strategy: invalidStrategy,
          isActive: true,
        };

        expect(() => {
          SubscriptionFactory.createSubscription(dto as any);
        }).toThrow(FactoryException);

        try {
          SubscriptionFactory.createSubscription(dto as any);
        } catch (error) {
          expect(error).toBeInstanceOf(FactoryException);
          expect((error as FactoryException).message).toContain(
            "Unknown subscription kind",
          );
          expect((error as FactoryException).message).toContain(
            "unknown-strategy",
          );
        }
      });
    });

    describe("Integration Tests", () => {
      it("should create functional price change subscription", () => {
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date("2025-01-01") },
        );
        const strategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });
        const dto = {
          _id: null,
          userId: "user1",
          target,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        // Test that the subscription works correctly
        expect(subscription.shouldNotify(120)).toBe(true); // 20% increase
        expect(subscription.shouldNotify(105)).toBe(false); // 5% increase

        // Test notification and update
        const updated = subscription.notifyAndUpdate(120);
        expect(updated.target.state.lastNotifiedPrice).toBe(120);
        expect(updated.target).not.toBe(subscription.target);
      });

      it("should create functional interval change subscription", () => {
        const target = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          {
            lastNotifiedPrice: 2.5,
            lastNotifiedAt: new Date("2025-01-01T00:00:00Z"),
          },
        );
        const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 });
        const dto = {
          _id: null,
          userId: "user2",
          target,
          strategy,
          isActive: true,
        };

        const subscription = SubscriptionFactory.createSubscription(dto);

        // Test that the subscription works correctly
        const after2hours = new Date("2025-01-01T02:00:00Z");
        const after30min = new Date("2025-01-01T00:30:00Z");

        expect(subscription.shouldNotify(after2hours)).toBe(true); // 2 hours > 1 hour
        expect(subscription.shouldNotify(after30min)).toBe(false); // 30 min < 1 hour

        // Test notification and update
        const updated = subscription.notifyAndUpdate(3.0);
        expect(updated.target.state.lastNotifiedPrice).toBe(3.0);
        expect(updated.target.state.lastNotifiedAt.getTime()).toBeGreaterThan(
          subscription.target.state.lastNotifiedAt.getTime(),
        );
      });
    });

    describe("Real-World Factory Usage Scenarios", () => {
      it("should create crypto price monitoring subscriptions", () => {
        const btcTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 50000, lastNotifiedAt: new Date() },
        );
        const ethTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 3000, lastNotifiedAt: new Date() },
        );

        const btcStrategy = new PriceChangeStrategy({
          threshold: 5,
          mode: "percentage",
        });
        const ethStrategy = new PriceChangeStrategy({
          threshold: 100,
          mode: "absolute",
        });

        const btcDto = {
          _id: null,
          userId: "crypto_user1",
          target: btcTarget,
          strategy: btcStrategy,
          isActive: true,
        };

        const ethDto = {
          _id: null,
          userId: "crypto_user2",
          target: ethTarget,
          strategy: ethStrategy,
          isActive: true,
        };

        const btcSubscription = SubscriptionFactory.createSubscription(btcDto);
        const ethSubscription = SubscriptionFactory.createSubscription(ethDto);

        expect(
          (btcSubscription.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(5);
        expect(
          (btcSubscription.strategy as PriceChangeStrategy).config.mode,
        ).toBe("percentage");
        expect(
          (ethSubscription.strategy as PriceChangeStrategy).config.threshold,
        ).toBe(100);
        expect(
          (ethSubscription.strategy as PriceChangeStrategy).config.mode,
        ).toBe("absolute");
      });

      it("should create NFT floor price monitoring subscriptions", () => {
        const punksTarget = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 5.5, lastNotifiedAt: new Date() },
        );
        const baycTarget = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 2.0, lastNotifiedAt: new Date() },
        );

        const absoluteStrategy = new PriceChangeStrategy({
          threshold: 0.1,
          mode: "absolute",
        });
        const percentageStrategy = new PriceChangeStrategy({
          threshold: 15,
          mode: "percentage",
        });

        const punksDto = {
          _id: null,
          userId: "nft_user1",
          target: punksTarget,
          strategy: absoluteStrategy,
          isActive: true,
        };

        const baycDto = {
          _id: null,
          userId: "nft_user2",
          target: baycTarget,
          strategy: percentageStrategy,
          isActive: true,
        };

        const nftFloorSubscription =
          SubscriptionFactory.createSubscription(punksDto);
        const nftPercentageSubscription =
          SubscriptionFactory.createSubscription(baycDto);

        expect(nftFloorSubscription.target.type).toBe("nft");
        expect(
          (nftFloorSubscription.strategy as PriceChangeStrategy).config.mode,
        ).toBe("absolute");
        expect(
          (nftPercentageSubscription.strategy as PriceChangeStrategy).config
            .mode,
        ).toBe("percentage");
      });

      it("should create time-based notification subscriptions", () => {
        const usdcTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 1000, lastNotifiedAt: new Date() },
        );
        const artTarget = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 10.0, lastNotifiedAt: new Date() },
        );

        const hourlyStrategy = new TimeIntervalStrategy({
          intervalMs: 3600000,
        });
        const dailyStrategy = new TimeIntervalStrategy({
          intervalMs: 86400000,
        });

        const hourlyDto = {
          _id: null,
          userId: "time_user1",
          target: usdcTarget,
          strategy: hourlyStrategy,
          isActive: true,
        };

        const dailyDto = {
          _id: null,
          userId: "time_user2",
          target: artTarget,
          strategy: dailyStrategy,
          isActive: true,
        };

        const hourlyCheck = SubscriptionFactory.createSubscription(hourlyDto);
        const dailyReport = SubscriptionFactory.createSubscription(dailyDto);

        expect(
          (hourlyCheck.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(3600000);
        expect(
          (dailyReport.strategy as TimeIntervalStrategy).config.intervalMs,
        ).toBe(86400000);
        expect(dailyReport.target.type).toBe("nft");
      });
    });

    describe("Factory Method Consistency", () => {
      it("should create subscriptions with consistent internal structure", () => {
        const target = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );

        const priceStrategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });
        const intervalStrategy = new TimeIntervalStrategy({
          intervalMs: 3600000,
        });

        const priceDto = {
          _id: null,
          userId: "consistency_user",
          target,
          strategy: priceStrategy,
          isActive: true,
        };

        const intervalDto = {
          _id: null,
          userId: "consistency_user",
          target,
          strategy: intervalStrategy,
          isActive: true,
        };

        const priceSubscription =
          SubscriptionFactory.createSubscription(priceDto);
        const intervalSubscription =
          SubscriptionFactory.createSubscription(intervalDto);

        // Both should have the same target structure when created with same target
        expect(priceSubscription.target.state.lastNotifiedPrice).toBe(
          intervalSubscription.target.state.lastNotifiedPrice,
        );
        expect(priceSubscription.target.type).toBe(
          intervalSubscription.target.type,
        );
        expect(priceSubscription.userId).toBe(intervalSubscription.userId);

        // But different strategy types
        expect(priceSubscription.strategy.type).toBe("price-change");
        expect(intervalSubscription.strategy.type).toBe("interval-change");
      });

      it("should handle parameter validation consistently", () => {
        const tokenTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );

        const priceStrategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });
        const intervalStrategy = new TimeIntervalStrategy({
          intervalMs: 3600000,
        });

        const validPriceDto = {
          _id: null,
          userId: "validation_user1",
          target: tokenTarget,
          strategy: priceStrategy,
          isActive: true,
        };

        const validIntervalDto = {
          _id: null,
          userId: "validation_user2",
          target: tokenTarget,
          strategy: intervalStrategy,
          isActive: true,
        };

        // All valid parameters should work
        expect(() => {
          SubscriptionFactory.createSubscription(validPriceDto);
        }).not.toThrow();

        expect(() => {
          SubscriptionFactory.createSubscription(validIntervalDto);
        }).not.toThrow();
      });
    });

    describe("Target and Strategy Independence", () => {
      it("should work with any combination of targets and strategies", () => {
        const tokenTarget = new TokenTarget(
          { symbol: "BTC", source: "binance", decimals: 18 },
          { lastNotifiedPrice: 100, lastNotifiedAt: new Date() },
        );

        const nftTarget = new NftTarget(
          {
            name: "NFT COLLECTION",
            slug: "nft-slug",
            source: "opensea",
            chain: "ethereum",
            symbol: "ETH",
          },
          { lastNotifiedPrice: 2.5, lastNotifiedAt: new Date() },
        );

        const priceStrategy = new PriceChangeStrategy({
          threshold: 10,
          mode: "percentage",
        });
        const intervalStrategy = new TimeIntervalStrategy({
          intervalMs: 3600000,
        });

        // Token + Price Strategy
        const tokenPriceDto = {
          _id: null,
          userId: "user1",
          target: tokenTarget,
          strategy: priceStrategy,
          isActive: true,
        };

        // Token + Interval Strategy
        const tokenIntervalDto = {
          _id: null,
          userId: "user2",
          target: tokenTarget,
          strategy: intervalStrategy,
          isActive: true,
        };

        // NFT + Price Strategy
        const nftPriceDto = {
          _id: null,
          userId: "user3",
          target: nftTarget,
          strategy: priceStrategy,
          isActive: true,
        };

        // NFT + Interval Strategy
        const nftIntervalDto = {
          _id: null,
          userId: "user4",
          target: nftTarget,
          strategy: intervalStrategy,
          isActive: true,
        };

        const tokenPrice =
          SubscriptionFactory.createSubscription(tokenPriceDto);
        const tokenInterval =
          SubscriptionFactory.createSubscription(tokenIntervalDto);
        const nftPrice = SubscriptionFactory.createSubscription(nftPriceDto);
        const nftInterval =
          SubscriptionFactory.createSubscription(nftIntervalDto);

        // Verify all combinations work
        expect(tokenPrice.target.type).toBe("token");
        expect(tokenPrice.strategy.type).toBe("price-change");

        expect(tokenInterval.target.type).toBe("token");
        expect(tokenInterval.strategy.type).toBe("interval-change");

        expect(nftPrice.target.type).toBe("nft");
        expect(nftPrice.strategy.type).toBe("price-change");

        expect(nftInterval.target.type).toBe("nft");
        expect(nftInterval.strategy.type).toBe("interval-change");
      });
    });
  });
});
