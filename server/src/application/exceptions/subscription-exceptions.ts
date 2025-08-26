import { ApplicationException } from "./application-exception.abstract.js";

export class SubscriptionNotFoundException extends ApplicationException {
  constructor(message: string = "Subscription not found") {
    super(message, "SUBSCRIPTION_NOT_FOUND", 404);
  }
}

export class SubscriptionAlreadyExistsException extends ApplicationException {
  constructor(
    message: string = "Subscription with this target already exists",
  ) {
    super(message, "SUBSCRIPTION_ALREADY_EXISTS", 409);
  }
}

export class InvalidSubscriptionDataException extends ApplicationException {
  constructor(message: string = "Invalid subscription data") {
    super(message, "INVALID_SUBSCRIPTION_DATA", 400);
  }
}

export class SubscriptionOperationFailedException extends ApplicationException {
  constructor(message: string = "Subscription operation failed") {
    super(message, "SUBSCRIPTION_OPERATION_FAILED", 500);
  }
}
