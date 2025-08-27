import { DomainException } from "../base/domain-exception.abstract";

export class SubscriptionException extends DomainException {
  constructor(reason: string) {
    super(reason, "SUBSCRIPTION_EXCEPTION");
  }
}
