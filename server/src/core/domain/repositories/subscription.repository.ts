export interface SubscriptionRepository {
  create(subscription: Subscription): Promise<void>;
}
