import { WebSocket } from "ws";
import { inject, injectable } from "inversify";

import { ITokenEventStream } from "#infrastructure/websockets/interfaces/token-event-stream.interface.js";
import { TYPES } from "#di/types.js";
import { Logger } from "#utils/logger.js";
import { LayerError } from "#infrastructure/errors/index.js";
import { RedisPubSub } from "#infrastructure/lib/redis/index.js";
import { ISubscriptionRepository } from "#core/repositories/subscription-repository.interface.js";
import { AbstractDatabaseError } from "#infrastructure/errors/database-errors/database-errors.abstract.js";

interface TokenEventMessage {
  symbol: string;
  price: number;
}

@injectable()
export class BinanceEventStream implements ITokenEventStream {
  private readonly _wsUrl: string = "wss://stream.binance.com:9443/ws";
  public readonly client: WebSocket;

  private _symbol: string = "";
  private _pendingSymbols: string[] = [];

  private _ticks: number = 0;

  public readonly users: Set<number> = new Set<number>();

  constructor(
    @inject(TYPES.Logger)
    private readonly _logger: Logger,
    @inject(TYPES.SubscriptionRepository)
    private readonly _db: ISubscriptionRepository,
    @inject(TYPES.RedisPubSub)
    private readonly _redisPubSub: RedisPubSub,
  ) {
    this.client = this.createClient();
    this.processEvents();
  }

  set symbol(symbol: string) {
    this._symbol = symbol;
  }

  public addUser(userId: number): void {
    this.users.add(userId);
  }

  public removeUser(userId: number): void {
    this.users.delete(userId);

    if (this.users.size === 0) {
      this._logger.debug(
        `[WEBSOCKET] No more users watching <${this._symbol.toUpperCase()}>. Closing WebSocket.`,
      );
      this.client.close();
      this._symbol = "";
    }
  }

  public stalk(symbol: string): void {
    if (this.client.readyState !== this.client.OPEN) {
      this._logger.info(`WebSocket not open yet. Queuing ${symbol}...`);
      this._pendingSymbols.push(symbol);
      return;
    }

    this._symbol = symbol.toLowerCase();

    const subscribeParams = JSON.stringify({
      method: "SUBSCRIBE",
      params: [`${this._symbol}usdt@ticker`],
      id: 1,
    });

    this.client.send(subscribeParams, (err) => {
      if (err) {
        throw new LayerError.SubscribeEventError(
          "Binance Event Stream",
          err.message,
        );
      }
    });

    this._logger.debug(
      `Stalk request for token <${this._symbol}> was successfuly sent to Binance Stream API`,
    );
  }

  private createClient(): WebSocket {
    return new WebSocket(this._wsUrl);
  }

  private processEvents(): void {
    this.client.on("open", () => {
      for (const symbol of this._pendingSymbols) {
        this.stalk(symbol);
      }

      this._pendingSymbols = [];
    });

    this.client.on("error", (err: Error) => {
      this._logger.error(
        `[WEBSOCKET] Error on Binance Event Stream. Reason: ${err.message}`,
      );
    });

    this.client.on("message", (msg) => {
      this._ticks++;
      if (this._ticks < 5) return;

      this._ticks = 0;

      const message = JSON.parse(msg.toString());
      if (message.result === null) {
        return;
      }

      const symbol: string = message.s.split("USDT").join("").toUpperCase();

      const token: TokenEventMessage = {
        symbol: symbol,
        price: Number(message.c),
      };

      this._logger.debug(
        `Received message from Binance Stream API. ${token.symbol}:${token.price}`,
      );

      this.handleTokenPriceUpdate(token).catch((err) => {
        this._logger.error(
          `[WEBSOCKET] Unhandled error in handleTokenPriceUpdate: ${err}`,
        );
      });
    });
  }

  private async handleTokenPriceUpdate(
    token: TokenEventMessage,
  ): Promise<void> {
    const { price, symbol } = token;

    const tasks = Array.from(this.users).map(async (userId: number) => {
      try {
        const userTokenSubscription = await this._db.getBy({
          userId,
          "target.type": "token",
          "target.symbol": symbol,
        });
        if (!userTokenSubscription) {
          this._logger.debug(
            `No token subscription found [${userId}:${symbol}]`,
          );
          return;
        }

        if (!userTokenSubscription.isActive) {
          this._logger.debug(
            `Subscription ${userTokenSubscription.id} has status inactive.`,
          );
          return;
        }

        if (!userTokenSubscription.shouldNotify(price)) {
          return;
        }

        const difference = userTokenSubscription.calculateDifference(price);
        const updated = userTokenSubscription.withUpdatedState(price);

        await Promise.all([
          this._db.createOrUpdate(updated),
          this._redisPubSub.publish(RedisPubSub.UpdatePriceChannel, {
            ...updated,
            difference,
          }),
        ]);

        this._logger.debug(
          `Updated price of [${this._symbol}] was successfuly saved and published for user <${userId}>`,
        );
      } catch (error: any) {
        if (error instanceof AbstractDatabaseError) {
          throw error;
        }

        this._logger.error(
          `[WEBSOCKET] Unknown error in Binance Event Stream. Reason: ${error.message}`,
        );
        throw new Error(`Unknown error`);
      }
    });

    await Promise.allSettled(tasks);
  }
}
