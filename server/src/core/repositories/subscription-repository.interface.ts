// import { Subscription } from "#core/entities/subscription";
//
// export interface ISubscriptionRepository {
//   create(subscription: Subscription): Promise<SubscriptionWithMeta>;
//   updateLastNotifiedPrice(
//     id: string,
//     price: number,
//   ): Promise<SubscriptionWithMeta>;
//   getBy(
//     filter: Partial<SubscriptionWithMeta>,
//   ): Promise<SubscriptionWithMeta | null>;
//   getAll(
//     filter: Partial<SubscriptionWithMeta>,
//   ): Promise<SubscriptionWithMeta[]>;
//   updateStrategy(
//     id: string,
//     strategy: Strategy,
//   ): Promise<SubscriptionWithMeta | null>;
//   changeStatusById(id: string): Promise<SubscriptionWithMeta | null>;
//   deleteById(id: string): Promise<SubscriptionWithMeta | null>;
// }
