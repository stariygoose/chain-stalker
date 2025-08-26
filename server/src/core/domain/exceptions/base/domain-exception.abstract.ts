export class DomainException extends Error {
  readonly httpCode: number = 500;
  readonly errorSlug: string;

  constructor(reason: string, errorSlug: string) {
    super(`Domain logic error. Reason: ${reason}`);
    this.errorSlug = errorSlug;
  }

  public getJSON() {
    return {
      message: this.message,
      errorSlug: this.errorSlug,
      httpCode: this.httpCode,
    };
  }
}
