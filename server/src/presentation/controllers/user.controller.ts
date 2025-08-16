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

import { IAuthService } from "#application/services/auth.service.js";
import { TYPES } from "#di/types.js";
import { joiValidator } from "#presentation/middlewares/validation/subscription.create.validator.js";
import { botLoginSchema } from "#presentation/schemas/auth/bot-login.schema.js";
import { refreshTokenSchema } from "#presentation/schemas/auth/refresh-token.schema.js";

@controller("/auth")
export class AuthController {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: IAuthService,
  ) {}

  @httpGet("/telegram-login")
  public async siteLogin(
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      console.log(req.query);
      return res.redirect("/dashboard");
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

  @httpPost("/refresh", joiValidator(refreshTokenSchema))
  public async refresh(
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { refreshToken } = req.body;

      const tokens = await this._authService.refreshToken(refreshToken);

      return res.status(201).json(tokens);
    } catch (error) {
      next(error);
    }
  }
}
