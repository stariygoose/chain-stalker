import { describe, it, expect } from "vitest";
import { DateValidator } from "#domain/utils/validator";
import { InvalidDateException } from "#domain/exceptions";

describe("DateValidator", () => {
  describe("isValidDate Method", () => {
    it("should return true for valid Date objects", () => {
      const validDates = [
        new Date(),
        new Date("2025-01-01"),
        new Date("2025-12-31T23:59:59.999Z"),
        new Date(0), // Unix epoch
        new Date(1672531200000), // Specific timestamp
        new Date("1970-01-01T00:00:00Z"),
        new Date("2099-12-31T23:59:59Z"),
        new Date(2025, 0, 1), // January 1, 2025 (month is 0-indexed)
        new Date(2025, 11, 31), // December 31, 2025
      ];

      validDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
      });
    });

    it("should return false for invalid Date objects", () => {
      const invalidDates = [
        new Date("invalid-date-string"),
        new Date("abc"),
        new Date("2025-13-01"), // Invalid month
        new Date("2025-01-32"), // Invalid day
        new Date("not a date"),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
      ];

      invalidDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(false);
      });
    });

    it("should return false for non-Date objects", () => {
      const nonDates = [
        "2025-01-01",
        1672531200000, // Timestamp number
        null,
        undefined,
        {},
        [],
        "2025-01-01T00:00:00Z",
        true,
        false,
        0,
      ];

      nonDates.forEach(value => {
        expect(DateValidator.isValidDate(value as any)).toBe(false);
      });
    });

    it("should handle edge case dates correctly", () => {
      // Extreme but valid dates
      const extremeDates = [
        new Date(8640000000000000), // Max safe date
        new Date(-8640000000000000), // Min safe date
        new Date("1900-01-01"),
        new Date("2100-12-31"),
      ];

      extremeDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
      });
    });

    it("should correctly identify finite vs infinite time values", () => {
      const finiteDate = new Date("2025-01-01");
      const infiniteDate = new Date(Infinity);
      const nanDate = new Date(NaN);

      expect(DateValidator.isValidDate(finiteDate)).toBe(true);
      expect(DateValidator.isValidDate(infiniteDate)).toBe(false);
      expect(DateValidator.isValidDate(nanDate)).toBe(false);
    });

    it("should handle leap year dates", () => {
      const leapYearDates = [
        new Date("2024-02-29"), // Valid leap year date
        new Date("2000-02-29"), // Valid leap year date (divisible by 400)
      ];

      leapYearDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
      });

      // Note: JavaScript Date constructor actually handles invalid dates like 2023-02-29
      // by adjusting them to valid dates, so this might not fail as expected
      const nonLeapYearDate = new Date("2023-02-29");
      // This would actually create March 1, 2023, which is valid
      expect(DateValidator.isValidDate(nonLeapYearDate)).toBe(true);
    });

    it("should handle different Date constructor variations", () => {
      // Different ways to create valid dates
      const constructorVariations = [
        new Date(2025, 0, 1), // Year, month (0-indexed), day
        new Date(2025, 0, 1, 12, 30, 45), // With time
        new Date(2025, 0, 1, 12, 30, 45, 123), // With milliseconds
        new Date("Jan 1, 2025"),
        new Date("January 1, 2025"),
        new Date("1/1/2025"),
        new Date("2025/01/01"),
      ];

      constructorVariations.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
      });
    });
  });

  describe("validateDate Method", () => {
    it("should return the same Date object for valid dates", () => {
      const validDates = [
        new Date("2025-01-01"),
        new Date(),
        new Date(0),
        new Date("2025-12-31T23:59:59.999Z"),
        new Date(2025, 5, 15), // June 15, 2025
      ];

      validDates.forEach(date => {
        const result = DateValidator.validateDate(date);
        expect(result).toBe(date);
        expect(result.getTime()).toBe(date.getTime());
      });
    });

    it("should throw InvalidDateException for invalid Date objects", () => {
      const invalidDates = [
        new Date("invalid"),
        new Date("abc"),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
      ];

      invalidDates.forEach(date => {
        expect(() => {
          DateValidator.validateDate(date);
        }).toThrow(InvalidDateException);

        try {
          DateValidator.validateDate(date);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidDateException);
          expect((error as InvalidDateException).errorSlug).toBe("INVALID_DATE");
          expect((error as InvalidDateException).message).toContain("invalid date");
        }
      });
    });

    it("should throw InvalidDateException for non-Date objects", () => {
      const nonDates = [
        "2025-01-01",
        1672531200000,
        null,
        undefined,
        {},
        [],
        true,
        false,
      ];

      nonDates.forEach(value => {
        expect(() => {
          DateValidator.validateDate(value as any);
        }).toThrow(InvalidDateException);

        try {
          DateValidator.validateDate(value as any);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidDateException);
          expect((error as InvalidDateException).errorSlug).toBe("INVALID_DATE");
          expect((error as InvalidDateException).message).toContain("invalid date");
        }
      });
    });


    it("should handle timezone-aware dates", () => {
      const utcDate = new Date("2025-01-01T12:00:00Z");
      const localDate = new Date("2025-01-01T12:00:00");

      expect(() => DateValidator.validateDate(utcDate)).not.toThrow();
      expect(() => DateValidator.validateDate(localDate)).not.toThrow();

      const validatedUtc = DateValidator.validateDate(utcDate);
      const validatedLocal = DateValidator.validateDate(localDate);

      expect(validatedUtc.toISOString()).toBe(utcDate.toISOString());
      expect(validatedLocal.getTime()).toBe(localDate.getTime());
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle extreme valid dates", () => {
      const extremeDates = [
        new Date(-8640000000000000), // Min safe date
        new Date(8640000000000000), // Max safe date
        new Date(0), // Unix epoch
        new Date(1), // 1ms after epoch
        new Date(-1), // 1ms before epoch
      ];

      extremeDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
        expect(DateValidator.validateDate(date)).toBe(date);
      });
    });

    it("should handle dates created from mathematical operations", () => {
      const now = new Date();
      const mathDates = [
        new Date(now.getTime() + 86400000), // Add 1 day
        new Date(now.getTime() - 3600000), // Subtract 1 hour
        new Date(Math.floor(now.getTime() / 1000) * 1000), // Round to seconds
      ];

      mathDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
        expect(DateValidator.validateDate(date)).toBe(date);
      });
    });

    it("should handle dates from different parsing methods", () => {
      const parsedDates = [
        new Date(Date.parse("2025-01-01")),
        new Date(Date.parse("Jan 1, 2025")),
        new Date(Date.UTC(2025, 0, 1)),
      ];

      parsedDates.forEach(date => {
        if (DateValidator.isValidDate(date)) {
          expect(DateValidator.validateDate(date)).toBe(date);
        }
      });
    });

    it("should reject dates with invalid parsing results", () => {
      const invalidParsed = [
        new Date(Date.parse("invalid")), // Results in NaN
        new Date(Date.parse("")), // Results in NaN
        new Date(Date.parse("not-a-date")), // Results in NaN
      ];

      invalidParsed.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(false);
        expect(() => DateValidator.validateDate(date)).toThrow(InvalidDateException);
      });
    });

    it("should handle millisecond precision", () => {
      const preciseDate = new Date("2025-01-01T12:34:56.789Z");
      expect(DateValidator.isValidDate(preciseDate)).toBe(true);
      
      const validated = DateValidator.validateDate(preciseDate);
      expect(validated.getMilliseconds()).toBe(789);
      expect(validated.getTime()).toBe(preciseDate.getTime());
    });

    it("should maintain Date object identity", () => {
      const originalDate = new Date("2025-01-01");
      const validatedDate = DateValidator.validateDate(originalDate);
      
      // Should return the exact same object reference
      expect(validatedDate).toBe(originalDate);
    });
  });

  describe("Real-World Usage Scenarios", () => {
    it("should validate notification timestamps", () => {
      const notificationTimes = [
        new Date(), // Current time
        new Date(Date.now() - 3600000), // 1 hour ago
        new Date(Date.now() + 86400000), // 1 day from now
        new Date("2025-01-01T00:00:00Z"), // Future date
        new Date("2024-01-01T00:00:00Z"), // Past date
      ];

      notificationTimes.forEach(time => {
        expect(DateValidator.isValidDate(time)).toBe(true);
        expect(DateValidator.validateDate(time)).toBe(time);
      });
    });

    it("should validate subscription creation dates", () => {
      const creationDates = [
        new Date(), // Now
        new Date("2024-12-31T23:59:59Z"), // End of year
        new Date("2025-01-01T00:00:00Z"), // Start of year
        new Date(2025, 0, 1, 9, 30), // Business hours
      ];

      creationDates.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
        expect(DateValidator.validateDate(date)).toBe(date);
      });
    });

    it("should reject common invalid date inputs from user interfaces", () => {
      const userInputErrors = [
        new Date(""), // Empty string
        new Date("invalid"), // Invalid string
        new Date("2025/13/01"), // Invalid month
        new Date("2025/01/32"), // Invalid day
        new Date("25/01/01"), // Ambiguous format
      ];

      userInputErrors.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(false);
        expect(() => DateValidator.validateDate(date)).toThrow(InvalidDateException);
      });
    });

    it("should handle different timezone representations", () => {
      const timezoneVariations = [
        new Date("2025-01-01T12:00:00Z"), // UTC
        new Date("2025-01-01T12:00:00+00:00"), // UTC with offset
        new Date("2025-01-01T07:00:00-05:00"), // EST
        new Date("2025-01-01T13:00:00+01:00"), // CET
      ];

      timezoneVariations.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
        expect(DateValidator.validateDate(date)).toBe(date);
      });
    });

    it("should handle database timestamp scenarios", () => {
      // Common database timestamp formats
      const dbTimestamps = [
        new Date("2025-01-01 12:00:00"), // SQL format (may vary by DB)
        new Date(1672574400000), // Unix timestamp in milliseconds
        new Date("2025-01-01T12:00:00.000Z"), // ISO with milliseconds
      ];

      dbTimestamps.forEach(date => {
        if (DateValidator.isValidDate(date)) {
          expect(DateValidator.validateDate(date)).toBe(date);
        }
      });
    });
  });

  describe("Error Message Quality", () => {
    it("should provide meaningful error messages", () => {
      const testCases = [
        { input: new Date("invalid"), description: "invalid date string" },
        { input: new Date(NaN), description: "NaN date" },
        { input: new Date(Infinity), description: "infinite date" },
        { input: "2025-01-01" as any, description: "string instead of Date" },
        { input: 1672531200000 as any, description: "timestamp number" },
        { input: null as any, description: "null value" },
        { input: undefined as any, description: "undefined value" },
      ];

      testCases.forEach(({ input, description }) => {
        try {
          DateValidator.validateDate(input);
          fail(`Expected InvalidDateException for ${description}`);
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidDateException);
          expect((error as InvalidDateException).message).toContain("invalid date");
          expect((error as InvalidDateException).errorSlug).toBe("INVALID_DATE");
        }
      });
    });
  });

  describe("Performance and Consistency", () => {
    it("should be consistent between isValidDate and validateDate", () => {
      const testDates = [
        // Valid cases
        new Date(), new Date("2025-01-01"), new Date(0),
        // Invalid cases
        new Date("invalid"), new Date(NaN), new Date(Infinity),
        // Non-dates
        "2025-01-01" as any, 1672531200000 as any, null as any
      ];

      testDates.forEach(date => {
        const isValid = DateValidator.isValidDate(date);
        
        if (isValid) {
          expect(() => DateValidator.validateDate(date)).not.toThrow();
          expect(DateValidator.validateDate(date)).toBe(date);
        } else {
          expect(() => DateValidator.validateDate(date)).toThrow(InvalidDateException);
        }
      });
    });

    it("should handle rapid successive validations", () => {
      const baseDate = new Date("2025-01-01");
      
      // Test multiple validations in succession
      for (let i = 0; i < 100; i++) {
        const testDate = new Date(baseDate.getTime() + (i * 86400000)); // Add days
        expect(DateValidator.isValidDate(testDate)).toBe(true);
        expect(DateValidator.validateDate(testDate)).toBe(testDate);
      }
    });

    it("should maintain consistent behavior across different date formats", () => {
      // Same moment in different formats
      const sameMoment = [
        new Date("2025-01-01T12:00:00Z"),
        new Date("2025-01-01T12:00:00.000Z"),
        new Date(Date.UTC(2025, 0, 1, 12, 0, 0)),
        new Date(1735732800000), // Unix timestamp for the same moment
      ];

      sameMoment.forEach(date => {
        expect(DateValidator.isValidDate(date)).toBe(true);
        const validated = DateValidator.validateDate(date);
        expect(validated.toISOString()).toBe("2025-01-01T12:00:00.000Z");
      });
    });
  });

  describe("Static Method Behavior", () => {
    it("should be callable without instantiation", () => {
      expect(typeof DateValidator.isValidDate).toBe("function");
      expect(typeof DateValidator.validateDate).toBe("function");
      
      const testDate = new Date();
      expect(() => DateValidator.isValidDate(testDate)).not.toThrow();
      expect(() => DateValidator.validateDate(testDate)).not.toThrow();
    });

    it("should not have side effects", () => {
      const originalDate = new Date("2025-01-01T12:00:00Z");
      const originalTime = originalDate.getTime();
      
      DateValidator.isValidDate(originalDate);
      DateValidator.validateDate(originalDate);
      
      // Original date should be unchanged
      expect(originalDate.getTime()).toBe(originalTime);
    });

    it("should not mutate input dates", () => {
      const testDate = new Date("2025-01-01T12:00:00Z");
      const originalTimeString = testDate.toISOString();
      
      const result = DateValidator.validateDate(testDate);
      
      // Input should be unchanged
      expect(testDate.toISOString()).toBe(originalTimeString);
      // Result should be the same object
      expect(result).toBe(testDate);
    });
  });
});