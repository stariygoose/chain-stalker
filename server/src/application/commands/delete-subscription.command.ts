import { Command } from "./base/command.inreface.js";

export class DeleteSubscriptionCommand extends Command {
  constructor(
    public readonly userId: number,
    public readonly subscriptionId: string,
  ) {
    super();
  }
}
