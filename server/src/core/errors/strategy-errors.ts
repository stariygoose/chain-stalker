import { DomainError } from "./domain-error.abstract";

export class StrategyConfigurationError extends DomainError {
  constructor(reason: string) {
    super(`Strategy configuration error: ${reason}`);
  }
}
