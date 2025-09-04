import {
  SupportedNftsMarketplace,
  SupportedTokensMarketplace,
} from "./types.js";

export interface WebsocketManager {
  startTokenMonitoring(
    userId: number,
    marketplace: SupportedTokensMarketplace,
    symbol: string,
  ): void;
  stopTokenMonitoring(
    userId: number,
    marketplace: SupportedTokensMarketplace,
    symbol: string,
  ): void;
  getTokenMonitoringUsersCount(
    marketplace: SupportedTokensMarketplace,
    symbol: string,
  ): number;

  startNftMonitoring(
    userId: number,
    marketplace: SupportedNftsMarketplace,
    slug: string,
  ): void;
  stopNftMonitoring(
    userId: number,
    marketplace: SupportedNftsMarketplace,
    slug: string,
  ): void;
  getNftMonitoringUsersCount(
    marketplace: SupportedNftsMarketplace,
    slug: string,
  ): number;
}
