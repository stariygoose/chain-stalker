import { injectable, inject } from "inversify";

import { TYPES } from "#di/types";
import { ILogger } from "#utils/logger";
import { SubscriptionFactory } from "#domain/factories";
import { ISubscriptionRepository } from "#domain/abstractions/repositories";

import { IUseCase } from "./base/use-case.interface";
import { CreateSubscriptionCommand } from "../commands";
import { IEventBus } from "../ports/event-bus";
import { SubscriptionAlreadyExistsException } from "../exceptions";
import { CreatedSubscriptionEvent } from "#/core/domain/abstractions/events";

export interface ICreateSubscriptionUseCase
  extends IUseCase<CreateSubscriptionCommand, void> {}

@injectable()
export class CreateSubscriptionUseCase implements ICreateSubscriptionUseCase {
  constructor(
    @inject(TYPES.SubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus,
    @inject(TYPES.Logger)
    private readonly logger: ILogger,
  ) {}

  async execute(command: CreateSubscriptionCommand): Promise<void> {
    try {
      const subscription = SubscriptionFactory.createSubscription({
        _id: null,
        userId: command.userId,
        target: command.target,
        strategy: command.strategy,
        isActive: true,
      });

      const existingSubscription = await this.subscriptionRepository.getBy({
        userId: command.userId,
        "target.type": command.target.type,
        "target.symbol":
          command.target.type === "token" ? command.target.symbol : undefined,
        "target.slug":
          command.target.type === "nft" ? command.target.slug : undefined,
      });
      if (existingSubscription) {
        throw new SubscriptionAlreadyExistsException();
      }

      const savedSubscription =
        await this.subscriptionRepository.create(subscription);

      const event = new CreatedSubscriptionEvent(
        SubscriptionFactory.createSubscription({
          _id: savedSubscription._id,
          userId: savedSubscription.userId,
          target: savedSubscription.target,
          strategy: savedSubscription.strategy,
          isActive: savedSubscription.isActive,
          updatedAt: savedSubscription.updatedAt,
          createdAt: savedSubscription.createdAt,
        }),
      );

      this.logger.info(
        `Subscription created: ${savedSubscription._id} for user: ${savedSubscription.userId}`,
      );

      this.eventBus.emit(event);
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error}`);
      throw error;
    }
  }
}
