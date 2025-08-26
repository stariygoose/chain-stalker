import { StrategyConfigurationError } from "#/core/errors/";
import { NumberValidator } from "#/core/utils/validator/number.validator";
import { IStrategy } from "../base/strategy.interface";
import { PriceChangeStrategyConfig } from "./types";

interface IPriceChangeStrategy extends IStrategy<number> {
  readonly type: "price-change";
  readonly config: PriceChangeStrategyConfig;

  shouldNotify(currentState: number, newState: number): boolean;
}

export class PriceChangeStrategy implements IPriceChangeStrategy {
  readonly type = "price-change";
  readonly config: PriceChangeStrategyConfig;

  constructor(config: PriceChangeStrategyConfig) {
    this.config = {
      threshold: NumberValidator.validateNumber(config.threshold),
      mode: config.mode,
    };
  }

  public shouldNotify(currentState: number, newState: number): boolean {
    return this.calculate(currentState, newState);
  }

  private calculate(currentPrice: number, newPrice: number): boolean {
    const { mode } = this.config;

    switch (mode) {
      case "percentage":
        return (
          ((newPrice - currentPrice) / currentPrice) * 100 >=
          this.config.threshold
        );
      case "absolute":
        return Math.abs(currentPrice - newPrice) >= this.config.threshold;
      default:
        const exhaustiveCheck: never = mode;
        throw new StrategyConfigurationError(
          `unknown mode <${exhaustiveCheck}>`,
        );
    }
  }
}
