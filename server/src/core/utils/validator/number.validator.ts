import { InvalidNumberError } from "#/core/errors";

export class NumberValidator {
  static isValidNumber(value: number): boolean {
    return (
      typeof value === "number" &&
      !isNaN(value) &&
      isFinite(value) &&
      value >= 0
    );
  }

  static validateNumber(value: number): number {
    if (typeof value !== "number") {
      throw new InvalidNumberError(value, "number validation", "not a number");
    }

    if (value === Infinity) {
      throw new InvalidNumberError(
        value,
        "number validation",
        "positive infinity",
      );
    }

    if (value === -Infinity) {
      throw new InvalidNumberError(
        value,
        "number validation",
        "negative infinity",
      );
    }

    if (isNaN(value)) {
      throw new InvalidNumberError(value, "number validation", "not a number");
    }

    if (value < 0) {
      throw new InvalidNumberError(
        value,
        "number validation",
        "negative number",
      );
    }

    return value;
  }
}
