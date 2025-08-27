import { describe, it, expect } from "vitest";
import { NftTarget } from "#domain/entities/target";
import { InvalidNumberException, InvalidDateException } from "#domain/exceptions";

describe("NftTarget Entity", () => {
  const nftMeta = {
    name: "Test NFT",
    slug: "test-nft", 
    source: "opensea",
    chain: "ethereum",
    symbol: "TEST"
  };
  describe("Constructor", () => {
    it("should create a valid NftTarget with correct type", () => {
      const state = {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 1.5,
      };
      const target = new NftTarget(nftMeta, state);

      expect(target.type).toBe("nft");
      expect(target.state.lastNotifiedAt).toEqual(state.lastNotifiedAt);
      expect(target.state.lastNotifiedPrice).toBe(1.5);
    });

    it("should accept zero price (free NFT)", () => {
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 0,
      };
      const target = new NftTarget(nftMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(0);
    });

    it("should accept fractional ETH prices", () => {
      const fractionalPrice = 0.0001;
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: fractionalPrice,
      };
      const target = new NftTarget(nftMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(fractionalPrice);
    });

    it("should accept high-value NFT prices", () => {
      const highPrice = 100000;
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: highPrice,
      };
      const target = new NftTarget(nftMeta, state);

      expect(target.state.lastNotifiedPrice).toBe(highPrice);
    });

    it("should validate date correctly", () => {
      const validDate = new Date("2025-12-31T23:59:59.999Z");
      const state = {
        lastNotifiedAt: validDate,
        lastNotifiedPrice: 2.5,
      };
      const target = new NftTarget(nftMeta, state);

      expect(target.state.lastNotifiedAt).toEqual(validDate);
    });
  });

  describe("Error Cases - Invalid Numbers", () => {
    const validDate = new Date();

    it("should throw InvalidNumberException for negative prices", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -1,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -0.1,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: Number.MIN_SAFE_INTEGER,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for Infinity", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: Infinity,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for -Infinity", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -Infinity,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for NaN", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: NaN,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should throw InvalidNumberException for non-number types", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: "2.5" as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: null as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: undefined as any,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: {} as any,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should have correct error properties for invalid numbers", () => {
      try {
        new NftTarget(nftMeta, {
          lastNotifiedAt: validDate,
          lastNotifiedPrice: -5.5,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidNumberException);
        expect((error as InvalidNumberException).errorSlug).toBe("INVALID_NUMBER");
        expect((error as InvalidNumberException).message).toContain("invalid number");
        expect((error as InvalidNumberException).message).toContain("-5.5");
      }
    });
  });

  describe("Error Cases - Invalid Dates", () => {
    const validPrice = 1.0;

    it("should throw InvalidDateException for invalid dates", () => {
      const invalidDates = [
        new Date("invalid-date"),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
        new Date("2025-13-01"), // Invalid month
        new Date("2025-01-32"), // Invalid day
      ];

      invalidDates.forEach((invalidDate) => {
        expect(() => {
          new NftTarget(nftMeta, {
            lastNotifiedAt: invalidDate,
            lastNotifiedPrice: validPrice,
          });
        }).toThrow(InvalidDateException);
      });
    });

    it("should throw InvalidDateException for non-Date objects", () => {
      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: "2025-01-01" as any,
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: 1672531200000 as any, // timestamp number
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: null as any,
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);

      expect(() => {
        new NftTarget(nftMeta, {
          lastNotifiedAt: undefined as any,
          lastNotifiedPrice: validPrice,
        });
      }).toThrow(InvalidDateException);
    });

    it("should have correct error properties for invalid dates", () => {
      const invalidDate = new Date("invalid");
      try {
        new NftTarget(nftMeta, {
          lastNotifiedAt: invalidDate,
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
        new Date("2025-02-28T12:34:56.789Z"), // Leap year edge
      ];

      extremeDates.forEach((date) => {
        const target = new NftTarget(nftMeta, {
          lastNotifiedAt: date,
          lastNotifiedPrice: 1.0,
        });
        expect(target.state.lastNotifiedAt).toEqual(date);
      });
    });

    it("should handle extreme but valid NFT prices", () => {
      const extremePrices = [
        0, // Free mint
        Number.EPSILON,
        0.000001, // Very cheap
        0.000000000000001,
        1000000, // Expensive NFT
        Number.MAX_SAFE_INTEGER,
        Number.MAX_VALUE,
        1e-18, // Wei level precision
      ];

      extremePrices.forEach((price) => {
        const target = new NftTarget(nftMeta, {
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: price,
        });
        expect(target.state.lastNotifiedPrice).toBe(price);
      });
    });
  });

  describe("withUpdatedState Method", () => {
    it("should create new instance with updated state", () => {
      const original = new NftTarget(nftMeta, {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 1.5,
      });

      const newState = {
        lastNotifiedAt: new Date("2025-01-02"),
        lastNotifiedPrice: 3.0,
      };

      const updated = original.withUpdatedState(newState);

      expect(updated).not.toBe(original);
      expect(updated.state.lastNotifiedAt).toEqual(newState.lastNotifiedAt);
      expect(updated.state.lastNotifiedPrice).toBe(newState.lastNotifiedPrice);
      expect(original.state.lastNotifiedPrice).toBe(1.5); // Original unchanged
    });

    it("should validate new state in withUpdatedState", () => {
      const original = new NftTarget(nftMeta, {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 1.0,
      });

      expect(() => {
        original.withUpdatedState({
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: -1.5,
        });
      }).toThrow(InvalidNumberException);

      expect(() => {
        original.withUpdatedState({
          lastNotifiedAt: new Date("invalid"),
          lastNotifiedPrice: 1.0,
        });
      }).toThrow(InvalidDateException);

      expect(() => {
        original.withUpdatedState({
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: NaN,
        });
      }).toThrow(InvalidNumberException);
    });

    it("should maintain type after update", () => {
      const original = new NftTarget(nftMeta, {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 1.0,
      });

      const updated = original.withUpdatedState({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 2.0,
      });

      expect(updated.type).toBe("nft");
      expect(updated).toBeInstanceOf(NftTarget);
    });

    it("should handle same state update", () => {
      const state = {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 1.0,
      };
      const original = new NftTarget(nftMeta, state);
      const updated = original.withUpdatedState(state);

      expect(updated).not.toBe(original);
      expect(updated.state).toEqual(original.state);
    });

    it("should handle price updates from 0 to positive", () => {
      const original = new NftTarget(nftMeta, {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 0,
      });

      const updated = original.withUpdatedState({
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 5.0,
      });

      expect(updated.state.lastNotifiedPrice).toBe(5.0);
    });
  });


  describe("NFT-Specific Scenarios", () => {
    it("should handle common NFT price patterns", () => {
      const nftScenarios = [
        { price: 0, description: "Free mint" },
        { price: 0.01, description: "Cheap NFT" },
        { price: 0.1, description: "Mid-tier NFT" },
        { price: 1.0, description: "Premium NFT" },
        { price: 10.0, description: "High-value NFT" },
        { price: 100.0, description: "Blue chip NFT" },
      ];

      nftScenarios.forEach(({ price, description }) => {
        const target = new NftTarget(nftMeta, {
          lastNotifiedAt: new Date(),
          lastNotifiedPrice: price,
        });
        expect(target.state.lastNotifiedPrice).toBe(price);
        expect(target.type).toBe("nft");
      });
    });

    it("should handle floor price changes", () => {
      // Simulate floor price going from high to low (market crash)
      const original = new NftTarget(nftMeta, {
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 50.0,
      });

      const afterCrash = original.withUpdatedState({
        lastNotifiedAt: new Date("2025-01-02"),
        lastNotifiedPrice: 0.1,
      });

      expect(afterCrash.state.lastNotifiedPrice).toBe(0.1);
      expect(original.state.lastNotifiedPrice).toBe(50.0);
    });
  });
});