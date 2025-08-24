import { Types } from "mongoose";
import { inject, injectable } from "inversify";

import {
  Subscription,
  SubscriptionWithMeta,
} from "#core/entities/subscription/index.js";
import { ISubscriptionRepository } from "#core/repositories/subscription-repository.interface.js";

import { SubscriptionModel } from "#infrastructure/database/mongodb/models/index.js";
import { SubscriptionDbRecord } from "#infrastructure/dtos/subscription/subscription.dto.js";
import { AbstractDatabaseError } from "#infrastructure/errors/database-errors/database-errors.abstract.js";
import { LayerError } from "#infrastructure/errors/index.js";
import { SubscriptionMapper } from "#infrastructure/mappers/subscription/subscription.mapper.js";
import { TYPES } from "#di/types.js";
import { ILogger } from "#utils/logger.js";
import { SubscriptionDbDto } from "#infrastructure/dtos/subscription/subscription-dto.interfaces.js";
import { Target } from "#core/entities/targets/index.js";
import { Strategy } from "#core/strategies/notification/notification-strategies.interface.js";

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @inject(TYPES.Logger)
    private readonly _logger: ILogger,
  ) {}

  public async createOrUpdate(
    subscription: Subscription,
  ): Promise<SubscriptionWithMeta> {
    try {
      const { id, userId, target, strategy, isActive } = subscription;

      const filter =
        id && Types.ObjectId.isValid(id)
          ? { _id: new Types.ObjectId(id) }
          : this._buildTargetFilter(userId, target);

      const result = await SubscriptionModel.findOneAndUpdate(
        filter,
        { $set: { userId, target, strategy, isActive } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean<SubscriptionDbDto>();

      return SubscriptionMapper.toDomainWithMeta(
        new SubscriptionDbRecord(
          result._id,
          result.userId,
          result.target,
          result.strategy,
          result.isActive,
          result.createdAt,
          result.lastTriggeredAt,
        ),
      );
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async updateStrategy(
    filter: Partial<Record<string, any>>,
    payload: Partial<Strategy>,
  ): Promise<SubscriptionWithMeta | null> {
    try {
      const result = await SubscriptionModel.findOneAndUpdate(
        filter,
        { $set: payload },
        { new: true },
      ).lean<SubscriptionDbDto | null>();

      if (!result) return null;

      return SubscriptionMapper.toDomainWithMeta(
        new SubscriptionDbRecord(
          result._id,
          result.userId,
          result.target,
          result.strategy,
          result.isActive,
          result.createdAt,
          result.lastTriggeredAt,
        ),
      );
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async getByWithoutMeta(
    filter: Partial<SubscriptionWithMeta>,
  ): Promise<Subscription | null> {
    try {
      const subscriptionFromDb =
        await SubscriptionModel.findOne(filter).lean<SubscriptionDbDto>();

      if (!subscriptionFromDb) return null;

      return SubscriptionMapper.toDomain(
        new SubscriptionDbRecord(
          subscriptionFromDb._id,
          subscriptionFromDb.userId,
          subscriptionFromDb.target,
          subscriptionFromDb.strategy,
          subscriptionFromDb.isActive,
          subscriptionFromDb.createdAt,
          subscriptionFromDb.lastTriggeredAt,
        ),
      );
    } catch (error) {
      this._handleDbError(error);
    }
  }

  public async getBy(
    filter: Partial<SubscriptionWithMeta>,
  ): Promise<SubscriptionWithMeta | null> {
    try {
      const subscriptionFromDb =
        await SubscriptionModel.findOne(filter).lean<SubscriptionDbDto>();

      if (!subscriptionFromDb) return null;

      return SubscriptionMapper.toDomainWithMeta(
        new SubscriptionDbRecord(
          subscriptionFromDb._id,
          subscriptionFromDb.userId,
          subscriptionFromDb.target,
          subscriptionFromDb.strategy,
          subscriptionFromDb.isActive,
          subscriptionFromDb.createdAt,
          subscriptionFromDb.lastTriggeredAt,
        ),
      );
    } catch (error) {
      this._handleDbError(error);
    }
  }

  public async getAll(
    filter: Partial<Record<string, unknown>>,
  ): Promise<SubscriptionWithMeta[] | null> {
    try {
      const subscriptions =
        await SubscriptionModel.find(filter).lean<SubscriptionDbDto[]>();

      if (subscriptions.length <= 0) return null;

      return subscriptions.map((sub) => {
        return SubscriptionMapper.toDomainWithMeta(
          new SubscriptionDbRecord(
            sub._id,
            sub.userId,
            sub.target,
            sub.strategy,
            sub.isActive,
            sub.createdAt,
            sub.lastTriggeredAt,
          ),
        );
      });
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async changeStatusById(
    userId: number,
    id: string,
  ): Promise<SubscriptionWithMeta | null> {
    try {
      const subscription = await SubscriptionModel.findOne({
        _id: id,
        userId: userId,
      }).lean<SubscriptionDbDto>();

      if (!subscription) return null;

      const updatedSubscription = await SubscriptionModel.findByIdAndUpdate(
        id,
        { isActive: !subscription.isActive },
        { new: true },
      ).lean<SubscriptionDbDto>();

      if (!updatedSubscription) return null;

      return SubscriptionMapper.toDomainWithMeta(
        new SubscriptionDbRecord(
          updatedSubscription._id,
          updatedSubscription.userId,
          updatedSubscription.target,
          updatedSubscription.strategy,
          updatedSubscription.isActive,
          updatedSubscription.createdAt,
          updatedSubscription.lastTriggeredAt,
        ),
      );
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async deleteById(
    userId: number,
    id: string,
  ): Promise<SubscriptionWithMeta | null> {
    try {
      const deletedSubscription = await SubscriptionModel.findOneAndDelete({
        _id: id,
        userId: userId,
      }).lean<SubscriptionDbDto>();

      if (!deletedSubscription) return null;

      return SubscriptionMapper.toDomainWithMeta(
        new SubscriptionDbRecord(
          deletedSubscription._id,
          deletedSubscription.userId,
          deletedSubscription.target,
          deletedSubscription.strategy,
          deletedSubscription.isActive,
          deletedSubscription.createdAt,
          deletedSubscription.lastTriggeredAt,
        ),
      );
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async drop(): Promise<void> {
    try {
      await SubscriptionModel.deleteMany({});
      this._logger.error(`[DB] SUBSCRIPTIONS COLLECTION WAS DROPPED!!!!`);
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  private _handleDbError(error: unknown): never {
    if (error instanceof AbstractDatabaseError) {
      this._logger.error("[DB]" + error.message);
      throw error;
    }

    this._logger.error(
      `[DB] Unexpected Database Error. Reason: ${(error as Error).message}`,
    );
    throw new LayerError.DatabaseError("Unexpected Database Error.");
  }

  private _buildTargetFilter(
    userId: number,
    target: Target,
  ): Record<string, any> {
    const { type } = target;
    switch (type) {
      case "nft":
        return { userId, "target.type": "nft", "target.slug": target.slug };
      case "token":
        return {
          userId,
          "target.type": "token",
          "target.symbol": target.symbol,
        };
      default:
        const exhaustiveCheck: never = type;
        throw new LayerError.InvalidDbTargetTypeError(exhaustiveCheck);
    }
  }
}
