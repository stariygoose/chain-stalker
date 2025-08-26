import { DomainException } from "../base/domain-exception.abstract";

export class StrategyException extends DomainException {
  constructor(reason: string) {
    super(reason, "STRATEGY_EXCEPTION");
  }
}
