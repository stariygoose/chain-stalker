import { DomainError } from "#core/errors/index.js";
import {
  AbsoluteChangeStrategy,
  PercentageChangeStrategy,
} from "#core/strategies/notification/price-change.strategies.js";

describe("PercentageStrategy Unit Tests", () => {
  describe("constructor", () => {
    it("should create instance with valid threshold", () => {
      const threshold = 5;
      const strategy = new PercentageChangeStrategy(threshold);

      expect(strategy).toBeInstanceOf(PercentageChangeStrategy);
      expect(strategy.threshold).toEqual(threshold);
      expect(strategy.type).toBe("percentage");
    });

    it("should throw error when treshold is NaN", () => {
      expect(() => {
        new PercentageChangeStrategy(NaN);
      }).toThrow(DomainError.ThresholdStrategyConfigurationErrror);
    });

    it("should throw error when treshold is Infinity", () => {
      expect(() => {
        new PercentageChangeStrategy(Infinity);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should throw error when threshold is less or equal to BASE_LIMIT", () => {
      expect(() => {
        new PercentageChangeStrategy(PercentageChangeStrategy.BASE_LIMIT - 1);
      }).toThrow(DomainError.RangeStrategyConfigurationError);

      expect(() => {
        new PercentageChangeStrategy(PercentageChangeStrategy.BASE_LIMIT);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should throw error when threshold is greater then TOP_LIMIT", () => {
      expect(() => {
        new PercentageChangeStrategy(PercentageChangeStrategy.TOP_LIMIT + 1);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should accept threshold at the upper boundary", () => {
      const equalToTopLimit = new PercentageChangeStrategy(
        PercentageChangeStrategy.TOP_LIMIT,
      );

      expect(equalToTopLimit).toBeInstanceOf(PercentageChangeStrategy);
      expect(equalToTopLimit.threshold).toEqual(
        PercentageChangeStrategy.TOP_LIMIT,
      );
      expect(equalToTopLimit.type).toBe("percentage");
    });

    it("should be correctly serialized and deserialized", () => {
      const originalStrategy = new PercentageChangeStrategy(5);

      const serialized = JSON.stringify(originalStrategy);

      const parsed = JSON.parse(serialized);
      const deserializedStrategy = new PercentageChangeStrategy(
        parsed.threshold,
      );

      expect(deserializedStrategy.threshold).toEqual(
        originalStrategy.threshold,
      );
      expect(deserializedStrategy.type).toEqual(originalStrategy.type);
    });
  });

  describe("shouldNotify", () => {
    let strategy: PercentageChangeStrategy;
    beforeEach(() => {
      strategy = new PercentageChangeStrategy(5); // 5%
    });

    it("should return true when price increases by exactly the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 105; // 5% increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price increases by more than the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 115; // 15% increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price decreases by exactly than the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 95; // 5% decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price decreases by more than the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 85; // 15% decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return false when price increases by less than the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 104; // 4% increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should return false when price decreases by less than the threshold percentage", () => {
      const currentPrice = 100;
      const newPrice = 96; // 4% decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should return false when there is no price change", () => {
      const currentPrice = 100;
      const newPrice = 100; // 0% change

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should handle very small price values correctly", () => {
      const strategy = new PercentageChangeStrategy(10);
      const currentPrice = 0.001;
      const newPrice = 0.0011; // 10% increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should handle zero current price correctly", () => {
      const currentPrice = 0;
      const newPrice = 10;

      const currPriceNull = strategy.shouldNotify(currentPrice, newPrice);
      const newPriceNull = strategy.shouldNotify(newPrice, currentPrice);
      const bothNull = strategy.shouldNotify(currentPrice, currentPrice);

      expect(currPriceNull).toBe(true);
      expect(newPriceNull).toBe(true);
      expect(bothNull).toBe(false);
    });
  });

  describe("calculateDifference", () => {
    let strategy: PercentageChangeStrategy;
    beforeEach(() => {
      strategy = new PercentageChangeStrategy(5);
    });

    it("should return correct differance", () => {
      const currentState = 100; // 100$
      const newState = 200; // 200$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBe(100); // 100%
    });

    it("should return correct differance between big numbers", () => {
      const currentState = 1000000; // 1000000$
      const newState = 1500000; // 1500000$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBe(50); // 50%
    });

    it("should return correct differance between small numbers", () => {
      const currentState = 0.001; // 0.001$
      const newState = 0.0011; // 0.0011$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBe(10); // 10%
    });

    it("should return correct differance between numbers when pricision is number", () => {
      const currentState = 0.001; // 0.001$
      const newState = 0.0011; // 0.0011$

      const result = strategy.calculateDifference(currentState, newState, 15);

      expect(result).toBe(10.000000000000005); // 10.000000000000005%
    });

    it("should return correct differance between numbers when pricision is NaN", () => {
      const currentState = 0.001; // 0.001$
      const newState = 0.0011; // 0.0011$

      const result = strategy.calculateDifference(currentState, newState, NaN);

      expect(result).toBe(10); // 10%
    });

    it("should throwerror when pricision is Infinity", () => {
      const currentState = 0.001; // 0.001$
      const newState = 0.0011; // 0.0011$

      expect(() => {
        strategy.calculateDifference(currentState, newState, Infinity);
      }).toThrow(DomainError.InvalidNumberError);
    });

    it("should throw error when one of the parameters is NaN", () => {
      const currentState = 0.001; // 0.001$
      const newState = NaN;

      expect(() => {
        strategy.calculateDifference(currentState, newState);
      }).toThrow(DomainError.InvalidNumberError);

      expect(() => {
        strategy.calculateDifference(newState, currentState);
      }).toThrow(DomainError.InvalidNumberError);
    });

    it("should throw error when one of the parameters is Infinity", () => {
      const currentState = 0.001; // 0.001$
      const newState = Infinity;

      expect(() => {
        strategy.calculateDifference(currentState, newState);
      }).toThrow(DomainError.InvalidNumberError);

      expect(() => {
        strategy.calculateDifference(newState, currentState);
      }).toThrow(DomainError.InvalidNumberError);
    });
  });
});

describe("AbsoluteStrategy Unit Tests", () => {
  describe("constructor", () => {
    it("should create instance with valid threshold", () => {
      const threshold = 1000; // 1000$
      const strategy = new AbsoluteChangeStrategy(threshold);

      expect(strategy).toBeInstanceOf(AbsoluteChangeStrategy);
      expect(strategy.threshold).toEqual(threshold);
      expect(strategy.type).toBe("absolute");
    });

    it("should throw error when treshold is NaN", () => {
      expect(() => {
        new AbsoluteChangeStrategy(NaN);
      }).toThrow(DomainError.ThresholdStrategyConfigurationErrror);
    });

    it("should throw error when treshold is Infinity", () => {
      expect(() => {
        new AbsoluteChangeStrategy(Infinity);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should throw error when threshold is less or equal to BASE_LIMIT", () => {
      expect(() => {
        new AbsoluteChangeStrategy(AbsoluteChangeStrategy.BASE_LIMIT - 1);
      }).toThrow(DomainError.RangeStrategyConfigurationError);

      expect(() => {
        new AbsoluteChangeStrategy(AbsoluteChangeStrategy.BASE_LIMIT);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should throw error when threshold is greater then TOP_LIMIT", () => {
      expect(() => {
        new AbsoluteChangeStrategy(AbsoluteChangeStrategy.TOP_LIMIT + 1);
      }).toThrow(DomainError.RangeStrategyConfigurationError);
    });

    it("should accept threshold at the upper boundary", () => {
      const equalToTopLimit = new AbsoluteChangeStrategy(
        AbsoluteChangeStrategy.TOP_LIMIT,
      );

      expect(equalToTopLimit).toBeInstanceOf(AbsoluteChangeStrategy);
      expect(equalToTopLimit.threshold).toEqual(
        AbsoluteChangeStrategy.TOP_LIMIT,
      );
      expect(equalToTopLimit.type).toBe("absolute");
    });

    it("should be correctly serialized and deserialized", () => {
      const originalStrategy = new AbsoluteChangeStrategy(1000);

      const serialized = JSON.stringify(originalStrategy);

      const parsed = JSON.parse(serialized);
      const deserializedStrategy = new AbsoluteChangeStrategy(parsed.threshold);

      expect(deserializedStrategy.threshold).toEqual(
        originalStrategy.threshold,
      );
      expect(deserializedStrategy.type).toEqual(originalStrategy.type);
    });
  });

  describe("shouldNotify", () => {
    let strategy: AbsoluteChangeStrategy;
    beforeEach(() => {
      strategy = new AbsoluteChangeStrategy(1000); // 1000$
    });

    it("should return true when price increases by exactly the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 11000; // 1000$ increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price increases by more than the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 11001; // 1001$ increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price decreases by exactly than the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 9000; // 1000$ decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return true when price decreases by more than the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 5000; // 5000$ decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should return false when price increases by less than the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 10999; // 999$ increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should return false when price decreases by less than the threshold percentage", () => {
      const currentPrice = 10000;
      const newPrice = 9001; // 999$ decrease

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should return false when there is no price change", () => {
      const currentPrice = 10000;
      const newPrice = 10000; // 0$ change

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(false);
    });

    it("should handle very small price values correctly", () => {
      const strategy = new AbsoluteChangeStrategy(0.0001);
      const currentPrice = 0.001;
      const newPrice = 0.0011; // 0.0001$ increase

      const result = strategy.shouldNotify(currentPrice, newPrice);

      expect(result).toBe(true);
    });

    it("should handle zero current price correctly", () => {
      const currentPrice = 0;
      const newPrice = 1000;

      const currPriceNull = strategy.shouldNotify(currentPrice, newPrice);
      const newPriceNull = strategy.shouldNotify(newPrice, currentPrice);
      const bothNull = strategy.shouldNotify(currentPrice, currentPrice);

      expect(currPriceNull).toBe(true);
      expect(newPriceNull).toBe(true);
      expect(bothNull).toBe(false);
    });
  });

  describe("calculateDifference", () => {
    let strategy: AbsoluteChangeStrategy;
    beforeEach(() => {
      strategy = new AbsoluteChangeStrategy(100);
    });

    it("should return correct differance", () => {
      const currentState = 100; // 100$
      const newState = 200; // 200$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBe(100); // 100$
    });

    it("should return correct differance between big numbers", () => {
      const currentState = 100000000000000; // 100000000000000$
      const newState = 150000000000000; // 150000000000000$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBe(50000000000000); // 50000000000000$
    });

    it("should return correct differance between small numbers", () => {
      const currentState = 0.001; // 0.001$
      const newState = 0.0011; // 0.0011$

      const result = strategy.calculateDifference(currentState, newState);

      expect(result).toBeCloseTo(0.0001); // 0.0001$
    });

    it("should throw error when one of the parameters is NaN", () => {
      const currentState = 0.001; // 0.001$
      const newState = NaN;

      expect(() => {
        strategy.calculateDifference(currentState, newState);
      }).toThrow(DomainError.InvalidNumberError);

      expect(() => {
        strategy.calculateDifference(newState, currentState);
      }).toThrow(DomainError.InvalidNumberError);
    });

    it("should throw error when one of the parameters is Infinity", () => {
      const currentState = 0.001; // 0.001$
      const newState = Infinity;

      expect(() => {
        strategy.calculateDifference(currentState, newState);
      }).toThrow(DomainError.InvalidNumberError);

      expect(() => {
        strategy.calculateDifference(newState, currentState);
      }).toThrow(DomainError.InvalidNumberError);
    });
  });
});

