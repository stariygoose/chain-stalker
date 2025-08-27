import { Strategy, StrategyMapper } from "#domain/entities/strategy";
import { Target } from "#domain/entities/target";
import { StrategyException, SubscriptionException } from "#domain/exceptions";

interface ISubscription<TStrategy extends Strategy> {
  readonly target: Target;
  readonly strategy: TStrategy;
  isActive: boolean;

  shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean;
  notifyAndUpdate(newPrice: number): ISubscription<TStrategy>;
  updateStrategy(newStrategy: Strategy): ISubscription<Strategy>;
  activate(): void;
  deactivate(): void;
}

export class Subscription<TStrategy extends Strategy>
  implements ISubscription<TStrategy>
{
  constructor(
    readonly target: Target,
    readonly strategy: TStrategy,
    public isActive: boolean = true,
  ) {}

  public shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean {
    this.assertIsActive();

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
    this.assertIsActive();

    const newState = {
      lastNotifiedPrice: newPrice,
      lastNotifiedAt: new Date(),
    };

    const newTarget = this.target.withUpdatedState(newState);

    return new Subscription(newTarget, this.strategy, this.isActive);
  }

  public updateStrategy(newStrategy: Strategy): ISubscription<Strategy> {
    return new Subscription(this.target, newStrategy, this.isActive);
  }

  public activate(): void {
    this.isActive = true;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  private assertIsActive(): void {
    if (!this.isActive) {
      throw new SubscriptionException("subscription is not active");
    }
  }
}
