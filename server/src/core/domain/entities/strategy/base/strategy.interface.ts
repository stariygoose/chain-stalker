import { StrategyType } from "./types";
import { Target } from "#domain/entities/target";

export interface IStrategy<TInput = unknown> {
  readonly type: StrategyType;
  readonly config: Record<string, unknown>;

  shouldNotify(target: Target, newState: TInput): boolean;
}
