import { Strategy } from "../../entities/strategy";
import { Subscription } from "../../entities/subscription";

interface Filter {
  userId?: string;
  "target.type"?: string;
  "target.symbol"?: string;
  "target.slug"?: string;
}

export interface ISubscriptionRepository {
  create(subscription: Subscription<Strategy>): Promise<Subscription<Strategy>>;
  update(
    _id: string,
    subscription: Subscription<Strategy>,
  ): Promise<Subscription<Strategy>>;
  getBy(filter: Filter): Promise<Subscription<Strategy> | null>;
  getAllByUserId(userId: string): Promise<Subscription<Strategy>[]>;
}
