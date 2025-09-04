import { Event, EventName } from "#domain/abstractions/events";
import { EventHandler } from "./types";

export interface IEventBus {
  on(event: EventName, handler: EventHandler): void;
  off(event: EventName, handler: EventHandler): void;
  emit(event: Event): void;
}

export class EventBus implements IEventBus {
  private _handlers: Record<EventName | string, EventHandler[]> = {};

  public on(event: EventName, handler: EventHandler) {
    if (!this._handlers[event]) {
      this._handlers[event] = [];
    }

    this._handlers[event].push(handler);
  }

  public off(event: EventName, handler: EventHandler) {
    if (!this._handlers[event]) {
      return;
    }

    this._handlers[event] = this._handlers[event].filter((h) => h !== handler);
  }

  public emit(event: Event) {
    if (!this._handlers[event.type]) {
      return;
    }

    this._handlers[event.type].forEach((handler) => handler(event));
  }
}
