export interface IUseCase<TCommand, TResult> {
  execute(command: TCommand): Promise<TResult>;
}
