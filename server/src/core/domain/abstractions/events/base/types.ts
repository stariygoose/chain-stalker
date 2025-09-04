type Action = "created" | "updated" | "deleted";
type Subject = "subscription" | "strategy" | "last-price" | "last-interval";
export type EventName = `${Action}:${Subject}`;
