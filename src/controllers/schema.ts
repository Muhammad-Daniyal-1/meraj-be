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
  address: Joi.string().optional().allow(null, ""),
  cf: Joi.string().optional().allow(null, ""),
});

export const createProviderSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().optional().allow(null, ""),
  cf: Joi.string().optional().allow(null, ""),
});

export const createTicketSchema = Joi.object({
  // Ticket Number must be exactly 13 or 16 digits.

  passengerName: Joi.string().required().messages({
    "string.empty": "Client Name is required.",
    "any.required": "Client Name is required.",
  }),

  provider: Joi.string().required().messages({
    "string.empty": "Provider ID is required.",
    "any.required": "Provider ID is required.",
  }),

  // Agent is optional – it may be empty for direct customers.
  agent: Joi.string().optional().allow(null, "").messages({
    "string.empty": "Agent should be a valid ID or empty.",
  }),

  operationType: Joi.string().required().messages({
    "string.empty": "Operation Type is required.",
    "any.required": "Operation Type is required.",
  }),

  // Flight fields (conditionally required)
  ticketNumber: Joi.string().optional(),
  airlineCode: Joi.string().optional(),
  issueDate: Joi.date().iso().optional(),
  departureDate: Joi.date().iso().optional(),
  returnDate: Joi.date().iso().optional(),
  departure: Joi.string().optional(),
  destination: Joi.string().optional(),
  pnr: Joi.string().optional(),
  providerCost: Joi.number().min(0).optional().messages({
    "number.base": "Provider Cost must be a number.",
    "number.min": "Provider Cost must be a non-negative number.",
  }),
  consumerCost: Joi.number().min(0).optional().messages({
    "number.base": "Consumer Cost must be a number.",
    "number.min": "Consumer Cost must be a non-negative number.",
  }),
  profit: Joi.number().optional().messages({
    "number.base": "Profit must be a number.",
  }),
  clientPaymentMethod: Joi.string().optional(),
  paymentToProvider: Joi.string().optional(),
  segment: Joi.string().optional(),

  // Always optional fields
  reference: Joi.string().optional().allow(""),
  furtherDescription: Joi.string().optional().allow(null, ""),
  paymentType: Joi.string().required().messages({
    "string.empty": "Payment Type is required.",
    "any.required": "Payment Type is required.",
  }),

  // Hotel/Umrah fields
  checkInDate: Joi.date().iso().optional(),
  checkOutDate: Joi.date().iso().optional(),
  hotelName: Joi.string().optional(),

  // Re-Issue/Refund fields
  providerFee: Joi.number().min(0).optional(),
  consumerFee: Joi.number().min(0).optional(),
  providerPaymentDate: Joi.date().iso().optional(),
  clientPaymentDate: Joi.date().iso().optional(),
})
  // Custom validation based on operationType.
  .custom((value, helpers) => {
    const { operationType } = value;

    // For flight operations (all types except Hotel/Umrah)
    if (!["Hotel", "Umrah"].includes(operationType)) {
      const requiredFlightFields = [
        "airlineCode",
        "ticketNumber",
        "passengerName",
        "issueDate",
        "departureDate",
        "returnDate",
        "departure",
        "destination",
        "pnr",
        "providerCost",
        "consumerCost",
        "profit",
        "clientPaymentMethod",
        "paymentToProvider",
        "segment",
      ];
      for (const field of requiredFlightFields) {
        if (
          value[field] === undefined ||
          value[field] === null ||
          (typeof value[field] === "string" && value[field].trim() === "")
        ) {
          return helpers.message(
            `${field} is required for flight operations.` as any
          );
        }
      }
    }

    // For Hotel/Umrah operations
    if (["Hotel", "Umrah"].includes(operationType)) {
      const requiredHotelFields = [
        "checkInDate",
        "checkOutDate",
        "hotelName",
        "providerCost",
        "consumerCost",
        "profit",
      ];
      for (const field of requiredHotelFields) {
        if (
          value[field] === undefined ||
          value[field] === null ||
          (typeof value[field] === "string" && value[field].trim() === "")
        ) {
          return helpers.message(
            `${field} is required for Hotel/Umrah operations.` as any
          );
        }
      }
    }

    // For Re-Issue/Refund operations
    if (["Re-Issue", "Refund"].includes(operationType)) {
      const requiredFeeFields = ["providerFee", "consumerFee"];
      for (const field of requiredFeeFields) {
        if (value[field] === undefined || value[field] === null) {
          return helpers.message(
            `${field} is required for Re-Issue/Refund operations.` as any
          );
        }
      }
    }

    return value;
  });
