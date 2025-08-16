export class TokenStorage {
  private readonly ACCESS_TOKEN_EXPIRY = "access_token_expiry";
  private readonly REFRESH_TOKEN_EXPIRY = "refresh_token_expiry";

  public setAccessTokenExpiry(expiry: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_EXPIRY, expiry);
  }

  public setRefreshTokenExpiry(expiry: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_EXPIRY, expiry);
  }

  public isAccessTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.ACCESS_TOKEN_EXPIRY);
    if (!expiryTime) return true;

    return Date.now() > parseInt(expiryTime) - 30000;
  }

  public isRefreshTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.REFRESH_TOKEN_EXPIRY);
    if (!expiryTime) return true;

    return Date.now() > parseInt(expiryTime) - 30000;
  }

  public clearExpiries(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_EXPIRY);
    localStorage.removeItem(this.REFRESH_TOKEN_EXPIRY);
  }

  public hasAccessToken(): boolean {
    return !!document.cookie.
  }
}
