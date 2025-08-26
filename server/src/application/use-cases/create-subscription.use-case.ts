import { injectable, inject } from "inversify";

import { IUseCase } from "./base/use-case.interface";

export interface ICreateSubscriptionUseCase
  extends IUseCase<CreateSubscriptionCommand, Subscription> {}

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

  async execute(command: CreateSubscriptionCommand): Promise<Subscription> {
    try {
      const subscription = SubscriptionFactory.create(
        null,
        command.userId,
        command.target,
        command.threshold,
        command.strategyType,
      );

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

      const event = new SubscriptionCreatedEvent(
        savedSubscription.id!,
        savedSubscription.userId,
        savedSubscription.target,
        savedSubscription.strategy,
      );

      await this.eventBus.publish(event);

      this.logger.info(
        `Subscription created: ${savedSubscription.id} for user: ${command.userId}`,
      );

      return savedSubscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error}`);
      throw error;
    }
  }
}
