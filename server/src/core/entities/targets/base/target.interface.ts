import { TargetState, TargetType } from "./types";

export interface ITarget<TTarget extends ITarget<TTarget>> {
  readonly type: TargetType;
  readonly state: TargetState;

  withUpdatedState(state: TargetState): TTarget;
}
