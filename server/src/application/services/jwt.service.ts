import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

import { ConfigService } from "#config/config.service.js";
import { EnvVariables } from "#config/env-variables.js";
import { TYPES } from "#di/types.js";
import { IJwtTokenRepository } from "#application/repository/jwt.repository.js";
import { ApiError } from "#infrastructure/errors/index.js";
import { JwtDbRecord } from "#infrastructure/dtos/jwt/jwt.dto.js";

export interface JwtPayload {
  userId: number;
}

type JwtPayloadMetaData = JwtPayload & jwt.JwtPayload;

type JwtType = "access" | "refresh" | "both";

export interface IJwtTokens {
  refreshToken: string | null;
  accessToken: string | null;
}

export interface IJwtService {
  saveToken(userId: number, refreshToken: string): Promise<void>;
  findToken(refreshToken: string): Promise<JwtDbRecord>;
  updateRefreshToken(
    oldRefreshToken: string,
    newRefreshToken: string,
  ): Promise<JwtDbRecord>;

  generateJwt(type: JwtType, payload: JwtPayload): IJwtTokens;
  validateToken(type: Omit<JwtType, "both">, token: string): void;
  decodeToken(token: string): JwtPayloadMetaData;
}

@injectable()
export class JwtService implements IJwtService {
  private readonly ACCESS_EXPIRES = "10m";
  private readonly REFRESH_EXPIRES = "30d";

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

  public generateJwt(type: JwtType, payload: JwtPayload): IJwtTokens {
    switch (type) {
      case "access":
        const accessToken = this.generateAccessToken(payload);
        return {
          accessToken,
          refreshToken: null,
        };
      case "refresh":
        const refreshToken = this.generateRefreshToken(payload);
        return {
          accessToken: null,
          refreshToken,
        };
      case "both":
        const aToken = this.generateAccessToken(payload);
        const rToken = this.generateRefreshToken(payload);
        return {
          accessToken: aToken,
          refreshToken: rToken,
        };
      default:
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled type ${exhaustiveCheck}`);
    }
  }

  public validateToken(type: Omit<JwtType, "both">, token: string): void {
    switch (type) {
      case "access":
        this.validateAccessToken(token);
        break;
      case "refresh":
        this.validateRefreshToken(token);
        break;
      default:
        break;
    }
  }

  public decodeToken(token: string): JwtPayloadMetaData {
    const decoded = jwt.decode(token, { json: true });
    if (!decoded)
      throw new ApiError.ConflictError(
        "Token waiting for an object but receives null.",
      );
    if (this.isJwtPayloadMetadata(decoded)) return decoded;
    throw new ApiError.UnauthorizedError("Invalid access token");
  }

  private validateRefreshToken(token: string): void {
    try {
      jwt.verify(token, this.REFRESH_SECRET);
    } catch (error: unknown) {
      throw error;
    }
  }

  private validateAccessToken(token: string): void {
    try {
      jwt.verify(token, this.ACCESS_SECRET);
    } catch (error: unknown) {
      throw error;
    }
  }

  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES,
    });
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES,
    });
  }

  private isJwtPayloadMetadata(
    payload: jwt.JwtPayload,
  ): payload is JwtPayloadMetaData {
    return payload !== null && typeof payload.userId === "number";
  }
}
