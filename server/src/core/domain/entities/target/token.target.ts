import { DateValidator, NumberValidator } from "#domain/utils/validator";
import { ITarget } from "./base/target.interface";
import { TargetState } from "./base/types";

interface ITokenTarget extends ITarget<ITokenTarget> {
  readonly type: "token";
  readonly state: TargetState;

  withUpdatedState(state: TargetState): ITokenTarget;
}

export class TokenTarget implements ITokenTarget {
  readonly type = "token";
  readonly state: TargetState;

  constructor(state: TargetState) {
    this.state = {
      lastNotifiedAt: DateValidator.validateDate(state.lastNotifiedAt),
      lastNotifiedPrice: NumberValidator.validateNumber(
        state.lastNotifiedPrice,
      ),
    };
  }

  withUpdatedState(state: TargetState): ITokenTarget {
    return new TokenTarget(state);
  }
}
