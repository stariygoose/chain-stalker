import {
  INftSubscription,
  NftSubscriptionWithMeta,
} from "#core/entities/subscription/nft-subscription.class.js";
import {
  ITokenSubscription,
  TokenSubscriptionWithMeta,
} from "#core/entities/subscription/token-subscription.class.js";

export { ISubscription } from "#core/entities/subscription/subscription.interface.js";

export type Subscription = INftSubscription | ITokenSubscription;

export type SubscriptionWithMeta =
  | NftSubscriptionWithMeta
  | TokenSubscriptionWithMeta;
