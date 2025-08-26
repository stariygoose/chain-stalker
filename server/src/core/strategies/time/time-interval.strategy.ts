import { NumberValidator } from "#/core/utils/validator/number.validator";
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
    this.config = {
      intervalMs: NumberValidator.validateNumber(config.intervalMs),
    };
  }

  shouldNotify(currentState: Date, newState: Date): boolean {
    return (
      Math.abs(newState.getTime() - currentState.getTime()) >=
      this.config.intervalMs
    );
  }
}
