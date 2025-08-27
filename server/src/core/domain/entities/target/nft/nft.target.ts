import { DateValidator, NumberValidator } from "#domain/utils/validator";
import { ITarget } from "../base/target.interface";
import { TargetState } from "../base/types";
import { NftTargetMeta } from "./types";

interface INftTarget extends ITarget<INftTarget> {
  readonly type: "nft";
  readonly name: string;
  readonly slug: string;
  readonly source: string;
  readonly chain: string;
  readonly state: TargetState;
  readonly symbol: string;

  withUpdatedState(newState: TargetState): INftTarget;
}

export class NftTarget implements INftTarget {
  readonly type = "nft" as const;

  readonly name: string;
  readonly slug: string;
  readonly source: string;
  readonly chain: string;
  readonly symbol: string;

  readonly state: TargetState;

  constructor(meta: NftTargetMeta, state: TargetState) {
    this.name = meta.name;
    this.slug = meta.slug;
    this.source = meta.source;
    this.chain = meta.chain;
    this.symbol = meta.symbol;
    this.state = {
      lastNotifiedPrice: NumberValidator.validateNumber(
        state.lastNotifiedPrice,
      ),
      lastNotifiedAt: DateValidator.validateDate(state.lastNotifiedAt),
    };
  }

  withUpdatedState(newState: TargetState): INftTarget {
    const meta = {
      name: this.name,
      slug: this.slug,
      source: this.source,
      chain: this.chain,
      symbol: this.symbol,
    };
    return new NftTarget(meta, newState);
  }
}
