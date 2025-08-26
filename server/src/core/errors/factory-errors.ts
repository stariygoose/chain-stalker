import { DomainError } from "./domain-error.abstract";

export class FactoryInvalidTargetTypeError extends DomainError {
  constructor(type: string) {
    super(
      `Invalid target type while creating a subscription from factory: ${type}`,
    );
  }
}
