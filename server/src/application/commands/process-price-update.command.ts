import { TargetTypes } from "#core/entities/targets/index.js";
import { Command } from "./base/command.inreface.js";

export class ProcessPriceUpdateCommand extends Command {
  constructor(
    public readonly targetType: TargetTypes,
    public readonly symbol: string,
    public readonly slug: string | null,
    public readonly newPrice: number,
  ) {
    super();
  }
}
