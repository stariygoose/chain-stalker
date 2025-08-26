import { DomainError } from "./domain-error.abstract";

export class SubscriptionConfigurationError extends DomainError {
  constructor(reason: string) {
    super(`Subscription configuration error: ${reason}`);
  }
}
