import { DomainError } from "./domain-error.abstract";

class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidNumberError extends ValidationError {
  constructor(
    readonly value: number,
    readonly context: string,
    readonly reason: string,
  ) {
    super(`Invalid price value: ${reason}`);
  }
}

export class InvalidDateError extends ValidationError {
  constructor(
    readonly value: Date,
    readonly context: string = "date validation",
  ) {
    super("Invalid date value");
  }
}

export class InvalidEntityStateError extends ValidationError {
  constructor(
    readonly entityName: string,
    readonly reason: string,
  ) {
    super(`Invalid ${entityName} state: ${reason}`);
  }
}
