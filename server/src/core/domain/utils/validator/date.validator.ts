import { InvalidDateException } from "#domain/exceptions";

export class DateValidator {
  static isValidDate(date: Date): boolean {
    return (
      date instanceof Date && !isNaN(date.getTime()) && isFinite(date.getTime())
    );
  }

  static validateDate(date: Date): Date {
    if (!this.isValidDate(date)) {
      throw new InvalidDateException(date);
    }

    return date;
  }
}
