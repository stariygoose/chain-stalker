import { DomainException } from "../base/domain-exception.abstract";

export class FactoryException extends DomainException {
  constructor(reason: string) {
    super(reason, "FACTORY_EXCEPTION");
  }
}
