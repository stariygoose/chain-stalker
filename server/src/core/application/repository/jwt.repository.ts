import { JwtDbRecord } from "#infrastructure/dtos/jwt/jwt.dto.js";


export interface IJwtTokenRepository {
	findToken(refreshToken: string): Promise<JwtDbRecord | null>;
	updateRefreshToken(oldRefreshToken: string, newRefreshToken: string): Promise<JwtDbRecord | null>;
	saveToken(userId: number, refreshToken: string): Promise<void>;
}