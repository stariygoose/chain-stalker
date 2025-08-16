import { inject, injectable } from "inversify";

import { IBot } from "#bot/bot.js";
import { Command } from "#handlers/commands/command.abstract.js";
import { COMMAND_TYPES, TYPES } from "#di/types.js";
import { MenuCommand } from "#handlers/commands/commands/menu.command.js";
import { ILogger } from "#config/index.js";
import { ApiService } from "#lib/api/api.service.js";

@injectable()
export class StartCommand extends Command {
  constructor(
    @inject(TYPES.Bot)
    public readonly bot: IBot,
    @inject(TYPES.Logger)
    private readonly _logger: ILogger,
    @inject(COMMAND_TYPES.MenuCommand)
    private readonly _menuCommand: MenuCommand,
    @inject(TYPES.ApiService)
    private readonly _apiService: ApiService,
  ) {
    super();
  }

  public handle(): void {
    this.bot.command("start", async (ctx) => {
      try {
        if (ctx.session.isFirstLogin) {
          this._apiService.login(ctx);
        }

        const user = ctx.from?.username ?? "hunter";

        await this._menuCommand.showMenu(ctx, `🕵🏻 Welcome, <b>${user}</b>.`);
      } catch (error: unknown) {
        this._logger.error(
          `Error while User ${ctx.from?.id} was trying to call a COMMAND START. Error ${(error as Error).message}`,
        );
      }
    });
  }
}

