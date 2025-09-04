import { Strategy } from "#/core/domain/entities/strategy";
import { Target } from "#/core/domain/entities/target";

export class CreateSubscriptionCommand {
  constructor(
    public userId: string,
    public target: Target,
    public strategy: Strategy,
  ) {}
}
