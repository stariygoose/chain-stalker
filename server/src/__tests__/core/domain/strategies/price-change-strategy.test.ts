import { describe, it, expect } from "vitest";
import { PriceChangeStrategy } from "#domain/entities/strategy";
import { StrategyException, InvalidNumberException } from "#domain/exceptions";

describe("PriceChangeStrategy", () => {
  describe("Constructor", () => {
    it("should create strategy with percentage mode", () => {
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10,
      });

      expect(strategy.type).toBe("price-change");
      expect(strategy.config.mode).toBe("percentage");
      expect(strategy.config.threshold).toBe(10);
    });

    it("should create strategy with absolute mode", () => {
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 50,
      });

      expect(strategy.type).toBe("price-change");
      expect(strategy.config.mode).toBe("absolute");
      expect(strategy.config.threshold).toBe(50);
    });

    it("should accept zero threshold", () => {
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 0,
      });

      expect(strategy.config.threshold).toBe(0);
    });

    it("should accept fractional thresholds", () => {
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 0.5,
      });

      expect(strategy.config.threshold).toBe(0.5);
    });

  });

  describe("Constructor - Error Cases", () => {
    it("should throw InvalidNumberException for invalid threshold values", () => {
      expect(() => {
        new PriceChangeStrategy({
          mode: "percentage",
          threshold: NaN,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new PriceChangeStrategy({
          mode: "absolute",
          threshold: Infinity,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new PriceChangeStrategy({
          mode: "percentage",
          threshold: -Infinity,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new PriceChangeStrategy({
          mode: "absolute",
          threshold: -10,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for non-number threshold", () => {
      expect(() => {
        new PriceChangeStrategy({
          mode: "percentage",
          threshold: "10" as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new PriceChangeStrategy({
          mode: "absolute",
          threshold: null as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new PriceChangeStrategy({
          mode: "percentage",
          threshold: undefined as any,
        });
      }).toThrow(InvalidNumberException);
    });
  });

  describe("shouldNotify - Percentage Mode", () => {
    let strategy: PriceChangeStrategy;

    beforeEach(() => {
      strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 10, // 10%
      });
    });

    it("should notify when percentage increase exceeds threshold", () => {
      // 100 -> 120 = 20% increase (exceeds 10%)
      expect(strategy.shouldNotify(100, 120)).toBe(true);

      // 100 -> 115 = 15% increase (exceeds 10%)
      expect(strategy.shouldNotify(100, 115)).toBe(true);

      // 50 -> 60 = 20% increase
      expect(strategy.shouldNotify(50, 60)).toBe(true);
    });

    it("should not notify when percentage increase is below threshold", () => {
      // 100 -> 105 = 5% increase (below 10%)
      expect(strategy.shouldNotify(100, 105)).toBe(false);

      // 100 -> 109 = 9% increase (below 10%)
      expect(strategy.shouldNotify(100, 109)).toBe(false);

      // 50 -> 54 = 8% increase
      expect(strategy.shouldNotify(50, 54)).toBe(false);
    });

    it("should handle exact threshold boundary", () => {
      // 100 -> 110 = exactly 10% increase
      expect(strategy.shouldNotify(100, 110)).toBe(true);

      // 50 -> 55 = exactly 10% increase
      expect(strategy.shouldNotify(50, 55)).toBe(true);
    });

    it("should handle price decreases", () => {
      // 100 -> 85 = 15% decrease (exceeds 10%)
      expect(strategy.shouldNotify(100, 85)).toBe(true);

      // 100 -> 95 = 5% decrease (below 10%)
      expect(strategy.shouldNotify(100, 95)).toBe(false);

      // 100 -> 90 = exactly 10% decrease
      expect(strategy.shouldNotify(100, 90)).toBe(true);
    });

    it("should handle zero current price", () => {
      // From 0 to any positive value = infinite % change, should always notify
      expect(strategy.shouldNotify(0, 1)).toBe(true);
      expect(strategy.shouldNotify(0, 0.01)).toBe(true);
      expect(strategy.shouldNotify(0, 100)).toBe(true);
    });

    it("should handle zero new price", () => {
      // From any positive to 0 = 100% decrease, should notify if threshold < 100
      expect(strategy.shouldNotify(100, 0)).toBe(true);
      expect(strategy.shouldNotify(0.01, 0)).toBe(true);
    });

    it("should handle same price (no change)", () => {
      // Same price = 0% change, should not notify
      expect(strategy.shouldNotify(100, 100)).toBe(false);
      expect(strategy.shouldNotify(0, 0)).toBe(false);
    });

    it("should work with fractional prices", () => {
      // 0.1 -> 0.12 = 20% increase
      expect(strategy.shouldNotify(0.1, 0.12)).toBe(true);

      // 0.1 -> 0.105 = 5% increase
      expect(strategy.shouldNotify(0.1, 0.105)).toBe(false);
    });

    it("should work with high precision calculations", () => {
      const preciseStrategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 0.1, // 0.1%
      });

      // Very small change that exceeds 0.1%
      expect(preciseStrategy.shouldNotify(1000, 1001.5)).toBe(true); // 0.15%
      expect(preciseStrategy.shouldNotify(1000, 1000.5)).toBe(false); // 0.05%
    });
  });

  describe("shouldNotify - Absolute Mode", () => {
    let strategy: PriceChangeStrategy;

    beforeEach(() => {
      strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 15,
      });
    });

    it("should notify when absolute change exceeds threshold", () => {
      // |100 - 120| = 20 (exceeds 15)
      expect(strategy.shouldNotify(100, 120)).toBe(true);

      // |100 - 85| = 15 (equals 15, should notify)
      expect(strategy.shouldNotify(100, 85)).toBe(true);

      // |50 - 70| = 20 (exceeds 15)
      expect(strategy.shouldNotify(50, 70)).toBe(true);
    });

    it("should not notify when absolute change is below threshold", () => {
      // |100 - 110| = 10 (below 15)
      expect(strategy.shouldNotify(100, 110)).toBe(false);

      // |100 - 90| = 10 (below 15)
      expect(strategy.shouldNotify(100, 90)).toBe(false);

      // |50 - 64| = 14 (below 15)
      expect(strategy.shouldNotify(50, 64)).toBe(false);
    });

    it("should handle exact threshold boundary", () => {
      // |100 - 115| = exactly 15
      expect(strategy.shouldNotify(100, 115)).toBe(true);

      // |100 - 85| = exactly 15
      expect(strategy.shouldNotify(100, 85)).toBe(true);
    });

    it("should work symmetrically for increases and decreases", () => {
      // Same absolute change, different directions
      expect(strategy.shouldNotify(100, 120)).toBe(strategy.shouldNotify(100, 80));
      expect(strategy.shouldNotify(50, 70)).toBe(strategy.shouldNotify(50, 30));
    });

    it("should handle zero prices", () => {
      // From 0 to 20 = absolute change of 20 (exceeds 15)
      expect(strategy.shouldNotify(0, 20)).toBe(true);

      // From 0 to 10 = absolute change of 10 (below 15)
      expect(strategy.shouldNotify(0, 10)).toBe(false);

      // From 20 to 0 = absolute change of 20 (exceeds 15)
      expect(strategy.shouldNotify(20, 0)).toBe(true);
    });

    it("should handle fractional changes", () => {
      const fractionalStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 0.5,
      });

      // 1.0 -> 1.6 = 0.6 absolute change (exceeds 0.5)
      expect(fractionalStrategy.shouldNotify(1.0, 1.6)).toBe(true);

      // 1.0 -> 1.3 = 0.3 absolute change (below 0.5)
      expect(fractionalStrategy.shouldNotify(1.0, 1.3)).toBe(false);
    });

    it("should handle very small thresholds", () => {
      const smallThresholdStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 0.001,
      });

      expect(smallThresholdStrategy.shouldNotify(1, 1.002)).toBe(true);
      expect(smallThresholdStrategy.shouldNotify(1, 1.0005)).toBe(false);
    });
  });

  describe("shouldNotify - Error Cases", () => {
    it("should throw StrategyException for unknown mode", () => {
      // Create a strategy with invalid mode by bypassing the constructor
      const invalidStrategy = Object.create(PriceChangeStrategy.prototype);
      invalidStrategy.config = {
        mode: "unknown-mode" as any,
        threshold: 10,
      };
      invalidStrategy.type = "price-change";

      expect(() => {
        invalidStrategy.shouldNotify(100, 120);
      }).toThrow(StrategyException);

      try {
        invalidStrategy.shouldNotify(100, 120);
      } catch (error) {
        expect(error).toBeInstanceOf(StrategyException);
        expect((error as StrategyException).message).toContain("unknown mode");
        expect((error as StrategyException).message).toContain("unknown-mode");
      }
    });
  });

  describe("Edge Cases and Extreme Values", () => {
    it("should handle extreme price values in percentage mode", () => {
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 50, // 50%
      });

      // Very large numbers
      expect(strategy.shouldNotify(1e10, 1.6e10)).toBe(true); // 60% increase
      expect(strategy.shouldNotify(1e10, 1.3e10)).toBe(false); // 30% increase

      // Very small numbers
      expect(strategy.shouldNotify(1e-10, 1.6e-10)).toBe(true); // 60% increase
      expect(strategy.shouldNotify(1e-10, 1.3e-10)).toBe(false); // 30% increase
    });

    it("should handle extreme price values in absolute mode", () => {
      const strategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 1e6, // 1 million
      });

      // Large numbers
      expect(strategy.shouldNotify(1e10, 1e10 + 2e6)).toBe(true); // Change of 2M
      expect(strategy.shouldNotify(1e10, 1e10 + 5e5)).toBe(false); // Change of 500K

      // Small numbers with large threshold
      expect(strategy.shouldNotify(1, 1000000.5)).toBe(false); // Change less than 1M
    });

    it("should handle precision edge cases", () => {
      const strategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 0.001, // 0.001%
      });

      // Very precise calculations
      const basePrice = 1000000;
      const priceWith0001Percent = basePrice * 1.00001;
      const priceWith0002Percent = basePrice * 1.00002;

      expect(strategy.shouldNotify(basePrice, priceWith0002Percent)).toBe(true);
      expect(strategy.shouldNotify(basePrice, priceWith0001Percent)).toBe(true);
    });

    it("should handle zero threshold edge cases", () => {
      const zeroThresholdPercentage = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 0,
      });

      const zeroThresholdAbsolute = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 0,
      });

      // Any change should notify with zero threshold
      expect(zeroThresholdPercentage.shouldNotify(100, 100.001)).toBe(true);
      expect(zeroThresholdAbsolute.shouldNotify(100, 100.001)).toBe(true);

      // No change should not notify
      expect(zeroThresholdPercentage.shouldNotify(100, 100)).toBe(false);
      expect(zeroThresholdAbsolute.shouldNotify(100, 100)).toBe(false);
    });
  });

  describe("Integration and Real-World Scenarios", () => {
    it("should handle typical cryptocurrency price changes", () => {
      const cryptoStrategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 5, // 5% threshold typical for crypto alerts
      });

      // Bitcoin price movements
      expect(cryptoStrategy.shouldNotify(50000, 52600)).toBe(true); // 5.2% increase
      expect(cryptoStrategy.shouldNotify(50000, 52499)).toBe(false); // 4.998% increase
      expect(cryptoStrategy.shouldNotify(50000, 47500)).toBe(true); // 5% decrease

      // Altcoin volatility
      expect(cryptoStrategy.shouldNotify(1.50, 1.60)).toBe(true); // ~6.7% increase
      expect(cryptoStrategy.shouldNotify(1.50, 1.55)).toBe(false); // ~3.3% increase
    });

    it("should handle NFT floor price changes", () => {
      const nftStrategy = new PriceChangeStrategy({
        mode: "absolute",
        threshold: 0.1, // 0.1 ETH threshold
      });

      // NFT floor movements
      expect(nftStrategy.shouldNotify(2.0, 2.15)).toBe(true); // 0.15 ETH increase
      expect(nftStrategy.shouldNotify(2.0, 2.05)).toBe(false); // 0.05 ETH increase
      expect(nftStrategy.shouldNotify(2.0, 1.85)).toBe(true); // 0.15 ETH decrease

      // High-value NFT movements
      expect(nftStrategy.shouldNotify(50.0, 50.5)).toBe(true); // 0.5 ETH change
      expect(nftStrategy.shouldNotify(50.0, 50.05)).toBe(false); // 0.05 ETH change
    });

    it("should handle stock price monitoring", () => {
      const stockStrategy = new PriceChangeStrategy({
        mode: "percentage",
        threshold: 2, // 2% threshold for stock alerts
      });

      // Stock price movements
      expect(stockStrategy.shouldNotify(150.00, 153.10)).toBe(true); // ~2.07% increase
      expect(stockStrategy.shouldNotify(150.00, 152.90)).toBe(false); // ~1.93% increase
      expect(stockStrategy.shouldNotify(150.00, 147.00)).toBe(true); // 2% decrease
    });
  });
});