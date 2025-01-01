import Joi from "joi";

export const addUserSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("Admin", "User").required(),
  status: Joi.boolean().required(),
  permissions: Joi.array().items(Joi.string()).min(1).required(),
});

export const loginSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
});

export const createAgentSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
});
