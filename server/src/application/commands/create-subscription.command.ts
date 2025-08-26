import { StrategyType } from "#core/entities/notification-strategies/types.js";
import { Target } from "#core/entities/targets/index.js";
import { Command } from "./base/command.inreface.js";

export class CreateSubscriptionCommand extends Command {
  constructor(
    public readonly userId: number,
    public readonly target: Target,
    public readonly threshold: number,
    public readonly strategyType: StrategyType,
  ) {
    super();
  }
}
