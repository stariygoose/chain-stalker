import { Strategy, StrategyMapper } from "#domain/entities/strategy";
import { Target } from "#domain/entities/target";
import { StrategyException } from "#domain/exceptions";

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
        throw new StrategyException(
          `unknown strategy type <${exhaustiveCheck}>`,
        );
    }
  }

  public notifyAndUpdate(newPrice: number): ISubscription<TStrategy> {
    const newState = {
      lastNotifiedPrice: newPrice,
      lastNotifiedAt: new Date(),
    };

    const newTarget = this.target.withUpdatedState(newState);

    return new Subscription(newTarget, this.strategy);
  }
}
