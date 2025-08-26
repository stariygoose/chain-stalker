import { InvalidDateError } from "#/core/errors";

export class DateValidator {
  static isValidDate(date: Date): boolean {
    return (
      date instanceof Date && !isNaN(date.getTime()) && isFinite(date.getTime())
    );
  }

  static validateDate(date: Date): Date {
    if (!this.isValidDate(date)) {
      throw new InvalidDateError(date, "date validation");
    }

    return date;
  }
}
