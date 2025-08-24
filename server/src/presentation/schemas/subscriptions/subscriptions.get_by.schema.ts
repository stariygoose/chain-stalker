import Joi from "joi";

export const getBySchema = Joi.alternatives().try(
  Joi.object({
    id: Joi.string().required(),
  }),

  Joi.object({
    type: Joi.string().required(),
    slug: Joi.string().required(),
  }),

  Joi.object({
    type: Joi.string().required(),
    symbol: Joi.string().required(),
  }),
);
