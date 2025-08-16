import { inject, injectable } from "inversify";

import { UserModel } from "#infrastructure/database/mongodb/models/users/user.model.js";
import { TYPES } from "#di/types.js";
import { ILogger } from "#utils/logger.js";
import { IUserRepository } from "#application/repository/user.repository.js";
import { AbstractDatabaseError } from "#infrastructure/errors/database-errors/database-errors.abstract.js";
import { LayerError } from "#infrastructure/errors/index.js";
import { UserDbRecord } from "#infrastructure/dtos/user/user.dto.js";
import { JwtMapper } from "#infrastructure/mappers/jwt/jwt.mapper.js";

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TYPES.Logger)
    private readonly _logger: ILogger,
  ) {}

  public async findByUserId(userId: number): Promise<UserDbRecord | null> {
    try {
      const user = await UserModel.findOne({ userId }).lean<UserDbRecord>();

      if (!user) return null;

      return user;
    } catch (error: unknown) {
      this._handleDbError(error);
    }
  }

  public async createUser(userId: number): Promise<UserDbRecord> {
    try {
      const user = await UserModel.create({ userId });

      if (!user)
        throw new LayerError.DatabaseError(
          `User creation with id ${userId} failed`,
        );

      return JwtMapper.toDomain(user);
    } catch (error: any) {
      if (error.code === 11000) {
        this._logger.error(
          `Database error: User with id ${userId} already exists in User Database.`,
        );
        throw new LayerError.DuplicateKeyDbError(userId);
      }

      this._handleDbError(error);
    }
  }

  private _handleDbError(error: any): never {
    if (error instanceof AbstractDatabaseError) {
      this._logger.error(error.message);
      throw error;
    }

    this._logger.error(
      `Unexpected Database Error. Reason: ${(error as Error).message}`,
    );
    throw new LayerError.DatabaseError("Unexpected Database Error.");
  }
}

