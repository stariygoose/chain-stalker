type NftTarget = {
  type: "nft";
  name: string;
  slug: string;
  chain: string;
  lastNotifiedPrice: number;
  symbol: string;
};
type TokenTarget = {
  type: "token";
  lastNotifiedPrice: number;
  symbol: string;
};

type PercentageStrategy = {
  type: "percentage";
  threshold: number;
};
type AbsoluteStrategy = {
  type: "absolute";
  threshold: number;
};
type Strategy = PercentageStrategy | AbsoluteStrategy;

type NftSubscription = {
  id: string;
  target: NftTarget;
  strategy: Strategy;
  isActive: boolean;
};
type TokenSubscription = {
  id: string;
  target: TokenTarget;
  strategy: Strategy;
  isActive: boolean;
};

export type Subscription = NftSubscription | TokenSubscription;
