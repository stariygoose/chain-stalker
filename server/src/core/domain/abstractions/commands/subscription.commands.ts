import { Subscription } from "#domain/entities/subscription";
import { Strategy } from "#domain/entities/strategy";

export interface SubscriptionCommands {
  create(subscription: Subscription<Strategy>): Promise<void>;
  update(_id: string, subscription: Subscription<Strategy>): Promise<void>;
  delete(_id: string): Promise<void>;
}
