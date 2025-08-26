import { Query } from "./base/query.interface.js";

export class GetSubscriptionByIdQuery extends Query {
  constructor(
    public readonly userId: number,
    public readonly subscriptionId: string,
  ) {
    super();
  }
}
