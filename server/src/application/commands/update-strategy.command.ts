import { Strategy } from "#core/entities/notification-strategies/types.js";
import { Command } from "./base/command.inreface.js";

export class UpdateStrategyCommand extends Command {
  constructor(
    public readonly userId: number,
    public readonly subscriptionId: string,
    public readonly newStrategy: Strategy,
  ) {
    super();
  }
}
