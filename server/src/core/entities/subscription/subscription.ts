import { TargetState } from "#/core/entities/targets/base/types";
import { Target } from "#/core/entities/targets/index";
import { StrategyConfigurationError } from "#/core/errors/";
import { StrategyMapper } from "#/core/strategies/base/types";
import { Strategy } from "#/core/strategies/";

interface ISubscription<TStrategy extends Strategy> {
  readonly target: Target;
  readonly strategy: TStrategy;

  shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean;
  notifyAndUpdate(newPrice: number): ISubscription<TStrategy>;
}

export class Subscription<TStrategy extends Strategy>
  implements ISubscription<TStrategy>
{
  constructor(
    readonly target: Target,
    readonly strategy: TStrategy,
  ) {}

  public shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean {
    const { type } = this.strategy;
    switch (type) {
      case "price-change":
        return this.strategy.shouldNotify(
          this.target.state.lastNotifiedPrice,
          newState as number,
        );
      case "interval-change":
        return this.strategy.shouldNotify(
          this.target.state.lastNotifiedAt,
          newState as Date,
        );
      default:
        const exhaustiveCheck: never = type;
        throw new StrategyConfigurationError(
          `unknown strategy type <${exhaustiveCheck}>`,
        );
    }
  }

  public notifyAndUpdate(newPrice: number): ISubscription<TStrategy> {
    const newState: TargetState = {
      lastNotifiedPrice: newPrice,
      lastNotifiedAt: new Date(),
    };

    const newTarget = this.target.withUpdatedState(newState);

    return new Subscription(newTarget, this.strategy);
  }
}
