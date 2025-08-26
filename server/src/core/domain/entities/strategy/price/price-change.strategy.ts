import { StrategyException } from "#/core/domain/exceptions";
import { NumberValidator } from "#/core/domain/utils/validator";
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
        if (currentPrice === 0) {
          return newPrice !== 0; // Any change from 0 should notify
        }
        const percentageChange = Math.abs(((newPrice - currentPrice) / currentPrice) * 100);
        
        // Special case: with zero threshold, only notify if there's actually a change
        if (this.config.threshold === 0) {
          return percentageChange > 0;
        }
        
        return percentageChange >= this.config.threshold;
      case "absolute":
        const absoluteChange = Math.abs(currentPrice - newPrice);
        
        // Special case: with zero threshold, only notify if there's actually a change
        if (this.config.threshold === 0) {
          return absoluteChange > 0;
        }
        
        return absoluteChange >= this.config.threshold;
      default:
        const exhaustiveCheck: never = mode;
        throw new StrategyException(`unknown mode <${exhaustiveCheck}>`);
    }
  }
}
