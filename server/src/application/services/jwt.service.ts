import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";
import { TYPES } from "#di/types.js";
import { IJwtTokenRepository } from "#application/repository/jwt.repository.js";
import { ApiError } from "#infrastructure/errors/index.js";
import { JwtDbRecord } from "#infrastructure/dtos/jwt/jwt.dto.js";

interface JwtPayloadMetaData extends jwt.JwtPayload {
  userId: number;
}

export interface IJwtTokens {
  refreshToken: string;
  accessToken: string;
}

export interface IJwtService {
  saveToken(userId: number, refreshToken: string): Promise<void>;
  findToken(refreshToken: string): Promise<JwtDbRecord>;
  updateRefreshToken(
    oldRefreshToken: string,
    newRefreshToken: string,
  ): Promise<JwtDbRecord>;

  generatePair(payload: Record<any, unknown>): IJwtTokens;
  validateRefreshToken(token: string): boolean;
  decodeAccessToken(token: string): JwtPayloadMetaData;
}

@injectable()
export class JwtService implements IJwtService {
  private readonly ACCESS_SECRET: string;
  private readonly REFRESH_SECRET: string;

  constructor(
    @inject(TYPES.ConfigService)
    private readonly _config: ConfigService,
    @inject(TYPES.JwtTokenRepository)
    private readonly _jwtTokenRepository: IJwtTokenRepository,
  ) {
    this.ACCESS_SECRET = this._config.get(EnvVariables.JWT_ACCESS_SECRET);
    this.REFRESH_SECRET = this._config.get(EnvVariables.JWT_REFRESH_SECRET);
  }

  public async saveToken(userId: number, refreshToken: string): Promise<void> {
    try {
      await this._jwtTokenRepository.saveToken(userId, refreshToken);
    } catch (error) {
      throw error;
    }
  }

  public async findToken(refreshToken: string): Promise<JwtDbRecord> {
    try {
      const token = await this._jwtTokenRepository.findToken(refreshToken);

      if (!token) throw new ApiError.NotFoundError(`Refresh Token not found`);

      return token;
    } catch (error) {
      throw error;
    }
  }

  public async updateRefreshToken(
    oldRefreshToken: string,
    newRefreshToken: string,
  ): Promise<JwtDbRecord> {
    try {
      const token = await this._jwtTokenRepository.updateRefreshToken(
        oldRefreshToken,
        newRefreshToken,
      );

      if (!token) throw new ApiError.NotFoundError(`Refresh Token not found`);

      return token;
    } catch (error) {
      throw error;
    }
  }

  public generatePair(payload: Record<any, unknown>): IJwtTokens {
    const accessToken = jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  }

  public validateRefreshToken(token: string): boolean {
    try {
      jwt.verify(token, this.REFRESH_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  public decodeAccessToken(token: string): JwtPayloadMetaData {
    const decoded = jwt.verify(token, this.ACCESS_SECRET);
    if (typeof decoded !== "object")
      throw new ApiError.ConflictError(
        "Access token waiting for an object but receives string.",
      );
    if (this.isJwtPayloadMetadata(decoded)) return decoded;
    throw new ApiError.UnauthorizedError("Invalid access token");
  }

  private isJwtPayloadMetadata(
    payload: jwt.JwtPayload,
  ): payload is JwtPayloadMetaData {
    return payload !== null && typeof payload.userId === "number";
  }
}

