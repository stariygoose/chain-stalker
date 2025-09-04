import { Event } from "#domain/abstractions/events";

export type EventHandler = (event: Event) => Promise<void>;
