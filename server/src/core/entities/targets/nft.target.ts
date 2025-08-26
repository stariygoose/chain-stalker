import { DateValidator } from "#/core/utils/validator/date.validator";
import { NumberValidator } from "#/core/utils/validator/number.validator";
import { ITarget } from "./base/target.interface";
import { TargetState } from "./base/types";

interface INftTarget extends ITarget<INftTarget> {
  readonly type: "nft";
  readonly state: TargetState;

  withUpdatedState(newState: TargetState): INftTarget;
}

export class NftTarget implements INftTarget {
  readonly type = "nft" as const;
  readonly state: TargetState;

  constructor(state: TargetState) {
    this.state = {
      lastNotifiedPrice: NumberValidator.validateNumber(
        state.lastNotifiedPrice,
      ),
      lastNotifiedAt: DateValidator.validateDate(state.lastNotifiedAt),
    };
  }

  withUpdatedState(newState: TargetState): INftTarget {
    return new NftTarget(newState);
  }
}
