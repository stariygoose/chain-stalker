import { Container } from "inversify";

import { SubscriptionRepository } from "#infrastructure/database/mongodb/repositories/subscription.repository.js";
import { TYPES } from "#di/types";
import { SubscriptionController } from "#presentation/controllers/subscription.controller.js";
import { ConfigService } from "#config/config.service.js";
import {
  IServerConfig,
  ServerConfig,
} from "#presentation/config/server.config.js";
import { ILogger, Logger } from "#utils/logger.js";
import {
  IMongoDbConfig,
  MongoDbConfig,
} from "#infrastructure/database/mongodb/config/mongo.config.js";
import { OpenseaEventStream } from "#infrastructure/websockets/marketplaces/opensea/opensea-event-stream.class.js";
import { WebsocketManager } from "#infrastructure/websockets/websocket-manager.js";
import { INftEventStream } from "#infrastructure/websockets/interfaces/nft-event-stream.interface.js";
import {
  ICache,
  IPubSub,
  RedisCache,
  RedisClient,
  RedisPubSub,
} from "#infrastructure/lib/redis/index.js";
import { OpenSeaAPI, BinanceAPI } from "#infrastructure/lib/apis/index.js";
import { ITokenEventStream } from "#infrastructure/websockets/interfaces/token-event-stream.interface.js";
import { BinanceEventStream } from "#infrastructure/websockets/marketplaces/binance/binance-event-stream.class.js";
import { StrategyController } from "#presentation/controllers/strategy.controller.js";
import { CollectionController } from "#presentation/controllers/collection.controller.js";
import { TokenController } from "#presentation/controllers/token.controller.js";
import { IJwtTokenRepository } from "#application/repository/jwt.repository.js";
import { JwtTokenRepository } from "#infrastructure/database/mongodb/repositories/jwt-token.repository.js";
import { IUserRepository } from "#application/repository/user.repository.js";
import { UserRepository } from "#infrastructure/database/mongodb/repositories/user.repository.js";
import { AuthController } from "#presentation/controllers/user.controller.js";
import {
  Authenticator,
  IAuthenticator,
} from "#presentation/middlewares/auth/authenticator.js";
import { EventBus, IEventBus } from "#application/ports/event-bus";

export let container = new Container();

// Global Scope Binds
container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope();
container
  .bind<ConfigService>(TYPES.ConfigService)
  .to(ConfigService)
  .inSingletonScope();
container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();

// Aplication Layer Binds
container
  .bind<SubscriptionController>(TYPES.SubscriptionController)
  .to(SubscriptionController)
  .inSingletonScope();
container
  .bind<SubscriptionRepository>(TYPES.SubscriptionRepository)
  .to(SubscriptionRepository)
  .inSingletonScope();

container
  .bind<StrategyController>(TYPES.StrategyController)
  .to(StrategyController)
  .inSingletonScope();

container
  .bind<CollectionController>(TYPES.CollectionController)
  .to(CollectionController)
  .inSingletonScope();
container
  .bind<TokenController>(TYPES.TokenController)
  .to(TokenController)
  .inSingletonScope();

container
  .bind<IJwtTokenRepository>(TYPES.JwtTokenRepository)
  .to(JwtTokenRepository)
  .inSingletonScope();

container
  .bind<IUserRepository>(TYPES.UserRepository)
  .to(UserRepository)
  .inSingletonScope();

container
  .bind<IAuthenticator>(TYPES.Authenticator)
  .to(Authenticator)
  .inSingletonScope();
container
  .bind<AuthController>(TYPES.AuthController)
  .to(AuthController)
  .inSingletonScope();

container
  .bind<IServerConfig>(TYPES.ServerConfig)
  .to(ServerConfig)
  .inSingletonScope();
container
  .bind<IMongoDbConfig>(TYPES.MongoDbConfig)
  .to(MongoDbConfig)
  .inSingletonScope();

container
  .bind<ITokenEventStream>(TYPES.BinanceEventStream)
  .to(BinanceEventStream)
  .inTransientScope();
container
  .bind<INftEventStream>(TYPES.OpenseaEventStream)
  .to(OpenseaEventStream)
  .inTransientScope();
container
  .bind<WebsocketManager>(TYPES.WebsocketManager)
  .to(WebsocketManager)
  .inSingletonScope();

container
  .bind<RedisClient>(TYPES.RedisClient)
  .to(RedisClient)
  .inTransientScope();
container.bind<IPubSub>(TYPES.RedisPubSub).to(RedisPubSub).inSingletonScope();
container.bind<ICache>(TYPES.RedisCache).to(RedisCache).inSingletonScope();

container.bind<OpenSeaAPI>(TYPES.OpenSeaAPI).to(OpenSeaAPI).inSingletonScope();
container.bind<BinanceAPI>(TYPES.BinanceAPI).to(BinanceAPI).inSingletonScope();
