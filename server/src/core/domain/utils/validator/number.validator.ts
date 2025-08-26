import { InvalidNumberException } from "#domain/exceptions";

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
      throw new InvalidNumberException(value);
    }

    if (value === Infinity) {
      throw new InvalidNumberException(value);
    }

    if (value === -Infinity) {
      throw new InvalidNumberException(value);
    }

    if (isNaN(value)) {
      throw new InvalidNumberException(value);
    }

    if (value < 0) {
      throw new InvalidNumberException(value);
    }

    return value;
  }
}
