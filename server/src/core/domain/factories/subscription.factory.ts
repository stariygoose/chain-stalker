import {
  PriceChangeStrategy,
  PriceChangeStrategyMode,
  TimeIntervalStrategy,
} from "#domain/entities/strategy";
import {
  NftTarget,
  Target,
  TargetType,
  TokenTarget,
} from "#domain/entities/target";
import { Subscription } from "#domain/entities/subscription";
import { FactoryException } from "#domain/exceptions";

export class SubscriptionFactory {
  static createPriceChangeSubscription(
    threshold: number,
    mode: PriceChangeStrategyMode,
    type: TargetType,
    currentPrice: number,
    lastNotifiedAt: Date = new Date(),
  ): Subscription<PriceChangeStrategy> {
    const target = SubscriptionFactory.createTarget(
      type,
      currentPrice,
      lastNotifiedAt,
    );
    const strategy = new PriceChangeStrategy({ mode, threshold });
    return new Subscription(target, strategy);
  }

  static createIntervalChangeSubscription(
    intervalMs: number,
    type: TargetType,
    currentPrice: number,
    lastNotifiedAt: Date = new Date(),
  ) {
    const target = SubscriptionFactory.createTarget(
      type,
      currentPrice,
      lastNotifiedAt,
    );

    const strategy = new TimeIntervalStrategy({ intervalMs });
    return new Subscription(target, strategy);
  }

  private static createTarget(
    type: TargetType,
    currentPrice: number,
    lastNotifiedAt: Date,
  ): Target {
    switch (type) {
      case "nft":
        return new NftTarget({
          lastNotifiedAt,
          lastNotifiedPrice: currentPrice,
        });
      case "token":
        return new TokenTarget({
          lastNotifiedAt,
          lastNotifiedPrice: currentPrice,
        });
      default:
        const exhaustiveCheck: never = type;
        throw new FactoryException(`unknown target type <${exhaustiveCheck}>`);
    }
  }
}
