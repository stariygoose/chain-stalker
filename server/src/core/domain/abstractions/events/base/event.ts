import { EventName } from "./types";

export abstract class Event {
  constructor(
    public type: EventName,
    public payload: unknown,
  ) {}
}
