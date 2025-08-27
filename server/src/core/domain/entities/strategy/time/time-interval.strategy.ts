import { NumberValidator } from "#/core/domain/utils/validator";
import { StrategyException } from "#/core/domain/exceptions";
import { Target } from "#domain/entities/target";
import { IStrategy } from "../base/strategy.interface";
import { IntervalChangeStrategyConfig } from "./types";

interface ITimeIntervalStrategy extends IStrategy<Date> {
  readonly type: "interval-change";
  readonly config: IntervalChangeStrategyConfig;

  shouldNotify(target: Target, newState: Date): boolean;
}

export class TimeIntervalStrategy implements ITimeIntervalStrategy {
  readonly type = "interval-change";
  readonly config: IntervalChangeStrategyConfig;

  constructor(config: IntervalChangeStrategyConfig) {
    // Minimum interval is 1 second (1000ms)
    this.validateInterval(config.intervalMs);
    this.config = {
      intervalMs: config.intervalMs,
    };
  }

  public shouldNotify(target: Target, newState: Date): boolean {
    return (
      Math.abs(newState.getTime() - target.state.lastNotifiedAt.getTime()) >=
      this.config.intervalMs
    );
  }

  private validateInterval(intervalMs: number): void {
    const isValidInterval = NumberValidator.isValidNumber(intervalMs);

    if (!isValidInterval)
      throw new StrategyException("Minimum interval is 1000ms (1 second)");

    if (intervalMs < 1000)
      throw new StrategyException("Minimum interval is 1000ms (1 second)");
  }
}
