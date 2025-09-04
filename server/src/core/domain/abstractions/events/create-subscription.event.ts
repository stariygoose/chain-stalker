import { Strategy } from "../../entities/strategy";
import { Subscription } from "../../entities/subscription";
import { Event } from "./base/event";

export class CreatedSubscriptionEvent extends Event {
  constructor(payload: Subscription<Strategy>) {
    super("created:subscription", payload);
  }
}
