import { IDomainEvent } from "#core/events/base/domain-event.js";

export type EventHandler = (event: IDomainEvent) => Promise<void>;
