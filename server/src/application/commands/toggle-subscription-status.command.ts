import { Command } from "./base/command.inreface.js";

export class ToggleSubscriptionStatusCommand extends Command {
  constructor(
    public readonly userId: number,
    public readonly subscriptionId: string,
  ) {
    super();
  }
}
