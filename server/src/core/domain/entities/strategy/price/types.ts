export type PriceChangeStrategyMode = "percentage" | "absolute";
export type PriceChangeStrategyConfig = {
  mode: PriceChangeStrategyMode;
  threshold: number;
};
