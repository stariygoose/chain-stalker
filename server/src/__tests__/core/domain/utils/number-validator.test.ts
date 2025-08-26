import { describe, it, expect } from "vitest";
import { NumberValidator } from "#domain/utils/validator";
import { InvalidNumberException } from "#domain/exceptions";

describe("NumberValidator", () => {
  describe("isValidNumber Method", () => {
    it("should return true for valid positive numbers", () => {
      const validNumbers = [
        0,
        0.1,
        1,
        100,
        1000.5,
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE, // Smallest positive number
        Number.EPSILON,
        0.000000000001,
        1e10,
        1e-10,
      ];

      validNumbers.forEach(num => {
        expect(NumberValidator.isValidNumber(num)).toBe(true);
      });
    });

    it("should return false for negative numbers", () => {
      const negativeNumbers = [
        -1,
        -0.1,
        -100,
        -1000.5,
        -Number.MAX_SAFE_INTEGER,
        -Number.MAX_VALUE,
        Number.MIN_SAFE_INTEGER,
        -1e10,
        -1e-10,
      ];

      negativeNumbers.forEach(num => {
        expect(NumberValidator.isValidNumber(num)).toBe(false);
      });
    });

    it("should return false for infinite values", () => {
      expect(NumberValidator.isValidNumber(Infinity)).toBe(false);
      expect(NumberValidator.isValidNumber(-Infinity)).toBe(false);
    });

    it("should return false for NaN", () => {
      expect(NumberValidator.isValidNumber(NaN)).toBe(false);
    });

    it("should return false for non-number types", () => {
      const nonNumbers = [
        "123",
        "0",
        null,
        undefined,
        {},
        [],
        true,
        false,
        "",
        "NaN",
        "Infinity",
      ];

      nonNumbers.forEach(value => {
        expect(NumberValidator.isValidNumber(value as any)).toBe(false);
      });
    });

    it("should handle edge case: -0", () => {
      // -0 should be treated as valid (it's >= 0)
      expect(NumberValidator.isValidNumber(-0)).toBe(true);
    });

    it("should handle very small positive numbers", () => {
      expect(NumberValidator.isValidNumber(1e-100)).toBe(true);
      expect(NumberValidator.isValidNumber(1e-300)).toBe(true);
      expect(NumberValidator.isValidNumber(5e-324)).toBe(true); // Near minimum positive value
    });

    it("should handle very large positive numbers", () => {
      expect(NumberValidator.isValidNumber(1e100)).toBe(true);
      expect(NumberValidator.isValidNumber(1e300)).toBe(true);
    });

    it("should correctly identify finite vs infinite numbers", () => {
      expect(NumberValidator.isValidNumber(Number.MAX_VALUE)).toBe(true);
      expect(NumberValidator.isValidNumber(Number.MAX_VALUE * 2)).toBe(false); // Results in Infinity
    });
  });

  describe("validateNumber Method", () => {
    it("should return the same number for valid positive numbers", () => {
      const validNumbers = [
        0,
        0.1,
        1,
        100,
        1000.5,
        Number.MAX_SAFE_INTEGER,
        Number.EPSILON,
      ];

      validNumbers.forEach(num => {
        expect(NumberValidator.validateNumber(num)).toBe(num);
      });
    });

    it("should throw InvalidNumberException for non-number types", () => {
      const nonNumbers = [
        "123",
        null,
        undefined,
        {},
        [],
        true,
        false,
      ];

      nonNumbers.forEach(value => {
        expect(() => {
          NumberValidator.validateNumber(value as any);
        }).toThrow(InvalidNumberException);

        try {
          NumberValidator.validateNumber(value as any);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidNumberException);
          expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
          expect((error as InvalidNumberException).message).toContain("invalid number");
        }
      });
    });

    it("should throw InvalidNumberException for Infinity", () => {
      expect(() => {
        NumberValidator.validateNumber(Infinity);
      }).toThrow(InvalidNumberException);

      try {
        NumberValidator.validateNumber(Infinity);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
        expect((error as InvalidNumberException).message).toContain("Infinity");
      }
    });

    it("should throw InvalidNumberException for -Infinity", () => {
      expect(() => {
        NumberValidator.validateNumber(-Infinity);
      }).toThrow(InvalidNumberException);

      try {
        NumberValidator.validateNumber(-Infinity);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
        expect((error as InvalidNumberException).message).toContain("-Infinity");
      }
    });

    it("should throw InvalidNumberException for NaN", () => {
      expect(() => {
        NumberValidator.validateNumber(NaN);
      }).toThrow(InvalidNumberException);

      try {
        NumberValidator.validateNumber(NaN);
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
        expect((error as InvalidNumberException).message).toContain("NaN");
      }
    });

    it("should throw InvalidNumberException for negative numbers", () => {
      const negativeNumbers = [-1, -0.1, -100, -1000.5];

      negativeNumbers.forEach(num => {
        expect(() => {
          NumberValidator.validateNumber(num);
        }).toThrow(InvalidNumberException);

        try {
          NumberValidator.validateNumber(num);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidNumberException);
          expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
          expect((error as InvalidNumberException).message).toContain("invalid number");
          expect((error as InvalidNumberException).message).toContain(num.toString());
        }
      });
    });

    it("should handle -0 correctly", () => {
      // -0 should be valid (>= 0)
      expect(NumberValidator.validateNumber(-0)).toBe(-0);
      expect(Object.is(NumberValidator.validateNumber(-0), -0)).toBe(true);
    });

    it("should preserve exact values for valid numbers", () => {
      const preciseNumbers = [
        0.1 + 0.2, // Known precision issue result
        Math.PI,
        Math.E,
        1.23456789012345,
      ];

      preciseNumbers.forEach(num => {
        expect(NumberValidator.validateNumber(num)).toBe(num);
      });
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle numbers created from mathematical operations", () => {
      const mathResults = [
        Math.sqrt(4), // 2
        Math.pow(2, 3), // 8
        Math.abs(-5), // 5
        Math.floor(3.9), // 3
        Math.ceil(3.1), // 4
        Math.round(3.6), // 4
        Math.max(1, 2, 3), // 3
        Math.min(1, 2, 3), // 1
      ];

      mathResults.forEach(result => {
        expect(NumberValidator.isValidNumber(result)).toBe(true);
        expect(NumberValidator.validateNumber(result)).toBe(result);
      });
    });

    it("should handle numbers from parsing operations", () => {
      const parsedNumbers = [
        parseInt("123"), // 123
        parseFloat("123.45"), // 123.45
        Number("456"), // 456
        Number("0"), // 0
      ];

      parsedNumbers.forEach(result => {
        expect(NumberValidator.isValidNumber(result)).toBe(true);
        expect(NumberValidator.validateNumber(result)).toBe(result);
      });
    });

    it("should reject invalid parsing results", () => {
      const invalidParseResults = [
        parseInt("abc"), // NaN
        parseFloat("xyz"), // NaN
        Number("invalid"), // NaN
      ];

      invalidParseResults.forEach(result => {
        expect(NumberValidator.isValidNumber(result)).toBe(false);
        expect(() => NumberValidator.validateNumber(result)).toThrow(InvalidNumberException);
      });
    });

    it("should handle extreme mathematical edge cases", () => {
      // Valid extreme cases
      expect(NumberValidator.validateNumber(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
      expect(NumberValidator.validateNumber(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
      expect(NumberValidator.validateNumber(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
      expect(NumberValidator.validateNumber(Number.EPSILON)).toBe(Number.EPSILON);

      // Invalid extreme cases
      expect(() => NumberValidator.validateNumber(Number.MIN_SAFE_INTEGER)).toThrow(InvalidNumberException);
    });

    it("should maintain type safety", () => {
      // Ensure the returned value is exactly the input for valid cases
      const testNumber = 42.5;
      const result = NumberValidator.validateNumber(testNumber);
      
      expect(result).toBe(testNumber);
      expect(typeof result).toBe("number");
      expect(result === testNumber).toBe(true);
    });
  });

  describe("Real-World Usage Scenarios", () => {
    it("should validate cryptocurrency prices", () => {
      const cryptoPrices = [
        0, // Free tokens
        0.00000001, // Very cheap altcoin
        1.50, // Typical altcoin
        50000, // Bitcoin range
        1000000, // Theoretical high price
      ];

      cryptoPrices.forEach(price => {
        expect(NumberValidator.isValidNumber(price)).toBe(true);
        expect(NumberValidator.validateNumber(price)).toBe(price);
      });

      // Invalid crypto prices
      const invalidPrices = [-1, NaN, Infinity, -Infinity];
      invalidPrices.forEach(price => {
        expect(NumberValidator.isValidNumber(price)).toBe(false);
        expect(() => NumberValidator.validateNumber(price)).toThrow(InvalidNumberException);
      });
    });

    it("should validate NFT prices", () => {
      const nftPrices = [
        0, // Free mint
        0.001, // Very cheap NFT
        0.1, // Low-tier NFT
        5.5, // Mid-tier NFT
        100, // High-value NFT
        10000, // Blue chip NFT
      ];

      nftPrices.forEach(price => {
        expect(NumberValidator.isValidNumber(price)).toBe(true);
        expect(NumberValidator.validateNumber(price)).toBe(price);
      });
    });

    it("should validate percentage thresholds", () => {
      const percentageThresholds = [
        0, // No threshold
        0.01, // 0.01%
        1, // 1%
        5, // 5%
        10, // 10%
        50, // 50%
        100, // 100%
        1000, // 1000% (extreme but valid)
      ];

      percentageThresholds.forEach(threshold => {
        expect(NumberValidator.isValidNumber(threshold)).toBe(true);
        expect(NumberValidator.validateNumber(threshold)).toBe(threshold);
      });
    });

    it("should validate time intervals", () => {
      const intervals = [
        0, // Immediate
        1000, // 1 second
        60000, // 1 minute
        3600000, // 1 hour
        86400000, // 1 day
        604800000, // 1 week
      ];

      intervals.forEach(interval => {
        expect(NumberValidator.isValidNumber(interval)).toBe(true);
        expect(NumberValidator.validateNumber(interval)).toBe(interval);
      });
    });
  });

  describe("Error Message Quality", () => {
    it("should provide meaningful error messages for different invalid types", () => {
      const testCases = [
        { input: "123", expectedInMessage: "123" },
        { input: null, expectedInMessage: "null" },
        { input: undefined, expectedInMessage: "undefined" },
        { input: NaN, expectedInMessage: "NaN" },
        { input: Infinity, expectedInMessage: "Infinity" },
        { input: -Infinity, expectedInMessage: "-Infinity" },
        { input: -5, expectedInMessage: "-5" },
      ];

      testCases.forEach(({ input, expectedInMessage }) => {
        try {
          NumberValidator.validateNumber(input as any);
          fail(`Expected InvalidNumberException for input: ${input}`);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidNumberException);
          expect((error as InvalidNumberException).message).toContain(expectedInMessage);
          expect((error as InvalidNumberException).message).toContain("invalid number");
        }
      });
    });
  });

  describe("Performance and Consistency", () => {
    it("should be consistent between isValidNumber and validateNumber", () => {
      const testValues = [
        // Valid cases
        0, 1, 100, 0.5, Number.MAX_SAFE_INTEGER, Number.MIN_VALUE,
        // Invalid cases
        -1, -0.5, NaN, Infinity, -Infinity, "123" as any, null as any, undefined as any
      ];

      testValues.forEach(value => {
        const isValid = NumberValidator.isValidNumber(value);
        
        if (isValid) {
          // Should not throw
          expect(() => NumberValidator.validateNumber(value)).not.toThrow();
        } else {
          // Should throw
          expect(() => NumberValidator.validateNumber(value)).toThrow(InvalidNumberException);
        }
      });
    });

    it("should handle rapid successive validations", () => {
      // Test that the validator works correctly when called many times
      for (let i = 0; i < 1000; i++) {
        expect(NumberValidator.isValidNumber(i)).toBe(true);
        expect(NumberValidator.validateNumber(i)).toBe(i);
      }
    });
  });

  describe("Static Method Behavior", () => {
    it("should be callable without instantiation", () => {
      // Ensure these are static methods that don't require class instantiation
      expect(typeof NumberValidator.isValidNumber).toBe("function");
      expect(typeof NumberValidator.validateNumber).toBe("function");
      
      // Should work without creating an instance
      expect(() => NumberValidator.isValidNumber(5)).not.toThrow();
      expect(() => NumberValidator.validateNumber(5)).not.toThrow();
    });

    it("should not have side effects", () => {
      const testNumber = 42;
      const originalNumber = testNumber;
      
      NumberValidator.isValidNumber(testNumber);
      NumberValidator.validateNumber(testNumber);
      
      // Original value should be unchanged
      expect(testNumber).toBe(originalNumber);
    });
  });
});