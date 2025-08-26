export type StrategyType = "price-change" | "interval-change";
export type StrategyMapper = {
  "price-change": number;
  "interval-change": Date;
};
