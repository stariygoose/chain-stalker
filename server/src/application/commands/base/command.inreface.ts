export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
}

export abstract class Command implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
