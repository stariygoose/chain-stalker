import { ApiError } from "#infrastructure/errors/api-errors/api-error.abstract.js";

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ExternalApiError extends ApiError {
  constructor(message?: string) {
    super(503, message ?? `Failed to fetch external API.`);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message);
  }
}

export class LoginTimeoutError extends ApiError {
  constructor(message: string) {
    super(440, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
  }
}

