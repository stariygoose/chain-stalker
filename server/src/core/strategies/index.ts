import { PriceChangeStrategy } from "./price/price-change.strategy";
import { TimeIntervalStrategy } from "./time/time-interval.strategy";

export type Strategy = PriceChangeStrategy | TimeIntervalStrategy;
