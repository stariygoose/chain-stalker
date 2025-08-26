export interface IQuery {
  readonly queryId: string;
  readonly timestamp: Date;
}

export abstract class Query implements IQuery {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}
