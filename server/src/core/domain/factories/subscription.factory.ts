import {
  PriceChangeStrategy,
  PriceChangeStrategyMode,
  TimeIntervalStrategy,
} from "#domain/entities/strategy";
import {
  NftTarget,
  Target,
  TargetType,
  TokenTarget,
} from "#domain/entities/target";
import { NftTargetMeta } from "#domain/entities/target/nft/types";
import { TokenTargetMeta } from "#domain/entities/target/token/types";
import { TargetState } from "#domain/entities/target/base/types";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException } from "#domain/exceptions";

export interface PriceChangeSubscriptionParams {
  _id?: string | null;
  userId: string;
  threshold: number;
  mode: PriceChangeStrategyMode;
  targetType: TargetType;
  targetMeta: NftTargetMeta | TokenTargetMeta;
  targetState: TargetState;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IntervalSubscriptionParams {
  _id?: string | null;
  userId: string;
  intervalMs: number;
  targetType: TargetType;
  targetMeta: NftTargetMeta | TokenTargetMeta;
  targetState: TargetState;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTargetParams {
  type: TargetType;
  meta: NftTargetMeta | TokenTargetMeta;
  state: TargetState;
}

export class SubscriptionFactory {
  static createPriceChangeSubscription(
    params: PriceChangeSubscriptionParams,
  ): Subscription<PriceChangeStrategy> {
    const target = SubscriptionFactory.createTarget({
      type: params.targetType,
      meta: params.targetMeta,
      state: params.targetState,
    });
    const strategy = new PriceChangeStrategy({ 
      mode: params.mode, 
      threshold: params.threshold 
    });
    return new Subscription(
      params.userId, 
      target, 
      strategy, 
      params.isActive ?? true,
      params._id ?? null,
      params.updatedAt ?? new Date(),
      params.createdAt ?? new Date()
    );
  }

  static createIntervalChangeSubscription(
    params: IntervalSubscriptionParams,
  ) {
    const target = SubscriptionFactory.createTarget({
      type: params.targetType,
      meta: params.targetMeta,
      state: params.targetState,
    });

    const strategy = new TimeIntervalStrategy({ intervalMs: params.intervalMs });
    return new Subscription(
      params.userId, 
      target, 
      strategy, 
      params.isActive ?? true,
      params._id ?? null,
      params.updatedAt ?? new Date(),
      params.createdAt ?? new Date()
    );
  }

  private static createTarget(params: CreateTargetParams): Target {
    switch (params.type) {
      case "nft":
        return new NftTarget(params.meta as NftTargetMeta, params.state);
      case "token":
        return new TokenTarget(params.meta as TokenTargetMeta, params.state);
      default:
        const exhaustiveCheck: never = params.type;
        throw new FactoryException(`unknown target type <${exhaustiveCheck}>`);
    }
  }
}
