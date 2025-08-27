import { describe, it, expect } from "vitest";
import { TimeIntervalStrategy } from "#domain/entities/strategy";
import { TokenTarget } from "#domain/entities/target";
import { StrategyException } from "#domain/exceptions";

describe("TimeIntervalStrategy", () => {
  const createTarget = (lastNotifiedAt: Date) =>
    new TokenTarget(
      { source: "test", symbol: "TEST", decimals: 18 },
      { lastNotifiedPrice: 100, lastNotifiedAt },
    );

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
    it("should throw StrategyException for invalid interval values", () => {
      expect(() => {
        new TimeIntervalStrategy({ intervalMs: NaN });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: Infinity });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: -Infinity });
      }).toThrow(StrategyException);
    });

    it("should throw StrategyException for intervals below minimum", () => {
      expect(() => {
        new TimeIntervalStrategy({ intervalMs: 999 });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: 0 });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: -1000 });
      }).toThrow(StrategyException);
    });

    it("should throw StrategyException for non-number interval", () => {
      expect(() => {
        new TimeIntervalStrategy({ intervalMs: "3600000" as any });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: null as any });
      }).toThrow(StrategyException);

      expect(() => {
        new TimeIntervalStrategy({ intervalMs: undefined as any });
      }).toThrow(StrategyException);
    });
  });

  describe("shouldNotify - Basic Functionality", () => {
    const strategy = new TimeIntervalStrategy({
      intervalMs: 3600000, // 1 hour
    });

    it("should notify when time difference exceeds interval", () => {
      const currentTime = new Date("2023-01-01T00:00:00Z");
      const after90min = new Date(currentTime.getTime() + 90 * 60 * 1000);
      expect(strategy.shouldNotify(createTarget(currentTime), after90min)).toBe(
        true,
      );

      const after2hours = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);
      expect(
        strategy.shouldNotify(createTarget(currentTime), after2hours),
      ).toBe(true);

      const after5hours = new Date(currentTime.getTime() + 5 * 60 * 60 * 1000);
      expect(
        strategy.shouldNotify(createTarget(currentTime), after5hours),
      ).toBe(true);
    });

    it("should not notify when time difference is below interval", () => {
      const currentTime = new Date("2023-01-01T00:00:00Z");
      const after30min = new Date(currentTime.getTime() + 30 * 60 * 1000);
      expect(strategy.shouldNotify(createTarget(currentTime), after30min)).toBe(
        false,
      );

      const after59min = new Date(currentTime.getTime() + 59 * 60 * 1000);
      expect(strategy.shouldNotify(createTarget(currentTime), after59min)).toBe(
        false,
      );

      const almostHour = new Date(currentTime.getTime() + (3600000 - 1));
      expect(strategy.shouldNotify(createTarget(currentTime), almostHour)).toBe(
        false,
      );
    });

    it("should notify when time difference equals interval", () => {
      const currentTime = new Date("2023-01-01T00:00:00Z");
      const exactlyOneHour = new Date(currentTime.getTime() + 3600000);
      expect(
        strategy.shouldNotify(createTarget(currentTime), exactlyOneHour),
      ).toBe(true);
    });

    it("should handle reverse time order (new time before current)", () => {
      const currentTime = new Date("2023-01-01T05:00:00Z");
      const futureTime = new Date("2023-01-01T03:00:00Z");
      expect(strategy.shouldNotify(createTarget(futureTime), currentTime)).toBe(
        true,
      );
    });

    it("should not notify for same time", () => {
      const time = new Date("2023-01-01T00:00:00Z");
      expect(strategy.shouldNotify(createTarget(time), time)).toBe(false);
    });
  });

  describe("shouldNotify - Different Intervals", () => {
    it("should work with different interval values", () => {
      const startTime = new Date("2023-01-01T00:00:00Z");
      const after1min = new Date(startTime.getTime() + 60000);
      const after1hour = new Date(startTime.getTime() + 3600000);
      const after1day = new Date(startTime.getTime() + 86400000);

      const shortInterval = new TimeIntervalStrategy({ intervalMs: 30000 }); // 30 seconds
      const longInterval = new TimeIntervalStrategy({ intervalMs: 86400000 }); // 1 day

      expect(
        shortInterval.shouldNotify(createTarget(startTime), after1min),
      ).toBe(true); // 1 min > 30 sec
      expect(
        longInterval.shouldNotify(createTarget(startTime), after1hour),
      ).toBe(false); // 1 hour < 1 day
      expect(
        longInterval.shouldNotify(createTarget(startTime), after1day),
      ).toBe(true); // 1 day = 1 day
    });

    it("should handle minimum interval correctly", () => {
      const minInterval = new TimeIntervalStrategy({ intervalMs: 1000 }); // 1 second
      const time1 = new Date("2023-01-01T00:00:00.000Z");
      const time2 = new Date("2023-01-01T00:00:01.000Z"); // +1 second
      const time3 = new Date("2023-01-01T00:00:02.000Z"); // +2 seconds

      expect(minInterval.shouldNotify(createTarget(time1), time2)).toBe(true); // 1s = 1s threshold
      expect(minInterval.shouldNotify(createTarget(time1), time3)).toBe(true); // 2s > 1s threshold
    });

    it("should handle very long intervals", () => {
      const longInterval = new TimeIntervalStrategy({
        intervalMs: 31536000000, // 1 year
      });

      const startTime = new Date("2023-01-01T00:00:00Z");
      const after6months = new Date("2023-07-01T00:00:00Z");
      const after1year = new Date("2024-01-01T00:00:00Z");

      expect(
        longInterval.shouldNotify(createTarget(startTime), after6months),
      ).toBe(false);
      expect(
        longInterval.shouldNotify(createTarget(startTime), after1year),
      ).toBe(true);
    });

    it("should handle fractional intervals", () => {
      const fractionalInterval = new TimeIntervalStrategy({
        intervalMs: 1500.5,
      }); // 1.5005 seconds
      const time1 = new Date("2023-01-01T00:00:00.000Z");
      const time2 = new Date("2023-01-01T00:00:01.500Z"); // +1500ms
      const time3 = new Date("2023-01-01T00:00:01.501Z"); // +1501ms

      expect(fractionalInterval.shouldNotify(createTarget(time1), time2)).toBe(
        false,
      ); // 1500ms < 1500.5ms
      expect(fractionalInterval.shouldNotify(createTarget(time1), time3)).toBe(
        true,
      ); // 1501ms > 1500.5ms
    });
  });

  describe("Edge Cases and Extreme Values", () => {
    it("should handle extreme date values", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 86400000 }); // 1 day
      const epochTime = new Date(0); // 1970-01-01T00:00:00.000Z
      const maxTime = new Date(8640000000000000); // Maximum representable date
      const minTime = new Date(-8640000000000000); // Minimum representable date

      expect(strategy.shouldNotify(createTarget(epochTime), maxTime)).toBe(
        true,
      );
      expect(strategy.shouldNotify(createTarget(minTime), epochTime)).toBe(
        true,
      );
    });

    it("should handle millisecond precision", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 1000 }); // 1 second

      for (let i = 0; i < 10; i++) {
        const startTime = new Date("2023-01-01T00:00:00.000Z");
        const endTime = new Date(startTime.getTime() + 1000 + i);

        expect(strategy.shouldNotify(createTarget(startTime), endTime)).toBe(
          true,
        );
      }
    });

    it("should work across time zones", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour
      const utcTime = new Date("2023-01-01T12:00:00Z");
      const estTime = new Date("2023-01-01T07:00:00-05:00"); // Same UTC time
      const utcPlusHour = new Date("2023-01-01T13:00:00Z");

      expect(strategy.shouldNotify(createTarget(utcTime), estTime)).toBe(false);
      expect(strategy.shouldNotify(createTarget(utcTime), utcPlusHour)).toBe(
        true,
      );
    });

    it("should handle daylight saving time transitions", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour

      // DST transition example (spring forward)
      const beforeDST = new Date("2023-03-12T06:00:00Z"); // 1 AM EST
      const afterDST = new Date("2023-03-12T07:00:00Z"); // 3 AM EDT (skipped 2 AM)

      expect(strategy.shouldNotify(createTarget(beforeDST), afterDST)).toBe(
        true,
      );
    });

    it("should handle leap years and month boundaries", () => {
      const dailyStrategy = new TimeIntervalStrategy({ intervalMs: 86400000 }); // 1 day

      const feb28 = new Date("2023-02-28T12:00:00Z");
      const mar1 = new Date("2023-03-01T12:00:00Z");
      const feb29 = new Date("2024-02-29T12:00:00Z"); // Leap year

      expect(dailyStrategy.shouldNotify(createTarget(feb28), mar1)).toBe(true);
      expect(dailyStrategy.shouldNotify(createTarget(feb28), feb29)).toBe(true);
    });

    it("should handle sub-second precision", () => {
      const precisionStrategy = new TimeIntervalStrategy({ intervalMs: 1500 }); // 1.5s
      const time1 = new Date("2023-01-01T00:00:00.000Z");
      const time2 = new Date("2023-01-01T00:00:02.000Z"); // +2s
      const time3 = new Date("2023-01-01T00:00:01.500Z"); // +1.5ms
      const time4 = new Date("2023-01-01T00:00:01.499Z"); // +1.499ms

      expect(precisionStrategy.shouldNotify(createTarget(time1), time2)).toBe(
        true,
      );
      expect(precisionStrategy.shouldNotify(createTarget(time1), time3)).toBe(
        true,
      );
      expect(precisionStrategy.shouldNotify(createTarget(time1), time4)).toBe(
        false,
      );
    });

    it("should work symmetrically regardless of time order", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour
      const time1 = new Date("2023-01-01T00:00:00Z");
      const time2 = new Date("2023-01-01T02:00:00Z"); // 2 hours later

      expect(strategy.shouldNotify(createTarget(time1), time2)).toBe(
        strategy.shouldNotify(createTarget(time2), time1),
      );
    });
  });

  describe("Integration and Real-World Scenarios", () => {
    it("should handle typical notification scenarios", () => {
      const strategy = new TimeIntervalStrategy({ intervalMs: 3600000 }); // 1 hour alerts
      const lastNotified = new Date("2023-01-01T10:00:00Z");

      const times = [
        new Date("2023-01-01T10:30:00Z"), // 30 min later - should not notify
        new Date("2023-01-01T11:30:00Z"), // 1.5 hours later - should notify
        new Date("2023-01-01T11:45:00Z"), // 15 min after last notification - should not notify
        new Date("2023-01-01T12:45:00Z"), // 1 hour after last notification - should notify
      ];

      expect(strategy.shouldNotify(createTarget(lastNotified), times[0])).toBe(
        false,
      );
      expect(strategy.shouldNotify(createTarget(lastNotified), times[1])).toBe(
        true,
      );
      expect(strategy.shouldNotify(createTarget(times[1]), times[2])).toBe(
        false,
      );
      expect(strategy.shouldNotify(createTarget(times[1]), times[3])).toBe(
        true,
      );
    });
  });
});
