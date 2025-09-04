import {
  PriceChangeStrategy,
  Strategy,
  TimeIntervalStrategy,
} from "#domain/entities/strategy";
import { Target, TargetType } from "#domain/entities/target";
import { NftTargetMeta } from "#domain/entities/target/nft/types";
import { TokenTargetMeta } from "#domain/entities/target/token/types";
import { TargetState } from "#domain/entities/target/base/types";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException } from "#domain/exceptions";

interface CreateSubscriptionDto {
  _id: string | null;
  userId: string;
  target: Target;
  strategy: Strategy;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTargetParams {
  type: TargetType;
  meta: NftTargetMeta | TokenTargetMeta;
  state: TargetState;
}

export class SubscriptionFactory {
  static createSubscription(
    dto: CreateSubscriptionDto,
  ): Subscription<Strategy> {
    const { type } = dto.strategy;

    switch (type) {
      case "price-change": {
        const strategy = new PriceChangeStrategy(dto.strategy.config);
        return new Subscription(
          dto.userId,
          dto.target,
          strategy,
          dto.isActive,
          dto._id,
          dto.updatedAt,
          dto.createdAt,
        );
      }
      case "interval-change": {
        const strategy = new TimeIntervalStrategy(dto.strategy.config);
        return new Subscription(
          dto.userId,
          dto.target,
          strategy,
          dto.isActive,
          dto._id,
          dto.updatedAt,
          dto.createdAt,
        );
      }
      default: {
        const exhaustive: never = type;
        throw new FactoryException(`Unknown subscription kind <${exhaustive}>`);
      }
    }
  }
}
