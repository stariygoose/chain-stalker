import { describe, it, expect } from "vitest";
import { TimeIntervalStrategy } from "#domain/entities/strategy";
import { InvalidNumberException } from "#domain/exceptions";

describe("TimeIntervalStrategy", () => {
  describe("Constructor", () => {
    it("should create strategy with valid interval", () => {
      const strategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });

      expect(strategy.type).toBe("interval-change");
      expect(strategy.config.intervalMs).toBe(3600000);
    });

    it("should accept various interval values", () => {
      const intervals = [
        { ms: 1000, desc: "1 second" },
        { ms: 60000, desc: "1 minute" },
        { ms: 3600000, desc: "1 hour" },
        { ms: 86400000, desc: "1 day" },
        { ms: 604800000, desc: "1 week" },
      ];

      intervals.forEach(({ ms }) => {
        const strategy = new TimeIntervalStrategy({ intervalMs: ms });
        expect(strategy.config.intervalMs).toBe(ms);
      });
    });

    it("should accept minimum interval of 1000ms", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 1000 });
      expect(strategy.config.intervalMs).toBe(1000);
    });

    it("should accept fractional intervals", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 1500.5 });
      expect(strategy.config.intervalMs).toBe(1500.5);
    });

  });

  describe("Constructor - Error Cases", () => {
    it("should throw InvalidNumberException for invalid interval values", () => {
      expect(() => {
        new TimeIntervalStrategy({ intervalMs: NaN });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: Infinity });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: -Infinity });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: -1000 });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for non-number interval", () => {
      expect(() => {
        new TimeIntervalStrategy({ intervalMs: "1000" as any });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: null as any });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: undefined as any });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: {} as any });
      }).toThrow(InvalidNumberException);
    });

    it("should have correct error properties", () => {
      try {
        new TimeIntervalStrategy({ intervalMs: -5000 });
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
      }
    });
  });

  describe("shouldNotify Method", () => {
    let strategy: TimeIntervalStrategy;

    beforeEach(() => {
      strategy = new TimeIntervalStrategy({
        intervalMs: 3600000, // 1 hour
      });
    });

    it("should notify when time interval has passed", () => {
      const currentTime = new Date("2025-01-01T00:00:00Z");
      
      // 1.5 hours later
      const after90min = new Date("2025-01-01T01:30:00Z");
      expect(strategy.shouldNotify(currentTime, after90min)).toBe(true);

      // 2 hours later
      const after2hours = new Date("2025-01-01T02:00:00Z");
      expect(strategy.shouldNotify(currentTime, after2hours)).toBe(true);

      // 5 hours later
      const after5hours = new Date("2025-01-01T05:00:00Z");
      expect(strategy.shouldNotify(currentTime, after5hours)).toBe(true);
    });

    it("should not notify when time interval has not passed", () => {
      const currentTime = new Date("2025-01-01T00:00:00Z");

      // 30 minutes later
      const after30min = new Date("2025-01-01T00:30:00Z");
      expect(strategy.shouldNotify(currentTime, after30min)).toBe(false);

      // 59 minutes later
      const after59min = new Date("2025-01-01T00:59:00Z");
      expect(strategy.shouldNotify(currentTime, after59min)).toBe(false);

      // 59 minutes 59 seconds later
      const almostHour = new Date("2025-01-01T00:59:59Z");
      expect(strategy.shouldNotify(currentTime, almostHour)).toBe(false);
    });

    it("should handle exact interval boundary", () => {
      const currentTime = new Date("2025-01-01T00:00:00Z");
      
      // Exactly 1 hour later
      const exactlyOneHour = new Date("2025-01-01T01:00:00Z");
      expect(strategy.shouldNotify(currentTime, exactlyOneHour)).toBe(true);
    });

    it("should work with reverse time order (past events)", () => {
      const futureTime = new Date("2025-01-01T02:00:00Z");
      const currentTime = new Date("2025-01-01T00:00:00Z");

      // 2 hours difference, should notify
      expect(strategy.shouldNotify(futureTime, currentTime)).toBe(true);
    });

    it("should handle same time (no interval)", () => {
      const time = new Date("2025-01-01T00:00:00Z");
      
      // Same time = 0 interval, should not notify (unless interval is 0)
      expect(strategy.shouldNotify(time, time)).toBe(false);
    });

    it("should work with different interval values", () => {
      const shortInterval = new TimeIntervalStrategy({ intervalMs: 30000 }); // 30 seconds
      const longInterval = new TimeIntervalStrategy({ intervalMs: 86400000 }); // 1 day

      const startTime = new Date("2025-01-01T00:00:00Z");
      const after1min = new Date("2025-01-01T00:01:00Z");
      const after1hour = new Date("2025-01-01T01:00:00Z");
      const after1day = new Date("2025-01-02T00:00:00Z");

      // Short interval (30 seconds)
      expect(shortInterval.shouldNotify(startTime, after1min)).toBe(true); // 1 min > 30 sec
      
      // Long interval (1 day)
      expect(longInterval.shouldNotify(startTime, after1hour)).toBe(false); // 1 hour < 1 day
      expect(longInterval.shouldNotify(startTime, after1day)).toBe(true); // 1 day = 1 day
    });
  });

  describe("Edge Cases and Extreme Values", () => {
    it("should reject intervals below 1000ms", () => {
      expect(() => new TimeIntervalStrategy({ intervalMs: 0 })).toThrow("Minimum interval is 1000ms (1 second)");
      expect(() => new TimeIntervalStrategy({ intervalMs: 500 })).toThrow("Minimum interval is 1000ms (1 second)");
      expect(() => new TimeIntervalStrategy({ intervalMs: 999 })).toThrow("Minimum interval is 1000ms (1 second)");
    });

    it("should handle minimum allowed intervals", () => {
      const minInterval = new TimeIntervalStrategy({ intervalMs: 1000 }); // 1 second
      
      const time1 = new Date("2025-01-01T00:00:00.000Z");
      const time2 = new Date("2025-01-01T00:00:01.000Z"); // 1 second later
      const time3 = new Date("2025-01-01T00:00:02.000Z"); // 2 seconds later
      
      expect(minInterval.shouldNotify(time1, time2)).toBe(true); // 1s = 1s threshold
      expect(minInterval.shouldNotify(time1, time3)).toBe(true); // 2s > 1s threshold
    });

    it("should handle very long intervals", () => {
      const longInterval = new TimeIntervalStrategy({ 
        intervalMs: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
      
      const startTime = new Date("2025-01-01T00:00:00Z");
      const after6months = new Date("2025-07-01T00:00:00Z");
      const after1year = new Date("2026-01-01T00:00:00Z");
      
      expect(longInterval.shouldNotify(startTime, after6months)).toBe(false);
      expect(longInterval.shouldNotify(startTime, after1year)).toBe(true);
    });

    it("should handle fractional intervals above 1000ms", () => {
      const fractionalInterval = new TimeIntervalStrategy({ intervalMs: 1500.5 }); // 1.5 seconds
      
      const time1 = new Date(1000); // Timestamp 1000ms
      const time2 = new Date(2500); // Timestamp 2500ms (1.5s difference)
      const time3 = new Date(2501); // Timestamp 2501ms (1.501s difference)
      
      expect(fractionalInterval.shouldNotify(time1, time2)).toBe(false); // 1500ms < 1500.5ms
      expect(fractionalInterval.shouldNotify(time1, time3)).toBe(true); // 1501ms > 1500.5ms
    });

    it("should handle extreme date values", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour
      
      // Unix epoch to near max date
      const epochTime = new Date(0);
      const maxTime = new Date(8640000000000000); // Max safe date
      
      // Difference is much larger than 1 hour
      expect(strategy.shouldNotify(epochTime, maxTime)).toBe(true);
      
      // Min date to epoch
      const minTime = new Date(-8640000000000000); // Min safe date
      expect(strategy.shouldNotify(minTime, epochTime)).toBe(true);
    });
  });

  describe("Real-World Time Scenarios", () => {
    it("should handle common notification intervals", () => {
      const intervals = [
        { name: "5 minutes", ms: 5 * 60 * 1000, testAfter: 6 * 60 * 1000 },
        { name: "15 minutes", ms: 15 * 60 * 1000, testAfter: 20 * 60 * 1000 },
        { name: "1 hour", ms: 60 * 60 * 1000, testAfter: 75 * 60 * 1000 },
        { name: "4 hours", ms: 4 * 60 * 60 * 1000, testAfter: 5 * 60 * 60 * 1000 },
        { name: "1 day", ms: 24 * 60 * 60 * 1000, testAfter: 25 * 60 * 60 * 1000 },
      ];

      intervals.forEach(({ name, ms, testAfter }) => {
        const strategy = new TimeIntervalStrategy({ intervalMs: ms });
        const startTime = new Date(0);
        const endTime = new Date(testAfter);
        
        expect(strategy.shouldNotify(startTime, endTime)).toBe(true);
      });
    });

    it("should handle timezone considerations", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour
      
      // Same moment in different timezones
      const utcTime = new Date("2025-01-01T12:00:00Z");
      const estTime = new Date("2025-01-01T07:00:00-05:00"); // Same moment
      
      // Same moment should not trigger notification
      expect(strategy.shouldNotify(utcTime, estTime)).toBe(false);
      
      // 1 hour later in UTC
      const utcPlusHour = new Date("2025-01-01T13:00:00Z");
      expect(strategy.shouldNotify(utcTime, utcPlusHour)).toBe(true);
    });

    it("should handle daylight saving time transitions", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour
      
      // Spring forward (2AM becomes 3AM)
      const beforeDST = new Date("2025-03-09T06:00:00Z"); // 1AM EST
      const afterDST = new Date("2025-03-09T07:00:00Z"); // 3AM EDT (2 hours UTC, 1 hour local)
      
      // Should still work with UTC calculations
      expect(strategy.shouldNotify(beforeDST, afterDST)).toBe(true);
    });

    it("should handle leap year and month boundaries", () => {
      const dailyStrategy = new TimeIntervalStrategy({ 
        intervalMs: 24 * 60 * 60 * 1000 // 1 day
      });
      
      // February 28 to March 1 in leap year
      const feb28 = new Date("2024-02-28T12:00:00Z");
      const mar1 = new Date("2024-03-01T12:00:00Z"); // 2 days later in leap year
      
      expect(dailyStrategy.shouldNotify(feb28, mar1)).toBe(true);
      
      // February 28 to 29 in leap year
      const feb29 = new Date("2024-02-29T12:00:00Z");
      expect(dailyStrategy.shouldNotify(feb28, feb29)).toBe(true);
    });
  });

  describe("Performance and Precision", () => {
    it("should handle precision within allowed intervals", () => {
      const precisionStrategy = new TimeIntervalStrategy({ intervalMs: 1001 }); // Just above 1 second
      
      const time1 = new Date(1000);
      const time2 = new Date(2001); // 1001ms difference
      
      // Exactly at threshold, should notify
      expect(precisionStrategy.shouldNotify(time1, time2)).toBe(true);
      
      // Just below threshold should not notify  
      const time3 = new Date(2000); // 1000ms difference
      expect(precisionStrategy.shouldNotify(time1, time3)).toBe(false);
    });

    it("should be consistent with Math.abs calculations", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 1000 });
      
      const time1 = new Date(5000);
      const time2 = new Date(7000);
      
      // Order should not matter due to Math.abs
      expect(strategy.shouldNotify(time1, time2))
        .toBe(strategy.shouldNotify(time2, time1));
    });
  });

  describe("Integration Tests", () => {
    it("should work correctly in notification loop simulation", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 30000 }); // 30 seconds
      
      let lastNotified = new Date("2025-01-01T00:00:00Z");
      const times = [
        new Date("2025-01-01T00:00:15Z"), // 15s later - should not notify
        new Date("2025-01-01T00:00:35Z"), // 35s later - should notify
        new Date("2025-01-01T00:00:50Z"), // 15s from last notification - should not notify  
        new Date("2025-01-01T00:01:10Z"), // 35s from last notification - should notify
      ];
      
      expect(strategy.shouldNotify(lastNotified, times[0])).toBe(false);
      expect(strategy.shouldNotify(lastNotified, times[1])).toBe(true);
      
      // Update last notified time
      lastNotified = times[1];
      expect(strategy.shouldNotify(lastNotified, times[2])).toBe(false);
      expect(strategy.shouldNotify(lastNotified, times[3])).toBe(true);
    });
  });
});