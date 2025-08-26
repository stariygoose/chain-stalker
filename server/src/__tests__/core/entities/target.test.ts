import { NftTarget } from "#domain/entities/target";
import {
  InvalidNumberException,
  InvalidDateException,
} from "#domain/exceptions";

describe("Target Entities", () => {
  describe("Nft Target Entity", () => {
    it("should create a target entity with the valid state", () => {
      const state = {
        lastNotifiedAt: new Date(),
        lastNotifiedPrice: 1,
      };
      const target = new NftTarget(state);

      expect(target.type).toBe("nft");
      expect(target.state).toEqual(state);
    });

    it("should handle extreme price values", () => {
      const extremePrices = [
        { price: 0, desc: "zero price" },
        { price: 0.000000000000000000000001, desc: "extremely small price" },
        { price: Number.MAX_SAFE_INTEGER, desc: "maximum safe integer" },
        { price: 999999999999999.9999999999999, desc: "extremely large price" },
      ];

      extremePrices.forEach(({ price }) => {
        const target = new NftTarget({
          lastNotifiedPrice: price,
          lastNotifiedAt: new Date(),
        });

        expect(target.state.lastNotifiedPrice).toBe(price);
      });
    });

    it("should reject invalid numeric values", () => {
      const invalidValues = [
        { value: Infinity, desc: "positive infinity" },
        { value: -Infinity, desc: "negative infinity" },
        { value: NaN, desc: "not a number" },
      ];

      invalidValues.forEach(({ value }) => {
        expect(() => {
          new NftTarget({
            lastNotifiedAt: new Date(),
            lastNotifiedPrice: value,
          });
        }).toThrow(InvalidNumberException);
      });

      invalidValues.forEach(({ value }) => {
        try {
          new NftTarget({
            lastNotifiedAt: new Date(),
            lastNotifiedPrice: value,
          });
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidNumberException);
          expect((error as InvalidNumberException).errorSlug).toBe(
            "INVALID_NUMBER",
          );
        }
      });
    });

    it("should reject invalid dates", () => {
      const invalidDates = [
        new Date("invalid"),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
      ];

      invalidDates.forEach((date) => {
        expect(() => {
          new NftTarget({
            lastNotifiedAt: date,
            lastNotifiedPrice: 100,
          });
        }).toThrow(InvalidDateException);
      });

      invalidDates.forEach((date) => {
        try {
          new NftTarget({
            lastNotifiedAt: date,
            lastNotifiedPrice: 100,
          });
        } catch (error) {
          expect(error).toBeInstanceOf(InvalidDateException);
          expect((error as InvalidDateException).errorSlug).toBe(
            "INVALID_DATE",
          );
        }
      });
    });

    it("should handle extreme dates", () => {
      const extremeDates = [
        new Date(0), // Unix epoch
        new Date("1970-01-01"),
        new Date("2099-12-31"),
        new Date(8640000000000000), // Max date
        new Date(-8640000000000000), // Min date
      ];

      extremeDates.forEach((date) => {
        const nft = new NftTarget({
          lastNotifiedAt: date,
          lastNotifiedPrice: 100,
        });

        expect(nft.state.lastNotifiedAt).toEqual(date);
      });
    });

    it("should create new instance on state update (immutability)", () => {
      const original = new NftTarget({
        lastNotifiedAt: new Date("2025-01-01"),
        lastNotifiedPrice: 1000,
      });

      const updated = original.withUpdatedState({
        lastNotifiedAt: new Date("2025-01-02"),
        lastNotifiedPrice: 2000,
      });

      expect(updated).not.toBe(original);
      expect(original.state.lastNotifiedPrice).toBe(1000);
      expect(updated.state.lastNotifiedPrice).toBe(2000);
    });
  });
});
