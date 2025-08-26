import { StrategyType } from "./types";

export interface IStrategy<TInput = unknown> {
  readonly type: StrategyType;
  readonly config: Record<string, unknown>;

  shouldNotify(currentState: TInput, newState: TInput): boolean;
}
