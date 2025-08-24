import { ITokenTarget } from "#core/entities/targets/index.js";
import { IPriceChangeStrategy } from "#core/strategies/notification/notification-strategies.interface.js";
import { AbstractSubscription } from "#core/entities/subscription/subscription.abstract.js";
import { TokenTargetValidator } from "#core/validators/targets/token-target.validator.js";
import { ISubscription } from "#core/entities/subscription/index.js";

export interface ITokenSubscription extends ISubscription {
  readonly target: ITokenTarget;
  readonly strategy: IPriceChangeStrategy;

  calculateDifference(newState: number, precision?: number): number;
}

/**
 * Represents a subscription for tracking changes in a token's price.
 * Determines when a notification should be sent based on a defined price change strategy.
 */
export class TokenSubscription
  extends AbstractSubscription<ITokenTarget, IPriceChangeStrategy>
  implements ITokenSubscription
{
  /**
   * Creates an instance of TokenSubscription.
   *
   * @param {string | null} id - The unique identifier of the subscription, or `null` if not assigned.
   * @param {number} userId - The ID of the user who owns this subscription.
   * @param {ITokenTarget} target - The token being tracked, including its price and symbol.
   * @param {IPriceChangeStrategy} strategy - The strategy used to determine notification conditions.
   * @param {boolean} [isActive] - Whether the subscription is currently active (defaults to `true`).
   */
  constructor(
    id: string | null,
    userId: number,
    target: ITokenTarget,
    strategy: IPriceChangeStrategy,
    isActive?: boolean,
  ) {
    super(id, userId, target, strategy, isActive);
    this.validateSubscription();
  }

  /**
   * Determines whether a notification should be triggered based on the new token price.
   *
   * @param {number} newState - The updated price of the token.
   * @returns {boolean} Whether the price change meets the notification criteria.
   */
  public shouldNotify(newState: number): boolean {
    return this.strategy.shouldNotify(this.target.lastNotifiedPrice, newState);
  }

  public calculateDifference(newState: number, precision?: number): number {
    return this.strategy.calculateDifference(
      this.target.lastNotifiedPrice,
      newState,
      precision,
    );
  }

  /**
   * Creates a new TokenSubscription instance with an updated token price.
   *
   * @param {number} newState - The updated price of the token.
   * @returns {TokenSubscription} A new TokenSubscription instance reflecting the updated state.
   */
  public withUpdatedState(newState: number): TokenSubscription {
    const updatedState: ITokenTarget = {
      ...this.target,
      lastNotifiedPrice: newState,
    };

    return new TokenSubscription(
      this.id,
      this.userId,
      updatedState,
      this.strategy,
      this.isActive,
    );
  }

  /**
   * Validates the configuration of a TokenSubscription instance.
   * Ensures that the target price is a valid number.
   *
   * @throws {DomainError.InvalidSubscriptionConfigurationError} If the target's floor price is NaN.
   */
  protected validateSubscription(): void {
    new TokenTargetValidator(this.target).validate();
  }
}

export class TokenSubscriptionWithMeta extends TokenSubscription {
  constructor(
    id: string | null,
    userId: number,
    target: ITokenTarget,
    strategy: IPriceChangeStrategy,
    isActive: boolean,
    public readonly lastTriggeredAt: Date,
    public readonly createdAt: Date,
  ) {
    super(id, userId, target, strategy, isActive);
  }

  public withUpdatedState(newState: number): TokenSubscriptionWithMeta {
    const updatedState: ITokenTarget = {
      ...this.target,
      lastNotifiedPrice: newState,
    };

    return new TokenSubscriptionWithMeta(
      this.id,
      this.userId,
      updatedState,
      this.strategy,
      this.isActive,
      new Date(),
      this.createdAt,
    );
  }

  static fromDbData(data: any): TokenSubscriptionWithMeta {
    return new TokenSubscriptionWithMeta(
      data.id,
      data.userId,
      data.target,
      data.strategy,
      data.isActive,
      data.lastTriggeredAt,
      data.createdAt,
    );
  }
}
