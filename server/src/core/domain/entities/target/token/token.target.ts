import { DateValidator, NumberValidator } from "#domain/utils/validator";
import { ITarget } from "../base/target.interface";
import { TargetState } from "../base/types";
import { TokenTargetMeta } from "./types";

interface ITokenTarget extends ITarget<ITokenTarget> {
  readonly type: "token";
  readonly source: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly state: TargetState;

  withUpdatedState(state: TargetState): ITokenTarget;
}

export class TokenTarget implements ITokenTarget {
  readonly type = "token";
  readonly source: string;
  readonly symbol: string;
  readonly decimals: number;

  readonly state: TargetState;

  constructor(meta: TokenTargetMeta, state: TargetState) {
    this.symbol = meta.symbol;
    this.decimals = meta.decimals;
    this.source = meta.source;
    this.state = {
      lastNotifiedAt: DateValidator.validateDate(state.lastNotifiedAt),
      lastNotifiedPrice: NumberValidator.validateNumber(
        state.lastNotifiedPrice,
      ),
    };
  }

  withUpdatedState(state: TargetState): ITokenTarget {
    const meta = {
      source: this.source,
      symbol: this.symbol,
      decimals: this.decimals,
    };
    return new TokenTarget(meta, state);
  }
}
