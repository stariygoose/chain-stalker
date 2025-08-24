import {
  INftSubscription,
  NftSubscription,
} from "#core/entities/subscription/nft-subscription.class.js";
import {
  ITokenSubscription,
  TokenSubscription,
} from "#core/entities/subscription/token-subscription.class.js";
import {
  INftTarget,
  ITokenTarget,
  Target,
} from "#core/entities/targets/index.js";
import { StrategyFactory } from "#core/factories/strategy.factory.js";
import { DomainError } from "#core/errors/index.js";
import { StrategyType } from "#core/strategies/notification/notification-strategies.interface.js";
import {
  Subscription,
  SubscriptionWithMeta,
} from "#core/entities/subscription/index.js";

import { NftSubscriptionWithMeta } from "#core/entities/subscription/nft-subscription.class.js";
import { TokenSubscriptionWithMeta } from "#core/entities/subscription/token-subscription.class.js";

type SubscriptionMetaData = {
  lastTriggeredAt: Date;
  createdAt: Date;
};

export class SubscriptionFactory {
  public static create(
    id: string | null,
    userId: number,
    target: Target,
    threshold: number,
    strategyType: StrategyType,
    isActive: boolean = true,
  ): Subscription {
    const { type } = target;
    switch (type) {
      case "nft":
        return SubscriptionFactory.createNftSubscription(
          id,
          userId,
          target,
          threshold,
          strategyType,
          isActive,
        );
      case "token":
        return SubscriptionFactory.createTokenSubscription(
          id,
          userId,
          target,
          threshold,
          strategyType,
          isActive,
        );
      default:
        const exhaustiveCheck: never = type;
        throw new DomainError.FactoryInvalidTargetTypeError(exhaustiveCheck);
    }
  }

  public static createWithMeta(
    id: string | null,
    userId: number,
    target: Target,
    threshold: number,
    strategyType: StrategyType,
    metaData: SubscriptionMetaData,
    isActive: boolean = true,
  ): SubscriptionWithMeta {
    const { type } = target;
    switch (type) {
      case "nft":
        return SubscriptionFactory.createNftSubscriptionWithMeta(
          id,
          userId,
          target,
          threshold,
          strategyType,
          metaData,
          isActive,
        );
      case "token":
        return SubscriptionFactory.createTokenSubscriptionWithMeta(
          id,
          userId,
          target,
          threshold,
          strategyType,
          metaData,
          isActive,
        );
      default:
        const exhaustiveCheck: never = type;
        throw new DomainError.FactoryInvalidTargetTypeError(exhaustiveCheck);
    }
  }

  public static addMetaToSubscription(
    subscription: Subscription,
    metaData: SubscriptionMetaData,
  ): SubscriptionWithMeta {
    if (subscription instanceof NftSubscription) {
      return new NftSubscriptionWithMeta(
        subscription.id,
        subscription.userId,
        subscription.target,
        subscription.strategy,
        subscription.isActive,
        metaData.lastTriggeredAt,
        metaData.createdAt,
      );
    } else if (subscription instanceof TokenSubscription) {
      return new TokenSubscriptionWithMeta(
        subscription.id,
        subscription.userId,
        subscription.target,
        subscription.strategy,
        subscription.isActive,
        metaData.lastTriggeredAt,
        metaData.createdAt,
      );
    }

    throw new DomainError.FactoryInvalidTargetTypeError(
      "Unknown subscription type",
    );
  }

  public static fromDbData(data: any): SubscriptionWithMeta {
    const metaData: SubscriptionMetaData = {
      lastTriggeredAt: data.lastTriggeredAt,
      createdAt: data.createdAt,
    };

    return SubscriptionFactory.createWithMeta(
      data.id,
      data.userId,
      data.target,
      data.strategy.threshold,
      data.strategy.type,
      metaData,
      data.isActive,
    );
  }

  private static createNftSubscription(
    id: string | null = null,
    userId: number,
    target: INftTarget,
    threshold: number,
    strategyType: StrategyType = "percentage",
    isActive: boolean,
  ): INftSubscription {
    const strategy = StrategyFactory.createPriceStrategy(
      strategyType,
      threshold,
    );

    return new NftSubscription(id, userId, target, strategy, isActive);
  }

  private static createTokenSubscription(
    id: string | null = null,
    userId: number,
    target: ITokenTarget,
    threshold: number,
    strategyType: StrategyType = "percentage",
    isActive: boolean,
  ): ITokenSubscription {
    const strategy = StrategyFactory.createPriceStrategy(
      strategyType,
      threshold,
    );

    return new TokenSubscription(id, userId, target, strategy, isActive);
  }

  private static createNftSubscriptionWithMeta(
    id: string | null = null,
    userId: number,
    target: INftTarget,
    threshold: number,
    strategyType: StrategyType = "percentage",
    metaData: SubscriptionMetaData,
    isActive: boolean,
  ): NftSubscriptionWithMeta {
    const strategy = StrategyFactory.createPriceStrategy(
      strategyType,
      threshold,
    );

    return new NftSubscriptionWithMeta(
      id,
      userId,
      target,
      strategy,
      isActive,
      metaData.lastTriggeredAt,
      metaData.createdAt,
    );
  }

  private static createTokenSubscriptionWithMeta(
    id: string | null = null,
    userId: number,
    target: ITokenTarget,
    threshold: number,
    strategyType: StrategyType = "percentage",
    metaData: SubscriptionMetaData,
    isActive: boolean,
  ): TokenSubscriptionWithMeta {
    const strategy = StrategyFactory.createPriceStrategy(
      strategyType,
      threshold,
    );

    return new TokenSubscriptionWithMeta(
      id,
      userId,
      target,
      strategy,
      isActive,
      metaData.lastTriggeredAt,
      metaData.createdAt,
    );
  }
}

