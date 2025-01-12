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

export const createProviderSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
});

export const createTicketSchema = Joi.object({
  ticketNumber: Joi.string().required().messages({
    "string.empty": "Ticket Number is required.",
    "any.required": "Ticket Number is required.",
  }),
  passengerName: Joi.string().required().messages({
    "string.empty": "Client Name is required.",
    "any.required": "Client Name is required.",
  }),
  provider: Joi.string().required().messages({
    "string.empty": "Provider ID is required.",
    "any.required": "Provider ID is required.",
  }),
  agent: Joi.string().optional().allow(null, "").messages({
    "string.empty": "Agent should be a valid ID or empty.",
  }),
  operationType: Joi.string().required().messages({
    "string.empty": "Operation Type is required.",
    "any.required": "Operation Type is required.",
  }),
  issueDate: Joi.date().iso().required().messages({
    "date.base": "Issue Date must be a valid date.",
    "any.required": "Issue Date is required.",
  }),
  departureDate: Joi.date().iso().required().messages({
    "date.base": "Departure Date must be a valid date.",
    "any.required": "Departure Date is required.",
  }),
  returnDate: Joi.date().iso().required().messages({
    "date.base": "Return Date must be a valid date.",
    "any.required": "Return Date is required.",
  }),
  departure: Joi.string().required().messages({
    "string.empty": "Departure (City or Airport code) is required.",
    "any.required": "Departure is required.",
  }),
  destination: Joi.string().required().messages({
    "string.empty": "Destination (City or Airport code) is required.",
    "any.required": "Destination is required.",
  }),
  pnr: Joi.string().required().messages({
    "string.empty": "PNR is required.",
    "any.required": "PNR is required.",
  }),
  providerCost: Joi.number().min(0).required().messages({
    "number.base": "Provider Cost must be a number.",
    "number.min": "Provider Cost must be a non-negative number.",
    "any.required": "Provider Cost is required.",
  }),
  consumerCost: Joi.number().min(0).required().messages({
    "number.base": "Consumer Cost must be a number.",
    "number.min": "Consumer Cost must be a non-negative number.",
    "any.required": "Consumer Cost is required.",
  }),
  profit: Joi.number().required().messages({
    "number.base": "Profit must be a number.",
    "any.required": "Profit is required.",
  }),
  reference: Joi.string().optional().allow(""),
  clientPaymentMethod: Joi.string().required().messages({
    "string.empty": "Client Payment Method is required.",
    "any.required": "Client Payment Method is required.",
  }),
  paymentToProvider: Joi.string().required().messages({
    "string.empty": "Payment to Provider is required.",
    "any.required": "Payment to Provider is required.",
  }),
  segment: Joi.string().required().messages({
    "string.empty": "Segment is required.",
    "any.required": "Segment is required.",
  }),
  furtherDescription: Joi.string().optional().allow(null, "").messages({
    "string.empty": "Further Description should be a string or empty.",
  }),
});
