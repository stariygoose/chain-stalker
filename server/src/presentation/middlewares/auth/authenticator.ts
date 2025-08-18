import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

import { IJwtService } from "#application/services/jwt.service.js";
import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";
import { TYPES } from "#di/types.js";
import { ApiError } from "#infrastructure/errors/index.js";
import { createSignature } from "#utils/create-signature.js";
import { isString } from "#utils/isString.js";

export interface IAuthenticator {
  authenticate(req: Request, res: Response, next: NextFunction): void;
}

@injectable()
export class Authenticator {
  private readonly UNPROTECTED_ROUTES = [
    "/auth/telegram-login",
    "/auth/bot-login",
  ];
  private readonly BOT_SECRET_KEY: string;

  constructor(
    @inject(TYPES.ConfigService) private _config: ConfigService,
    @inject(TYPES.JwtService) private _jwtService: IJwtService,
  ) {
    this.BOT_SECRET_KEY = this._config.get(EnvVariables.TG_BOT_TOKEN);
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
    if (this.isUnprotected(req)) return next();

    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return next(new ApiError.UnauthorizedError("Missing access token."));
    }

    this.handleAccessToken(req, res, next, accessToken);
  }

  private isUnprotected(req: Request): boolean {
    const isUnprotectedRoute = this.UNPROTECTED_ROUTES.some((route) =>
      req.originalUrl.includes(route),
    );

    return isUnprotectedRoute;
  }

  private handleAccessToken(
    req: Request,
    res: Response,
    next: NextFunction,
    accessToken: string,
  ) {
    try {
      this._jwtService.validateToken("access", accessToken);
      this.setUserContext(req, accessToken);
      return next();
    } catch (e: any) {
      if (e instanceof jwt.TokenExpiredError) {
        return this.handleExpiredAccess(req, res, next, accessToken);
      } else {
        return next(new ApiError.UnauthorizedError(e.message));
      }
    }
  }

  private handleExpiredAccess(
    req: Request,
    res: Response,
    next: NextFunction,
    accessToken: string,
  ) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return next(new ApiError.UnauthorizedError("Missing refresh token."));

    try {
      this._jwtService.validateToken("refresh", refreshToken);
      const { userId } = this._jwtService.decodeToken(accessToken);
      const newAccessToken = this._jwtService.generateJwt("access", { userId });

      this.setUserContext(req, newAccessToken.accessToken!);
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      return next();
    } catch {
      return next(
        new ApiError.LoginTimeoutError(
          `Refresh token is expired or invalid. Please login again.`,
        ),
      );
    }
  }

  private setUserContext(req: Request, accessToken: string) {
    const { userId } = this._jwtService.decodeToken(accessToken);
    req.context = {
      userId: Number(userId),
    };
  }

  private authenticateBot(req: Request, res: Response, next: NextFunction) {
    const headers = this.extractBotHeaders(req, next);
    if (!headers) return;

    if (!this.verifyBotSignature(req, headers)) {
      return next(new ApiError.UnauthorizedError("Invalid signature"));
    }

    this.setBotContext(req, headers.userId);
    next();
  }

  private extractBotHeaders(req: Request, next: NextFunction) {
    const signature = req.headers["x-bot-signature"];
    const timestamp = req.headers["x-bot-timestamp"];
    const userId = req.headers["x-telegram-user-id"];

    if (!isString(signature)) {
      next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Bot-Signature header.",
        ),
      );
      return null;
    }
    if (!isString(timestamp)) {
      next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Bot-Timestamp header.",
        ),
      );
      return null;
    }
    if (!isString(userId)) {
      next(
        new ApiError.UnauthorizedError(
          "Missing or invalid X-Telegram-User-ID header.",
        ),
      );
      return null;
    }

    return { signature, timestamp, userId };
  }

  private verifyBotSignature(
    req: Request,
    headers: { signature: string; timestamp: string; userId: string },
  ): boolean {
    const serverSignature = createSignature(
      headers.timestamp,
      headers.userId,
      req.method,
      req.url,
      this.BOT_SECRET_KEY,
    );
    return serverSignature === headers.signature;
  }

  private setBotContext(req: Request, userId: string) {
    req.context = {
      userId: Number(userId),
    };
  }
}
