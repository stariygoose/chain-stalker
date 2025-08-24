import { Subscription } from "#core/entities/subscription/index.js";
import { Target } from "#core/entities/targets/subscription-target.interface.js";
import { Strategy } from "#core/strategies/notification/notification-strategies.interface.js";
import { LayerError } from "#infrastructure/errors/index.js";

interface ISubscriptionsDto {
  id: string;
  isActive: boolean;
  target: Target;
  strategy: Strategy;
}

export class GetAllSubscriptionsDto {
  public readonly userId: number;
  public readonly subscriptions: ISubscriptionsDto[];

  constructor(subs: Subscription[]) {
    this.userId = subs[0].userId;
    this.subscriptions = subs.map((sub) => {
      const { id, target, strategy, isActive } = sub;

      if (!id)
        throw new LayerError.MapperError(
          this.constructor.name,
          `Id is not provided from Database.`,
        );

      return {
        id,
        target,
        strategy,
        isActive,
      };
    });
  }
}

