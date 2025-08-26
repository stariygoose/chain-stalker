import { DomainException } from "../base/domain-exception.abstract";

export class InvalidDateException extends DomainException {
  readonly errorSlug: string = "INVALID_DATE";
  constructor(date: Date) {
    super(`invalid date. Date is: ${date}`, "INVALID_DATE");
  }
}

export class InvalidNumberException extends DomainException {
  readonly errorSlug: string = "INVALID_NUMBER";
  constructor(number: number) {
    super(`invalid number. Number is: ${number}`, "INVALID_NUMBER");
  }
}
