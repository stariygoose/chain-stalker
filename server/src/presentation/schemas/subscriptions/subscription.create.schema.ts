import Joi from "joi";
import {
  strategyAbsoluteSchema,
  strategyPercentageSchema,
} from "#presentation/schemas/common/strategies.schema.js";
import {
  tokenTargetSchema,
  nftTargetSchema,
} from "#presentation/schemas/common/token-target.schema.js";

export const subscriptionCreateSchema = Joi.object({
  target: Joi.alternatives()
    .conditional(
      Joi.object({ type: Joi.valid("token").required() }).unknown(),
      {
        then: tokenTargetSchema,
      },
    )
    .conditional(Joi.object({ type: Joi.valid("nft").required() }).unknown(), {
      then: nftTargetSchema,
    }),
  strategy: Joi.alternatives()
    .conditional(
      Joi.object({ type: Joi.valid("percentage").required() }).unknown(),
      {
        then: strategyPercentageSchema,
      },
    )
    .conditional(
      Joi.object({ type: Joi.valid("absolute").required() }).unknown(),
      {
        then: strategyAbsoluteSchema,
      },
    ),
});

