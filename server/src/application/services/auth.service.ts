import { inject, injectable } from "inversify";
import crypto from "crypto";

import { IJwtService, IJwtTokens } from "#application/services/jwt.service.js";
import { TYPES } from "#di/types.js";
import { ApiError, LayerError } from "#infrastructure/errors/index.js";
import { IUserRepository } from "#application/repository/user.repository.js";
import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";

export interface TelegramLoginQuery {
  id: string;
  auth_date: string;
  hash: string;
  first_name: string;
  username: string;
  photo_url?: string;
}

export interface IAuthService {
  telegramLogin(telegramQuery: TelegramLoginQuery): Promise<IJwtTokens>;
  botRegister(userId: number): Promise<void>;
}

@injectable()
export class AuthService implements IAuthService {
  private readonly TG_BOT_TOKEN: string;

  constructor(
    @inject(TYPES.ConfigService)
    private readonly _config: ConfigService,
    @inject(TYPES.JwtService)
    private readonly _jwtService: IJwtService,
    @inject(TYPES.UserRepository)
    private readonly _userRepository: IUserRepository,
  ) {
    this.TG_BOT_TOKEN = this._config.get(EnvVariables.TG_BOT_TOKEN);
  }

  public async botRegister(userId: number): Promise<void> {
    try {
      const isUserExist = await this._userRepository.findByUserId(userId);
      if (!isUserExist) {
        await this._userRepository.createUser(userId);
      }
    } catch (error: unknown) {
      if (error instanceof LayerError.DuplicateKeyDbError) {
        throw new ApiError.ConflictError(
          `User with id ${error.key} already exists`,
        );
      }
      throw error;
    }
  }

  public async telegramLogin(
    telegramQuery: TelegramLoginQuery,
  ): Promise<IJwtTokens> {
    const { id } = telegramQuery;

    try {
      if (!this.checkTelegramHash(telegramQuery)) {
        throw new ApiError.BadRequestError("Invalid hash");
      }

      let userMetaData = await this._userRepository.findByUserId(+id);
      if (!userMetaData) {
        userMetaData = await this._userRepository.createUser(+id);
      }

      const tokens = this._jwtService.generateJwt("both", { ...userMetaData });

      await this._jwtService.saveToken(+id, tokens.refreshToken!);

      return tokens;
    } catch (error: unknown) {
      if (error instanceof LayerError.DuplicateKeyDbError) {
        throw new ApiError.ConflictError(
          `User with id ${error.key} already exists`,
        );
      }
      throw error;
    }
  }

  private checkTelegramHash(telegramQuery: TelegramLoginQuery): boolean {
    const { hash, ...userData } = telegramQuery;
    const dataCheckString = Object.keys(userData)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${(userData as Record<string, string>)[key]}`)
      .join("\n");

    const secretKey = crypto
      .createHash("sha256")
      .update(this.TG_BOT_TOKEN)
      .digest();

    const createdHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return createdHash === hash;
  }
}
