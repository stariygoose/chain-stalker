import { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  next,
  request,
  response,
} from "inversify-express-utils";

import {
  IAuthService,
  TelegramLoginQuery,
} from "#application/services/auth.service.js";
import { TYPES } from "#di/types.js";
import { joiValidator } from "#presentation/middlewares/validation/subscription.create.validator.js";
import { botLoginSchema } from "#presentation/schemas/auth/bot-login.schema.js";
import { telegramLoginSchema } from "#presentation/schemas/auth/telegram.scheme.js";
import { EnvVariables } from "#config/env-variables.js";
import { ConfigService } from "#config/config.service.js";

@controller("/auth")
export class AuthController {
  private readonly DOMAIN_URL: string;

  constructor(
    @inject(TYPES.ConfigService)
    private readonly _configService: ConfigService,
    @inject(TYPES.AuthService)
    private readonly _authService: IAuthService,
  ) {
    this.DOMAIN_URL = this._configService.get(EnvVariables.DOMAIN_URL);
  }

  @httpGet("/telegram-login", joiValidator(telegramLoginSchema, "query"))
  public async siteLogin(
    @request() req: Request<{}, {}, {}, TelegramLoginQuery>,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const tokens = await this._authService.telegramLogin(req.query);

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      return res.redirect(`${this.DOMAIN_URL}/dashboard`);
    } catch (error) {
      next(error);
    }
  }

  @httpPost("/bot-register", joiValidator(botLoginSchema))
  public async botRegister(
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { userId } = req.body;

      await this._authService.botRegister(userId);

      return res
        .status(201)
        .json({ message: "User was successfully registered." });
    } catch (error) {
      next(error);
    }
  }
}
