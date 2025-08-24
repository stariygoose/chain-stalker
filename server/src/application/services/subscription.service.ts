import { injectable, inject } from "inversify";
import { Types } from "mongoose";

import { ISubscriptionRepository } from "#core/repositories/subscription-repository.interface.js";
import { SubscriptionFactory } from "#core/factories/subscription.factory.js";
import { TYPES } from "#di/types.js";
import { WebsocketManager } from "#infrastructure/websockets/websocket-manager.js";
import { Logger } from "#utils/logger.js";
import {
  Target,
  TargetTypes,
} from "#core/entities/targets/subscription-target.interface.js";
import {
  Subscription,
  SubscriptionWithMeta,
} from "#core/entities/subscription/index.js";
import { ApiError } from "#infrastructure/errors/index.js";
import {
  CreateSubscriptionRequestDto,
  ICreateSubscriptionRequest,
} from "#application/dtos/create-subcsription.dto.js";
import { GetAllSubscriptionsDto } from "#application/dtos/get-all-subscriptions.dto.js";

export interface ISubscriptionService {
  create(
    userId: number,
    data: ICreateSubscriptionRequest,
  ): Promise<Subscription>;

  getAllByUserId(
    userId: number,
    type?: unknown,
  ): Promise<GetAllSubscriptionsDto>;
  getBy(
    userId: number,
    filter: Partial<SubscriptionWithMeta>,
  ): Promise<Subscription>;

  changeStatusById(userId: number, id: string): Promise<Subscription>;

  deleteById(userId: number, id: string): Promise<void>;
}

@injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @inject(TYPES.SubscriptionRepository)
    private readonly _db: ISubscriptionRepository,
    @inject(TYPES.WebsocketManager)
    private readonly _wm: WebsocketManager,
    @inject(TYPES.Logger)
    private readonly _logger: Logger,
  ) {}

  public async getAllByUserId(
    userId: number,
    type?: TargetTypes | undefined,
  ): Promise<GetAllSubscriptionsDto> {
    try {
      const filter: Record<string, unknown> = {
        userId: userId,
      };

      if (type === "nft" || type == "token") {
        filter["target.type"] = type;
      }

      const subscriptions = await this._db.getAll(filter);
      if (!subscriptions) {
        throw new ApiError.NotFoundError(
          `There are no subscriptions for user <${userId}>.`,
        );
      }

      return new GetAllSubscriptionsDto(subscriptions);
    } catch (error: unknown) {
      throw error;
    }
  }

  public async getBy(
    userId: number,
    filter: Partial<SubscriptionWithMeta>,
  ): Promise<Subscription> {
    try {
      const subscription = await this._db.getBy({ userId, ...filter });

      if (!subscription) {
        throw new ApiError.NotFoundError("Subscription not found");
      }

      return subscription;
    } catch (error: unknown) {
      throw error;
    }
  }

  public async create(
    userId: number,
    data: ICreateSubscriptionRequest,
  ): Promise<Subscription> {
    const subscriptionDto = new CreateSubscriptionRequestDto(data);
    const { target, strategyType, threshold } = subscriptionDto;

    try {
      const subscription = SubscriptionFactory.create(
        null,
        userId,
        target,
        threshold,
        strategyType,
      );

      const subscriptionFromDb = await this._db.createOrUpdate(subscription);

      this._stalk(userId, subscription.target);

      return subscriptionFromDb;
    } catch (error) {
      throw error;
    }
  }

  public async changeStatusById(
    userId: number,
    id: string,
  ): Promise<Subscription> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError.BadRequestError("Invalid ID");
    }

    try {
      const subscription = await this._db.changeStatusById(userId, id);
      if (!subscription) {
        throw new ApiError.NotFoundError(
          `Subscription ${id} for user ${userId} not found`,
        );
      }

      const { target } = subscription;

      if (!subscription.isActive) {
        if (target.type === "nft")
          this._wm.deleteUserFromOpenseaStalking(userId, target.slug);
        if (target.type === "token")
          this._wm.deleteUserFromBinanceStalking(userId, target.symbol);
      } else {
        if (
          target.type === "nft" &&
          this._wm.openseaCollectionUsersCount(target.slug) <= 0
        ) {
          this._wm.stalkFromOpensea(userId, target.slug);
        }
        if (
          target.type === "token" &&
          this._wm.binanceTokenUsersCount(target.symbol) <= 0
        ) {
          this._wm.stalkFromBinance(userId, target.symbol);
        }
      }

      return subscription;
    } catch (error: unknown) {
      throw error;
    }
  }

  public async deleteById(userId: number, id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError.BadRequestError("Invalid ID");
    }

    try {
      const deleted = await this._db.deleteById(userId, id);

      if (!deleted) return;
      const { type } = deleted.target;
      switch (type) {
        case "nft":
          this._wm.deleteUserFromOpenseaStalking(userId, deleted.target.slug);
          break;
        case "token":
          this._wm.deleteUserFromBinanceStalking(userId, deleted.target.symbol);
          break;
        default:
          this._logger.error(
            `Can't delete user from a Websocket Connection. Unknown type of subscription: ${type}`,
          );
          break;
      }
    } catch (error: unknown) {
      throw error;
    }
  }

  private _stalk(userId: number, target: Target): void {
    const { type } = target;

    switch (type) {
      case "nft":
        this._logger.debug(
          `Subscription type is <${type}>. Opening Opensea Event Stream.`,
        );
        this._wm.stalkFromOpensea(userId, target.slug);
        break;
      case "token":
        this._logger.debug(
          `Subscription type is <${type}>. Opening Binance Event Stream.`,
        );
        this._wm.stalkFromBinance(userId, target.symbol);
        break;
      default:
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled type ${exhaustiveCheck}`);
    }
  }
}

