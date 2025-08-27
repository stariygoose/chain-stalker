import { Strategy, StrategyMapper } from "#domain/entities/strategy";
import { Target } from "#domain/entities/target";
import { StrategyException, SubscriptionException } from "#domain/exceptions";

interface ISubscription<TStrategy extends Strategy> {
  readonly _id: string | null;
  readonly userId: string;
  readonly target: Target;
  readonly strategy: TStrategy;
  readonly isActive: boolean;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean;
  notifyAndUpdate(newPrice: number): ISubscription<TStrategy>;
  updateStrategy(newStrategy: Strategy): ISubscription<Strategy>;
  activate(): ISubscription<TStrategy>;
  deactivate(): ISubscription<TStrategy>;
}

export class Subscription<TStrategy extends Strategy>
  implements ISubscription<TStrategy>
{
  constructor(
    readonly userId: string,
    readonly target: Target,
    readonly strategy: TStrategy,

    readonly isActive: boolean = true,
    readonly _id: string | null = null,
    readonly updatedAt: Date = new Date(),
    readonly createdAt: Date = new Date(),
  ) {}

  public shouldNotify(newState: StrategyMapper[TStrategy["type"]]): boolean {
    this.assertIsActive();
    return this.strategy.shouldNotify(this.target, newState);
  }

  public notifyAndUpdate(newPrice: number): ISubscription<TStrategy> {
    this.assertIsActive();

    const newState = {
      lastNotifiedPrice: newPrice,
      lastNotifiedAt: new Date(),
    };

    const newTarget = this.target.withUpdatedState(newState);

    return new Subscription(
      this.userId,
      newTarget,
      this.strategy,
      this.isActive,
      this._id,
      this.updatedAt,
      this.createdAt,
    );
  }

  public updateStrategy(newStrategy: Strategy): ISubscription<Strategy> {
    return new Subscription(
      this.userId,
      this.target,
      newStrategy,
      this.isActive,
      this._id,
      this.updatedAt,
      this.createdAt,
    );
  }

  public activate(): ISubscription<TStrategy> {
    return new Subscription(
      this.userId,
      this.target,
      this.strategy,
      true,
      this._id,
      this.updatedAt,
      this.createdAt,
    );
  }

  public deactivate(): ISubscription<TStrategy> {
    return new Subscription(
      this.userId,
      this.target,
      this.strategy,
      false,
      this._id,
      this.updatedAt,
      this.createdAt,
    );
  }

  private assertIsActive(): void {
    if (!this.isActive) {
      throw new SubscriptionException("subscription is not active");
    }
  }
}
