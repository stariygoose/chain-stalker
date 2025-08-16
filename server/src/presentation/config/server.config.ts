import { inject } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import { ConfigService } from "#config/config.service.js";
import { container } from "#di/inversify.config.js";
import { TYPES } from "#di/types.js";
import { EnvVariables } from "#config/env-variables.js";
import { IMongoDbConfig } from "#infrastructure/database/mongodb/config/mongo.config.js";
import { errorMiddleware } from "#presentation/middlewares/errors/error.middleware.js";
import { Logger } from "#utils/logger.js";
import { authMiddleware } from "#presentation/middlewares/auth/auth.middleware.js";
import { requestLogger } from "#presentation/middlewares/request-logger/request-logger.middleware.js";

export interface IServerConfig {
  start(): Promise<void>;
}

export class ServerConfig implements IServerConfig {
  private readonly _server: InversifyExpressServer;
  // private readonly _baseUrl: string;
  private readonly _PORT: string;

  constructor(
    @inject(TYPES.Logger)
    private readonly _logger: Logger,
    @inject(TYPES.ConfigService)
    private readonly _config: ConfigService,
    @inject(TYPES.MongoDbConfig)
    private readonly _mongo: IMongoDbConfig,
  ) {
    this._server = new InversifyExpressServer(container, null, {
      rootPath: "/api/v1",
    });
    // this._baseUrl = this._config.get(EnvVariables.DOMAIN_URL);
    this._PORT = this._config.get(EnvVariables.SERVER_PORT);
  }

  public async start(): Promise<void> {
    this.initMiddlewares();
    let app = this._server.build();

    await this._mongo.connect();

    app.listen(this._PORT);
    this._logger.info(`Server is running on PORT: ${this._PORT}`);

    // await this._mongo.initEventStreams();
  }

  private initMiddlewares() {
    this._server.setConfig((app) => {
      app.use(bodyParser.urlencoded({ extended: false }));
      app.use(bodyParser.json());
      app.use(cookieParser());
      // app.use(
      //   cors({
      //     origin: `https://ffca67639a8b.ngrok-free.app`,
      //     credentials: true,
      //   }),
      // );

      app.use(authMiddleware);
      app.use(requestLogger(this._logger));
    });

    this._server.setErrorConfig((app) => {
      app.use(errorMiddleware);
    });
  }
}
