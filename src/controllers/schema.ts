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
  ticketNumber: Joi.string().optional().allow(""),
  airlineCode: Joi.string().optional().allow(""),
  ticketNumberWithoutPrefix: Joi.string().optional().allow(""),
  issueDate: Joi.date().iso().optional().allow(""),
  departureDate: Joi.date().iso().optional().allow(""),
  returnDate: Joi.date().iso().optional().allow(""),
  departure: Joi.string().optional().allow(""),
  destination: Joi.string().optional().allow(""),
  pnr: Joi.string().optional().allow(""),
  providerCost: Joi.when("operationType", {
    is: Joi.string().valid("Refund", "Re-Issue"),
    then: Joi.number()
      .messages({
        "number.base": "Provider Cost must be a number.",
      })
      .allow(""), // allow negative for refund/re-issue
    otherwise: Joi.number()
      .min(0)
      .messages({
        "number.base": "Provider Cost must be a number.",
        "number.min": "Provider Cost must be a non-negative number.",
      })
      .allow(""),
  }),

  consumerCost: Joi.when("operationType", {
    is: Joi.string().valid("Refund", "Re-Issue"),
    then: Joi.number()
      .messages({
        "number.base": "Consumer Cost must be a number.",
      })
      .allow(""),
    otherwise: Joi.number()
      .min(0)
      .messages({
        "number.base": "Consumer Cost must be a number.",
        "number.min": "Consumer Cost must be a non-negative number.",
      })
      .allow(""),
  }),
  profit: Joi.number()
    .optional()
    .messages({
      "number.base": "Profit must be a number.",
    })
    .allow(""),
  clientPaymentMethod: Joi.string().optional().allow(""),
  paymentToProvider: Joi.string().optional().allow(""),
  segment: Joi.string().optional().allow(""),

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
  hotelName: Joi.string().optional().allow(null, ""),

  // Re-Issue/Refund fields
  providerFee: Joi.number().min(0).optional(),
  consumerFee: Joi.number().min(0).optional(),
  providerPaymentDate: Joi.date().iso().optional(),
  clientPaymentDate: Joi.date().iso().optional(),
})
  // Custom validation based on operationType.
  .custom((value, helpers) => {
    const { operationType } = value;

    // 1) If Re-Issue/Refund, only require fee fields
    if (["Re-Issue", "Refund"].includes(operationType)) {
      const requiredFeeFields = ["providerFee", "consumerFee"];
      for (const field of requiredFeeFields) {
        if (value[field] == null) {
          return helpers.message(
            `${field} is required for Re-Issue/Refund ops.` as any
          );
        }
      }
      return value; // STOP: do not fall through to hotel or flight checks
    }

    // 2) If Hotel/Umrah, require hotel fields
    else if (["Hotel", "Umrah"].includes(operationType)) {
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
            `${field} is required for Hotel/Umrah ops.` as any
          );
        }
      }
      return value; // STOP
    }

    // 3) Otherwise, treat as flight
    else {
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
      return value;
    }
  });
