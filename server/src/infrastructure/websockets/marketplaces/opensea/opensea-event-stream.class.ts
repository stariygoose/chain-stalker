import { OpenSeaStreamClient } from "@opensea/stream-js";
import { WebSocket } from "ws";
import { inject, injectable } from "inversify";

import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";
import { ISubscriptionRepository } from "#core/repositories/subscription-repository.interface.js";
import { TYPES } from "#di/types.js";
import { IPubSub } from "#infrastructure/lib/redis/pubsub/pubsub.interface.js";
import { OpenSeaAPI } from "#infrastructure/lib/apis/index.js";
import { ICache } from "#infrastructure/lib/redis/index.js";
import { ILogger } from "#utils/logger.js";
import { AbstractDatabaseError } from "#infrastructure/errors/database-errors/database-errors.abstract.js";
import { RedisPubSub } from "#infrastructure/lib/redis/pubsub/redis-pubsub.class.js";
import { LayerError } from "#infrastructure/errors/index.js";
import { ApiError } from "#infrastructure/errors/api-errors/api-error.abstract.js";

@injectable()
export class OpenseaEventStream {
  private readonly _client: OpenSeaStreamClient;
  private readonly _users: Set<number> = new Set();
  private _slug = "";

  constructor(
    @inject(TYPES.ConfigService)
    private readonly _config: ConfigService,
    @inject(TYPES.SubscriptionRepository)
    private readonly _db: ISubscriptionRepository,
    @inject(TYPES.RedisPubSub)
    private readonly _redisPubSub: IPubSub,
    @inject(TYPES.RedisCache)
    private readonly _cache: ICache,
    @inject(TYPES.OpenSeaAPI)
    private readonly _osApi: OpenSeaAPI,
    @inject(TYPES.Logger)
    private readonly _logger: ILogger,
  ) {
    this._client = this._createClient();
  }

  get users(): Set<number> {
    return this._users;
  }

  public setSlug(slug: string): void {
    this._slug = slug;
    this._subscribeToEvents(slug);
  }

  public addUser(userId: number): void {
    this._users.add(userId);
  }

  public removeUser(userId: number): void {
    this._users.delete(userId);

    if (this._users.size === 0) {
      this.disconnect();
    }
  }

  private _subscribeToEvents(slug: string): void {
    this._client.onItemListed(slug, async (event) => {
      await this._handlePriceEvent();
    });

    this._client.onItemSold(slug, async (event) => {
      await this._handlePriceEvent();
    });

    this._logger.info(`Subscribed to OpenSea events for collection [${slug}]`);
  }

  private async _handlePriceEvent(): Promise<void> {
    for (const userId of this._users) {
      try {
        const subscription = await this._db.getBy({
          userId,
          "target.type": "nft",
          "target.slug": this._slug,
        });
        if (!subscription || !subscription.isActive) {
          this._logger.debug(
            `Subscription with slug ${this._slug} for user ${userId} doesn't exist or is not active.`,
          );
          continue;
        }

        const { lastNotifiedPrice } = subscription.target;

        let floorPrice: number;
        const cached = await this._cache.get<number>(`floor:${this._slug}`);
        if (cached) {
          floorPrice = cached;
          this._logger.debug(
            `Floor price for [${this._slug}] restored from cache is: ${floorPrice}.`,
          );
        } else {
          this._logger.debug(
            `Cache was cleared. Fetching API to get Floor Price for [${this._slug}].`,
          );

          const fetchedFloorPrice = await this._osApi.getFloorPrice(this._slug);
          floorPrice = fetchedFloorPrice.floorPrice;
          this._logger.debug(
            `New floor price for [${this._slug}] is ${floorPrice}`,
          );
          // 10 mins cache
          await this._cache.set(`floor:${this._slug}`, floorPrice, 600);
        }

        const priceRounded = floorPrice.toFixed(6);
        const dedupKey = `nft:dedup:${userId}:${this._slug}:${priceRounded}`;
        const dedupTTL = 180;

        const isFirst = await this._cache.setIfNotExists(
          dedupKey,
          "1",
          dedupTTL,
        );
        if (!isFirst) {
          this._logger.debug(
            `[${userId}:${this._slug}] Already notified. Skipping.`,
          );
          continue;
        }

        const shouldNotify = subscription.strategy.shouldNotify(
          lastNotifiedPrice,
          floorPrice,
        );
        if (!shouldNotify) {
          this._logger.debug(
            `[${userId}:${this._slug}] No notification needed. Skipping.`,
          );
          continue;
        }

        const difference = subscription.strategy.calculateDifference(
          lastNotifiedPrice,
          floorPrice,
        );
        const updated = subscription.withUpdatedState(floorPrice);

        await Promise.all([
          this._db.createOrUpdate(updated),
          this._redisPubSub.publish(RedisPubSub.UpdatePriceChannel, {
            ...updated,
            difference,
          }),
        ]);

        this._logger.debug(
          `Updated subscription for [${userId}:${this._slug}] and published update.`,
        );
      } catch (error: any) {
        if (
          error instanceof AbstractDatabaseError ||
          error instanceof ApiError
        ) {
          throw error;
        }

        this._logger.error(
          `Unknown error in Opensesa Event Stream. Reason: ${error.message}`,
        );
        throw new Error(error.message);
      }
    }
  }

  public disconnect(): void {
    this._client.disconnect(() => {
      this._logger.warn(
        `Disconnected from OpenSea Event Stream for [${this._slug}]`,
      );
    });
  }

  private _createClient(): OpenSeaStreamClient {
    return new OpenSeaStreamClient({
      token: this._config.get(EnvVariables.OPENSEA_TOKEN),
      connectOptions: { transport: WebSocket },
      logLevel: 50,
      onError: (error: unknown) => {
        if (error instanceof Error) {
          this._logger.error(
            `Failed to connect to OpenSea Stream: ${error.message}`,
          );
          throw new LayerError.SubscribeEventError(
            "OpenseaEventStream",
            error.message,
          );
        }
      },
    });
  }
}
