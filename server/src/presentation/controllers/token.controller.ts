import { inject } from "inversify";
import {
  controller,
  httpGet,
  next,
  request,
  requestParam,
  response,
} from "inversify-express-utils";

import { TYPES } from "#di/types.js";
import { NextFunction, Request, Response } from "express";
import { ITokenService } from "#application/services/token.service.js";

@controller("/token")
export class TokenController {
  constructor(
    @inject(TYPES.TokenService)
    private readonly _tokenService: ITokenService,
  ) {}

  @httpGet("/:symbol")
  public async getTokenBySymbol(
    @requestParam("symbol") symbol: string,
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const token = await this._tokenService.getToken(symbol);

      return res.status(200).json(token);
    } catch (error: unknown) {
      next(error);
    }
  }
}

