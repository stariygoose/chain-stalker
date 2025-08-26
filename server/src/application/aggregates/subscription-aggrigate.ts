import { StrategyType } from "#core/entities/notification-strategies/types.js";
import { Subscription } from "#core/entities/subscription/index.js";
import { Target } from "#core/entities/targets/subscription-target.interface.js";
import { SubscriptionFactory } from "#core/factories/subscription.factory.js";
import { SubscriptionMeta } from "./types.js";

export class EnhancedSubscription {
  private constructor(
    private readonly subscription: Subscription,
    private readonly meta: SubscriptionMeta,
  ) {}

  public static create(
    userId: number,
    target: Target,
    threshold: number,
    strategy: StrategyType,
    meta: SubscriptionMeta,
  ): EnhancedSubscription {
    const subscription = SubscriptionFactory.create(
      null,
      userId,
      target,
      threshold,
      strategy,
    );
    return new EnhancedSubscription(subscription, meta);
  }

  public static fromCore(subscription: Subscription, meta: SubscriptionMeta) {
    return new EnhancedSubscription(subscription, meta);
  }

  public shouldNotify(newPrice: number): boolean {
    return this.subscription.shouldNotify(newPrice);
  }

  public calculateDifference(newPrice: number): number {
    return this.subscription.calculateDifference(newPrice);
  }

  public withUpdatedPrice(newPrice: number): EnhancedSubscription {
    return new EnhancedSubscription(
      this.subscription.withUpdatedState(newPrice),
      this.meta,
    );
  }

  withUpdatedMetadata(newMetadata: SubscriptionMeta): EnhancedSubscription {
    return new EnhancedSubscription(this.subscription, newMetadata);
  }
}
