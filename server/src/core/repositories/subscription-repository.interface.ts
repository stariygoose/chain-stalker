import {
  Subscription,
  SubscriptionWithMeta,
} from "#core/entities/subscription/index.js";
import { Strategy } from "#core/strategies/notification/notification-strategies.interface.js";

export interface ISubscriptionRepository {
  createOrUpdate(subscription: Subscription): Promise<SubscriptionWithMeta>;

  updateStrategy(
    filter: Partial<Record<string, any>>,
    payload: Partial<Strategy>,
  ): Promise<SubscriptionWithMeta | null>;

  getByWithoutMeta(
    filter: Partial<Record<string, unknown>>,
  ): Promise<Subscription | null>;

  getBy(
    filter: Partial<Record<string, unknown>>,
  ): Promise<SubscriptionWithMeta | null>;

  getAll(
    filter: Partial<Record<string, unknown>>,
  ): Promise<SubscriptionWithMeta[] | null>;

  changeStatusById(
    userId: number,
    id: string,
  ): Promise<SubscriptionWithMeta | null>;

  deleteById(userId: number, id: string): Promise<SubscriptionWithMeta | null>;

  drop(): Promise<void>;
}
