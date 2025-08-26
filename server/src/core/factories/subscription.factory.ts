import { Subscription } from "#/core/entities/subscription/subscription";
import { TargetType } from "#/core/entities/targets/base/types";
import { Target } from "#/core/entities/targets/index";
import { NftTarget } from "#/core/entities/targets/nft.target";
import { TokenTarget } from "#/core/entities/targets/token.target";
import { PriceChangeStrategy } from "#/core/strategies/price/price-change.strategy";
import { PriceChangeStrategyMode } from "#/core/strategies/price/types";
import { TimeIntervalStrategy } from "#/core/strategies/time/time-interval.strategy";
import { FactoryInvalidTargetTypeError } from "#/core/errors/";

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
        throw new FactoryInvalidTargetTypeError(
          `Unknown target type: ${exhaustiveCheck}`,
        );
    }
  }
}
