import { TargetTypes } from "#core/entities/targets/index.js";
import { Query } from "./base/query.interface.js";

export class GetUserSubscriptionsQuery extends Query {
  constructor(
    public readonly userId: number,
    public readonly targetType?: TargetTypes,
    public readonly isActive?: boolean,
    public readonly page?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
