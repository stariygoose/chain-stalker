type HttpCode = 400 | 404 | 503 | 401 | 409 | 440;

export abstract class ApiError extends Error {
  constructor(
    public readonly status: HttpCode,
    public readonly error: string,
  ) {
    super(error);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

