import { NumberValidator } from "#/core/domain/utils/validator";
import { StrategyException } from "#/core/domain/exceptions";
import { IStrategy } from "../base/strategy.interface";
import { IntervalChangeStrategyConfig } from "./types";

interface ITimeIntervalStrategy extends IStrategy<Date> {
  readonly type: "interval-change";
  readonly config: IntervalChangeStrategyConfig;

  shouldNotify(currentState: Date, newState: Date): boolean;
}

export class TimeIntervalStrategy implements ITimeIntervalStrategy {
  readonly type = "interval-change";
  readonly config: IntervalChangeStrategyConfig;

  constructor(config: IntervalChangeStrategyConfig) {
    const validatedInterval = NumberValidator.validateNumber(config.intervalMs);
    
    // Minimum interval is 1 second (1000ms)
    if (validatedInterval < 1000) {
      throw new StrategyException("Minimum interval is 1000ms (1 second)");
    }
    
    this.config = {
      intervalMs: validatedInterval,
    };
  }

  shouldNotify(currentState: Date, newState: Date): boolean {
    return (
      Math.abs(newState.getTime() - currentState.getTime()) >=
      this.config.intervalMs
    );
  }
}
