import { describe, it, expect } from "vitest";
import { TokenTarget } from "#domain/entities/target";
import { InvalidNumberException, InvalidDateException } from "#domain/exceptions";

describe("TokenTarget Entity", () => {
  const tokenMeta = {
    source: "coingecko",
    symbol: "BTC",
    decimals: 8
  };
  describe("Constructor", () => {
    it("should create a valid TokenTarget with correct type", () => {
      const state = {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      };
      const target = new TokenTarget(tokenMeta, state);

      expect(target.type).toBe("token");
      expect(target.state.lastNotifiedAt).toEqual(state.lastNotifiedAt);
      expect(target.state.lastNotifiedPrice).toBe(100);
    });

    it("should accept zero price", () => {
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 0,
      };
      const target = new TokenTarget(tokenMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(0);
    });

    it("should accept very small positive numbers", () => {
      const smallPrice = 0.000000001;
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: smallPrice,
      };
      const target = new TokenTarget(tokenMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(smallPrice);
    });

    it("should accept maximum safe integer", () => {
      const maxPrice = Number.MAX_SAFE_INTEGER;
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: maxPrice,
      };
      const target = new TokenTarget(tokenMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(maxPrice);
    });

    it("should validate date correctly", () => {
      const validDate = new Date("2025-12-31T23:59:59.999Z");
      const state = {
        lastNotifiedAt: validDate,
        lastNotifiedPrice: 100,
      };
      const target = new TokenTarget(tokenMeta, state);

      expect(target.state.lastNotifiedAt).toEqual(validDate);
    });
  });

  describe("Error Cases - Invalid Numbers", () => {
    const validDate = new Date();

    it("should throw InvalidNumberException for negative numbers", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -1,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -0.1,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: Number.MIN_SAFE_INTEGER,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for Infinity", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: Infinity,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for -Infinity", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -Infinity,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for NaN", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: NaN,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for non-number types", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: "100" as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: null as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: undefined as any,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should have correct error properties for invalid numbers", () => {
      try {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -100,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
      }
    });
  });

  describe("Error Cases - Invalid Dates", () => {
    const validPrice = 100;

    it("should throw InvalidDateException for invalid dates", () => {
      const invalidDates = [
        new Date("invalid-date"),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
      ];

      invalidDates.forEach((invalidDate) => {
        expect(() => {
          new TokenTarget(tokenMeta, {
            lastNotifiedAt: invalidDate,
            lastNotifiedPrice: validPrice,
          });
        }).toThrow(InvalidDateException);
      });
    });

    it("should throw InvalidDateException for non-Date objects", () => {
      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: "2025-01-01" as any,
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);

      expect(() => {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: 1672531200000 as any, // timestamp
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);
    });

    it("should have correct error properties for invalid dates", () => {
      try {
        new TokenTarget(tokenMeta, {
          lastNotifiedAt: new Date("invalid"),
          lastNotifiedPrice: validPrice,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidDateException);
        expect((error as InvalidDateException).errorSlug).toBe("INVALID_DATE");
        expect((error as InvalidDateException).message).toContain("invalid date");
      }
    });
  });

  describe("Edge Cases - Valid Extreme Values", () => {
    it("should handle extreme but valid dates", () => {
      const extremeDates = [
        new Date(0), // Unix epoch
        new Date("1970-01-01T00:00:00.000Z"),
        new Date("2099-12-31T23:59:59.999Z"),
        new Date(8640000000000000), // Max safe date
        new Date(-8640000000000000), // Min safe date
      ];

      extremeDates.forEach((date) => {
        const target = new TokenTarget(tokenMeta, {
          lastNotifiedAt: date,
          lastNotifiedPrice: 100,
        });
        expect(target.state.lastNotifiedAt).toEqual(date);
      });
    });

    it("should handle extreme but valid prices", () => {
      const extremePrices = [
        0,
        Number.EPSILON,
        0.000000000000001,
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
        1e-10,
        1e10,
      ];

      extremePrices.forEach((price) => {
        const target = new TokenTarget(tokenMeta, {
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: price,
        });
        expect(target.state.lastNotifiedPrice).toBe(price);
      });
    });
  });

  describe("withUpdatedState Method", () => {
    it("should create new instance with updated state", () => {
      const original = new TokenTarget(tokenMeta, {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      });

      const newState = {
        lastNotifiedAt: new Date("2025-01-02"),
        lastNotifiedPrice: 200,
      };

      const updated = original.withUpdatedState(newState);

      expect(updated).not.toBe(original);
      expect(updated.state.lastNotifiedAt).toEqual(newState.lastNotifiedAt);
      expect(updated.state.lastNotifiedPrice).toBe(newState.lastNotifiedPrice);
      expect(original.state.lastNotifiedPrice).toBe(100); // Original unchanged
    });

    it("should validate new state in withUpdatedState", () => {
      const original = new TokenTarget(tokenMeta, {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });

      expect(() => {
        original.withUpdatedState({
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: -50,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        original.withUpdatedState({
          lastNotifiedAt: new Date("invalid"),
          lastNotifiedPrice: 100,
        });
      }).toThrow(InvalidDateException);
    });

    it("should maintain type after update", () => {
      const original = new TokenTarget(tokenMeta, {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 100,
      });

      const updated = original.withUpdatedState({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 200,
      });

      expect(updated.type).toBe("token");
      expect(updated).toBeInstanceOf(TokenTarget);
    });

    it("should handle same state update", () => {
      const state = {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 100,
      };
      const original = new TokenTarget(tokenMeta, state);
      const updated = original.withUpdatedState(state);

      expect(updated).not.toBe(original);
      expect(updated.state).toEqual(original.state);
    });
  });

});