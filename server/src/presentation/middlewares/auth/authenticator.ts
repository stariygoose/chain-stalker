import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";

import { IJwtService } from "#application/services/jwt.service.js";
import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";
import { TYPES } from "#di/types.js";
import { ApiError } from "#infrastructure/errors/index.js";
import { createSignature } from "#utils/create-signature.js";
import { ILogger } from "#utils/logger.js";
import { isString } from "#utils/isString.js";

export interface IAuthenticator {
  authenticate(req: Request, res: Response, next: NextFunction): void;
}

@injectable()
export class Authenticator {
  private readonly UNPROTECTED_ROUTES = [
    "/auth/telegram-login",
    "/auth/refresh",
    "/auth/bot-login",
  ];
  private readonly BOT_SECRET_KEY: string;

  constructor(
    @inject(TYPES.ConfigService) private _config: ConfigService,
    @inject(TYPES.JwtService) private _jwtService: IJwtService,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {
    this.BOT_SECRET_KEY = this._config.get(EnvVariables.BOT_SECRET_KEY);
  }

  public authenticate(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith("Bot ")) {
      this.authenticateBot(req, res, next);
    } else {
      this.authenticateClientJwt(req, res, next);
    }
  }

  private authenticateClientJwt(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const skipAuth = req.originalUrl;
    if (skipAuth in this.UNPROTECTED_ROUTES) {
      this._logger.debug(
        `Unprotected route: ${skipAuth}, skipping authentication.`,
      );
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new ApiError.UnauthorizedError(
          "Missing or invalid Authorization header",
        ),
      );
    }

    try {
      const token = authHeader.split(" ")[1];
      const decodedAccessToken = this._jwtService.decodeAccessToken(token);
      req.context.userId = decodedAccessToken.userId;
      next();
    } catch (e: any) {
      return next(new ApiError.UnauthorizedError(e.message));
    }
  }

  private authenticateBot(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers["x-bot-signature"];
    const timestamp = req.headers["x-bot-timestamp"];
    const userId = req.headers["x-telegram-user-id"];

    if (!isString(signature))
      return next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Bot-Signature header.",
        ),
      );
    if (!isString(timestamp))
      return next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Bot-Timestamp header.",
        ),
      );
    if (!isString(userId))
      return next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Telegram-User-ID header.",
        ),
      );

    const serverSignature = createSignature(
      timestamp,
      userId,
      req.method,
      req.url,
      this.BOT_SECRET_KEY,
    );

    if (serverSignature !== signature)
      next(new ApiError.UnauthorizedError("Invalid signature"));

    req.context.userId = +userId;
    next();
  }
}
