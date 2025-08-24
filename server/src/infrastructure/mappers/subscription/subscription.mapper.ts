import {
  Subscription,
  SubscriptionWithMeta,
} from "#core/entities/subscription/index.js";
import { Target } from "#core/entities/targets/index.js";
import { SubscriptionFactory } from "#core/factories/index.js";
import {
  ISubscriptionDbDto,
  TargetDbDto,
} from "#infrastructure/dtos/subscription/subscription-dto.interfaces.js";
import { SubscriptionDbRecord } from "#infrastructure/dtos/subscription/subscription.dto.js";
import { LayerError } from "#infrastructure/errors/index.js";
import { Types } from "mongoose";

export class SubscriptionMapper {
  public static toDomain(dbSubscription: ISubscriptionDbDto): Subscription {
    let _id: string | null = null;
    if (dbSubscription._id) {
      _id = dbSubscription._id.toString();
    }

    const target = SubscriptionMapper.convertTargetFromDb(
      dbSubscription.target,
    );

    return SubscriptionFactory.create(
      _id,
      dbSubscription.userId,
      target,
      dbSubscription.strategy.threshold,
      dbSubscription.strategy.type,
      dbSubscription.isActive,
    );
  }

  public static toDomainWithMeta(
    dbSubscription: ISubscriptionDbDto,
  ): SubscriptionWithMeta {
    let _id: string | null = null;
    if (dbSubscription._id) {
      _id = dbSubscription._id.toString();
    }

    const target = SubscriptionMapper.convertTargetFromDb(
      dbSubscription.target,
    );

    return SubscriptionFactory.createWithMeta(
      _id,
      dbSubscription.userId,
      target,
      dbSubscription.strategy.threshold,
      dbSubscription.strategy.type,
      {
        createdAt: dbSubscription.createdAt,
        lastTriggeredAt: dbSubscription.lastTriggeredAt,
      },
      dbSubscription.isActive,
    );
  }

  public static fromDbData(
    dbSubscription: ISubscriptionDbDto,
  ): SubscriptionWithMeta {
    let _id: string | null = null;
    if (dbSubscription._id) {
      _id = dbSubscription._id.toString();
    }

    const target = SubscriptionMapper.convertTargetFromDb(
      dbSubscription.target,
    );

    const dbDataForFactory = {
      id: _id,
      userId: dbSubscription.userId,
      target,
      strategy: dbSubscription.strategy,
      isActive: dbSubscription.isActive,
      createdAt: dbSubscription.createdAt,
      lastTriggeredAt: dbSubscription.lastTriggeredAt,
    };

    return SubscriptionFactory.fromDbData(dbDataForFactory);
  }

  public static toDb(
    subscription: Subscription | SubscriptionWithMeta,
  ): ISubscriptionDbDto {
    let objectId = null;
    if (subscription.id) {
      objectId = new Types.ObjectId(subscription.id);
    }

    const target = SubscriptionMapper.convertTargetToDb(subscription.target);

    let createdAt: Date;
    let lastTriggeredAt: Date;

    if (SubscriptionMapper.isSubscriptionWithMeta(subscription)) {
      createdAt = subscription.createdAt;
      lastTriggeredAt = subscription.lastTriggeredAt;
    } else {
      createdAt = new Date();
      lastTriggeredAt = new Date();
    }

    return new SubscriptionDbRecord(
      objectId,
      subscription.userId,
      target,
      subscription.strategy,
      subscription.isActive,
      createdAt,
      lastTriggeredAt,
    );
  }

  public static toDbFromMeta(
    subscription: SubscriptionWithMeta,
  ): ISubscriptionDbDto {
    let objectId = null;
    if (subscription.id) {
      objectId = new Types.ObjectId(subscription.id);
    }

    const target = SubscriptionMapper.convertTargetToDb(subscription.target);

    return new SubscriptionDbRecord(
      objectId,
      subscription.userId,
      target,
      subscription.strategy,
      subscription.isActive,
      subscription.createdAt,
      subscription.lastTriggeredAt,
    );
  }

  private static isSubscriptionWithMeta(
    subscription: Subscription | SubscriptionWithMeta,
  ): subscription is SubscriptionWithMeta {
    return "createdAt" in subscription && "lastTriggeredAt" in subscription;
  }

  private static convertTargetFromDb(target: TargetDbDto): Target {
    const { type } = target;
    switch (type) {
      case "nft":
        return {
          type: "nft",
          name: target.name,
          slug: target.slug,
          chain: target.chain,
          lastNotifiedPrice: target.lastNotifiedPrice,
          symbol: target.symbol.toUpperCase(),
        };
      case "token":
        return {
          type: "token",
          lastNotifiedPrice: target.lastNotifiedPrice,
          symbol: target.symbol.toUpperCase(),
        };
      default:
        const exhaustiveCheck: never = type;
        throw new LayerError.MapperError(
          this.constructor.name,
          `Exhaustive check error. ${exhaustiveCheck} didn't handled by switch in convertTarget.`,
        );
    }
  }

  private static convertTargetToDb(target: Target): TargetDbDto {
    const { type } = target;
    switch (type) {
      case "nft":
        return {
          type: "nft",
          name: target.name,
          slug: target.slug,
          chain: target.chain,
          lastNotifiedPrice: target.lastNotifiedPrice,
          symbol: target.symbol.toUpperCase(),
        };
      case "token":
        return {
          type: "token",
          lastNotifiedPrice: target.lastNotifiedPrice,
          symbol: target.symbol.toUpperCase(),
        };
      default:
        const exhaustiveCheck: never = type;
        throw new LayerError.MapperError(
          this.constructor.name,
          `Exhaustive check error. ${exhaustiveCheck} didn't handled by switch in convertTarget.`,
        );
    }
  }
}
