import { Types } from "mongoose";

import {
  ISubscriptionDbDto,
  StrategyDbDto,
  TargetDbDto,
} from "#infrastructure/dtos/subscription/subscription-dto.interfaces.js";

export class SubscriptionDbRecord implements ISubscriptionDbDto {
  constructor(
    public readonly _id: Types.ObjectId | null,
    public readonly userId: number,
    public readonly target: TargetDbDto,
    public readonly strategy: StrategyDbDto,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly lastTriggeredAt: Date,
  ) {}
}
