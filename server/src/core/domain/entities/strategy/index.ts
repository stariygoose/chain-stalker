import { PriceChangeStrategy } from "./price/price-change.strategy";
import { TimeIntervalStrategy } from "./time/time-interval.strategy";

export { StrategyMapper, StrategyType } from "./base/types";
export { PriceChangeStrategyMode } from "./price/types";

export { PriceChangeStrategy } from "./price/price-change.strategy";
export { TimeIntervalStrategy } from "./time/time-interval.strategy";

export type Strategy = PriceChangeStrategy | TimeIntervalStrategy;
