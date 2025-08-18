import Joi from "joi";

export const telegramLoginSchema = Joi.object({
  id: Joi.string().required(),
  first_name: Joi.string().optional(),
  username: Joi.string().optional(),
  photo_url: Joi.string().optional(),
  auth_date: Joi.string().required(),
  hash: Joi.string().required(),
});
