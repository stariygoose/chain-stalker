import { UserDbRecord } from "#infrastructure/dtos/user/user.dto.js";

export interface IUserRepository {
	findByUserId(userId: number): Promise<UserDbRecord | null>;
	createUser(userId: number): Promise<UserDbRecord>;
}