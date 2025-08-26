import { EventName, IDomainEvent } from "#core/events/base/domain-event.js";
import { ILogger } from "#utils/logger.js";
import { inject, injectable } from "inversify";
import { EventEmitter } from "stream";
import { EventHandler } from "./types.js";
import { TYPES } from "#di/types.js";

export interface IEventBus {
  publish(event: IDomainEvent): Promise<void>;
  subscribe(eventName: EventName, handler: EventHandler): void;
}

@injectable()
export class EventBus extends EventEmitter {
  constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {
    super();
    this.setMaxListeners(100);
  }

  public async publish(event: IDomainEvent): Promise<void> {
    const { eventName } = event;

    const listenerCount = this.listenerCount(eventName);
    if (listenerCount === 0) {
      this.logger.debug(`No listeners registered for event: ${eventName}`);
      return;
    }

    this.logger.debug(
      `Publishing event: ${eventName} for ${listenerCount} handlers`,
    );
    const promises = this.listeners(eventName).map(async (listener) => {
      try {
        await listener(event);
      } catch (error) {
        this.logger.error(`Handler error: ${error}`);
      }
    });

    await Promise.allSettled(promises);
  }

  public subscribe(eventName: EventName, handler: EventHandler): void {
    this.on(eventName, async (event) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error handling event ${eventName}: ${error}`);
      }
    });

    this.logger.debug(`Handler registered for event: ${eventName}`);
  }
}
