import { NextFunction, Response, Request } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  next,
  queryParam,
  request,
  requestParam,
  response,
} from "inversify-express-utils";

import { ISubscriptionService } from "#application/services/subscription.service.js";
import { TYPES } from "#di/types.js";
import { joiValidator } from "#presentation/middlewares/validation/subscription.create.validator.js";
import { subscriptionCreateSchema } from "#presentation/schemas/subscription.create.schema.js";
import { Logger } from "#utils/logger.js";
import { ICreateSubscriptionRequest } from "#application/dtos/create-subcsription.dto.js";
import { ApiError } from "#infrastructure/errors/index.js";

@controller("/subscriptions")
export class SubscriptionController {
  constructor(
    @inject(TYPES.SubscriptionService)
    private readonly _subscriptionService: ISubscriptionService,
    @inject(TYPES.Logger)
    private readonly _logger: Logger,
  ) {}

  @httpGet("/")
  public async getAllByUserId(
    @queryParam("type") type: string,
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { context } = req;

      if (!context) {
        throw new ApiError.BadRequestError("Missing context");
      }
      this._logger.debug(
        `New request from user ${context.userId} to get data all subscriptions ${type ? `by type ${type}` : ""}.`,
      );

      const subs = await this._subscriptionService.getAllByUserId(
        context.userId,
        type,
      );

      return res.status(200).json(subs);
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/:id")
  public async getById(
    @requestParam("id") id: string,
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { context } = req;

      if (!context) {
        throw new ApiError.BadRequestError("Missing context");
      }
      this._logger.debug(
        `New request from user ${context.userId} to get a subscription data ${id}`,
      );

      const subscription = await this._subscriptionService.getById(
        context.userId,
        id,
      );

      return res.status(200).json(subscription);
    } catch (error: unknown) {
      next(error);
    }
  }

  @httpPost("/create", joiValidator(subscriptionCreateSchema))
  public async create(
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { body, context } = req;

      if (!context) {
        throw new ApiError.BadRequestError("Missing context");
      }
      this._logger.debug(
        `New request from user ${context.userId} for creating a subscription.`,
      );

      const subscription = await this._subscriptionService.create(
        context.userId,
        body,
      );

      const { target, strategy } = body as ICreateSubscriptionRequest;
      this._logger.info(
        `User ${context.userId} created subscription: ${JSON.stringify({
          type: target.type,
          strategy: strategy.type,
          threshold: strategy.threshold,
        })}`,
      );

      return res.status(201).json(subscription);
    } catch (error: unknown) {
      next(error);
    }
  }

  @httpPut("/change_status/:id")
  public async changeStatus(
    @requestParam("id") id: string,
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { context } = req;

      if (!context) {
        throw new ApiError.BadRequestError("Missing context");
      }
      const { userId } = context;

      this._logger.debug(
        `User ${userId} requests to change activity status for subscription ${id}`,
      );

      const subscription = await this._subscriptionService.changeStatusById(
        userId,
        id,
      );

      this._logger.info(
        `User ${userId} successfully changed an activity status for subscription ${id}`,
      );

      return res.status(201).json(subscription);
    } catch (error: unknown) {
      next(error);
    }
  }

  @httpDelete("/delete/:id")
  public async delete(
    @requestParam("id") id: string,
    @request() req: Request,
    @response() res: Response,
    @next() next: NextFunction,
  ) {
    try {
      const { context } = req;

      if (!context) {
        throw new ApiError.BadRequestError("Missing context");
      }
      const { userId } = context;

      this._logger.debug(
        `User ${userId} requests deletion of subscription ${id}`,
      );

      await this._subscriptionService.deleteById(userId, id);

      this._logger.info(
        `User ${userId} successfully deleted a subscription ${id}`,
      );

      return res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
}
