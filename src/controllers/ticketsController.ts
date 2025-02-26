import { Request, Response } from "express";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import handlebars from "handlebars";
import { Base64Encode } from "base64-stream";
import stream from "stream";
import { Tickets } from "../models/ticketsModel";
import { createTicketSchema } from "./schema";
import {
  createLedgerEntryWithType,
  createTicketLedgerEntry,
} from "./ledgerController";
import { formatDateToLocal } from "../utils/logger";
import { PaymentMethodDropdown } from "../models/paymentMethodDropownModel";
import { handleLedgerDifference } from "../helpers/handleLedgerDifference";

// export const getTickets = async (req: Request, res: Response) => {
//   try {
//     const { page = 1, limit = 20, search = "" } = req.query;

//     const pageNumber = parseInt(page as string, 10);
//     const limitNumber = parseInt(limit as string, 10);

//     const pipeline = [];

//     // Add lookups for provider and agent
//     pipeline.push(
//       {
//         $lookup: {
//           from: "providers",
//           localField: "provider",
//           foreignField: "_id",
//           as: "providerData",
//         },
//       },
//       {
//         $lookup: {
//           from: "agents",
//           localField: "agent",
//           foreignField: "_id",
//           as: "agentData",
//         },
//       },
//       {
//         $addFields: {
//           provider: {
//             $cond: {
//               if: { $gt: [{ $size: "$providerData" }, 0] },
//               then: {
//                 _id: { $arrayElemAt: ["$providerData._id", 0] },
//                 name: { $arrayElemAt: ["$providerData.name", 0] },
//               },
//               else: null,
//             },
//           },
//           agent: {
//             $cond: {
//               if: { $gt: [{ $size: "$agentData" }, 0] },
//               then: {
//                 _id: { $arrayElemAt: ["$agentData._id", 0] },
//                 name: { $arrayElemAt: ["$agentData.name", 0] },
//               },
//               else: null,
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           providerData: 0,
//           agentData: 0,
//         },
//       }
//     );

//     // Add search conditions if search parameter exists
//     if (search) {
//       pipeline.push({
//         $match: {
//           $or: [
//             { operationType: { $regex: search, $options: "i" } },
//             { pnr: { $regex: search, $options: "i" } },
//             { ticketNumber: { $regex: search, $options: "i" } },
//             { issueDate: { $regex: search, $options: "i" } },
//             { passengerName: { $regex: search, $options: "i" } },
//             { departureDate: { $regex: search, $options: "i" } },
//             { "provider.name": { $regex: search, $options: "i" } },
//             { "agent.name": { $regex: search, $options: "i" } },
//           ],
//         },
//       });
//     }

//     // Add count facet for pagination
//     pipeline.push({
//       $facet: {
//         metadata: [{ $count: "total" }],
//         data: [
//           { $sort: { createdAt: -1 } },
//           { $skip: (pageNumber - 1) * limitNumber },
//           { $limit: limitNumber },
//           {
//             $project: {
//               _id: 1,
//               ticketNumber: 1,
//               passengerName: 1,
//               operationType: 1,
//               issueDate: 1,
//               departureDate: 1,
//               returnDate: 1,
//               departure: 1,
//               destination: 1,
//               pnr: 1,
//               providerCost: 1,
//               consumerCost: 1,
//               profit: 1,
//               reference: 1,
//               clientPaymentMethod: 1,
//               paymentToProvider: 1,
//               segment: 1,
//               furtherDescription: 1,
//               provider: 1,
//               agent: 1,
//               createdAt: 1,
//               updatedAt: 1,
//             },
//           },
//         ],
//       },
//     });

//     const result = await Tickets.aggregate(pipeline as any);

//     const tickets = result[0].data;
//     const totalTickets = result[0].metadata[0]?.total || 0;

//     res.json({
//       success: true,
//       message: "Tickets fetched successfully",
//       tickets,
//       pagination: {
//         currentPage: pageNumber,
//         totalPages: Math.ceil(totalTickets / limitNumber),
//         totalTickets,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch tickets",
//       error: error instanceof Error ? error.message : "Internal Server Error",
//     });
//   }
// };

export const getTickets = async (req: Request, res: Response) => {
  try {
    // Extract query params
    const {
      page = "1",
      limit = "20",
      minDate,
      maxDate,
      minAmount,
      maxAmount,
      agent,
      provider,
      airlineCode,
      query = "",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Build match conditions dynamically
    const matchConditions: any = {};

    // Convert and apply date range filter
    if (minDate || maxDate) {
      matchConditions.issueDate = {};
      if (minDate) matchConditions.issueDate.$gte = new Date(minDate as string);
      if (maxDate) matchConditions.issueDate.$lte = new Date(maxDate as string);
    }

    // Convert and apply profit range filter
    if (minAmount || maxAmount) {
      matchConditions.profit = {};
      if (minAmount) matchConditions.profit.$gte = Number(minAmount);
      if (maxAmount) matchConditions.profit.$lte = Number(maxAmount);
    }

    // Ensure agent is a valid ObjectId
    if (agent && mongoose.Types.ObjectId.isValid(agent as string)) {
      matchConditions.agent = new mongoose.Types.ObjectId(agent as string);
    }

    // Ensure provider is a valid ObjectId
    if (provider && mongoose.Types.ObjectId.isValid(provider as string)) {
      matchConditions.provider = new mongoose.Types.ObjectId(
        provider as string
      );
    }

    // Ensure airlineCode is a valid string
    if (airlineCode && typeof airlineCode === "string") {
      matchConditions.airlineCode = airlineCode;
    }

    // Apply search query filter
    if (query) {
      matchConditions.$or = [
        { pnr: { $regex: query, $options: "i" } },
        { passengerName: { $regex: query, $options: "i" } },
        { ticketNumber: { $regex: query, $options: "i" } },
        { operationType: { $regex: query, $options: "i" } },
      ];
    }

    // Build the aggregation pipeline
    const pipeline: any[] = [
      // Match filters before performing lookups (optimizes performance)
      { $match: matchConditions },

      // Lookups for provider and agent
      {
        $lookup: {
          from: "providers",
          localField: "provider",
          foreignField: "_id",
          as: "providerData",
        },
      },
      {
        $lookup: {
          from: "agents",
          localField: "agent",
          foreignField: "_id",
          as: "agentData",
        },
      },
      {
        $addFields: {
          provider: {
            $cond: {
              if: { $gt: [{ $size: "$providerData" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$providerData._id", 0] },
                name: { $arrayElemAt: ["$providerData.name", 0] },
                id: { $arrayElemAt: ["$providerData.id", 0] },
              },
              else: null,
            },
          },
          agent: {
            $cond: {
              if: { $gt: [{ $size: "$agentData" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$agentData._id", 0] },
                name: { $arrayElemAt: ["$agentData.name", 0] },
                id: { $arrayElemAt: ["$agentData.id", 0] },
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          providerData: 0,
          agentData: 0,
        },
      },

      // Facet for pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber },
            {
              $project: {
                _id: 1,
                ticketNumber: 1,
                passengerName: 1,
                operationType: 1,
                issueDate: 1,
                departureDate: 1,
                returnDate: 1,
                departure: 1,
                destination: 1,
                pnr: 1,
                providerCost: 1,
                consumerCost: 1,
                profit: 1,
                reference: 1,
                clientPaymentMethod: 1,
                paymentToProvider: 1,
                segment: 1,
                furtherDescription: 1,
                provider: 1,
                agent: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ];

    // Run aggregation
    const result = await Tickets.aggregate(pipeline);

    // Extract data
    const tickets = result[0]?.data || [];
    const totalTickets = result[0]?.metadata[0]?.total || 0;

    res.json({
      success: true,
      message: "Tickets fetched successfully",
      tickets,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTickets / limitNumber),
        totalTickets,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Tickets.findById(id)
      .populate("provider", "name")
      .populate("agent", "name");

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    res.json({ success: true, ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createTicketx = async (req: Request, res: Response) => {
  try {
    // Validate the request body using Joi
    console.log(req.body);
    const { error, value } = createTicketSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({ success: false, error: error.details });
      return;
    }

    // Normalize ticket number by trimming whitespace.
    const normalizedTicketNumber = value.ticketNumber.trim();
    value.ticketNumber = normalizedTicketNumber; // update the value

    // If the ticket number is NOT an all-zeros value, check for duplicates.
    if (
      (normalizedTicketNumber !== "0000000000000" &&
        normalizedTicketNumber !== "0000000000000000") ||
      req.body.operationType !== "Refund"
    ) {
      const existingTicket = await Tickets.findOne({
        ticketNumber: normalizedTicketNumber,
      });
      if (existingTicket) {
        res
          .status(400)
          .json({ success: false, message: "Ticket already exists" });
        return;
      }
    }

    // Retrieve the user id (assuming authentication middleware sets this)
    const user = (req as any).userId;

    // Create the new ticket document
    const newTicket = await Tickets.create({ ...value, user });
    const populatedTicket = await Tickets.findById(newTicket._id)
      .populate("provider", "name")
      .populate("agent", "name");

    // Optionally, create a ledger entry if an agent exists or if payment is partial.
    if (value.agent || (!value.agent && value.paymentType === "Partial")) {
      try {
        await createTicketLedgerEntry(
          value.agent || newTicket._id,
          value.agent ? "Agents" : "Tickets",
          newTicket._id as string,
          value.consumerCost,
          normalizedTicketNumber
        );
      } catch (ledgerError) {
        // Log ledger errors without failing the ticket creation
        console.error("Error creating ledger entry:", ledgerError);
      }
    }

    res.json({ success: true, ticket: populatedTicket });
  } catch (err) {
    console.error("Error creating ticket:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { error, value } = createTicketSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({ success: false, error: error.details });
      return;
    }

    const normalizedTicketNumber = value.ticketNumber.trim();
    value.ticketNumber = normalizedTicketNumber;

    // If the ticket number is NOT an all-zeros value or refund, check for duplicates.
    if (
      normalizedTicketNumber !== "0000000000000" &&
      normalizedTicketNumber !== "0000000000000000" &&
      value.operationType !== "Refund"
    ) {
      const existingTicket = await Tickets.findOne({
        ticketNumber: normalizedTicketNumber,
      });
      if (existingTicket) {
        res
          .status(400)
          .json({ success: false, message: "Ticket already exists" });
        return;
      }
    }

    const user = (req as any).userId;

    const newTicket = await Tickets.create({ ...value, user });
    console.log("Created ticket:", newTicket._id);
    const populatedTicket = await Tickets.findById(newTicket._id)
      .populate("provider", "name")
      .populate("agent", "name");

    try {
      // Get the payment method details to determine if it's an agent's card
      let isAgentCard = false;
      if (value.paymentToProvider) {
        const paymentMethod = await PaymentMethodDropdown.findOne({
          _id: value.paymentToProvider,
          user,
        });

        console.log("Payment method found:", paymentMethod);
        // Determine if payment is made using an agent's card
        isAgentCard = paymentMethod?.type === "Agent Card";
      }
      console.log("Is agent card:", isAgentCard);

      if (value.agent || (!value.agent && value.paymentType === "Partial")) {
        // If payment is made with agent card, mark as no-effect, otherwise debit
        const transactionType = isAgentCard ? "no-effect" : "debit";

        await createLedgerEntryWithType(
          value.agent || newTicket._id,
          value.agent ? "Agents" : "Tickets",
          newTicket._id as string,
          value.consumerCost,
          normalizedTicketNumber,
          `${value.operationType} - Price - ${normalizedTicketNumber}`,
          transactionType
        );
      }

      // Additionally for Refund/Re-issue: Handle consumer fee ledger entry with simpler condition
      if (
        (value.operationType === "Refund" ||
          value.operationType === "Re-Issue") &&
        typeof value.consumerFee === "number"
      ) {
        // Fee entries always affect the ledger balance regardless of payment method
        await createLedgerEntryWithType(
          value.agent || newTicket._id,
          value.agent ? "Agents" : "Tickets",
          newTicket._id as string,
          value.consumerFee,
          normalizedTicketNumber,
          `${value.operationType} - Fee - ${normalizedTicketNumber}`,
          "debit"
        );
      }
    } catch (ledgerError) {
      console.error("Error creating ledger entries:", ledgerError);
    }

    res.json({ success: true, ticket: populatedTicket });
  } catch (err) {
    console.error("Error creating ticket:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
};

export const updateTicketx = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTicket = await Tickets.findOne({ _id: id });
    if (!existingTicket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const user = (req as any).userId;

    const updatedTicket = await Tickets.findByIdAndUpdate(
      id,
      { ...req.body, user },
      { new: true }
    );

    const populatedTicket = await Tickets.findById(updatedTicket?._id)
      .populate("provider", "name")
      .populate("agent", "name");

    res.json({ success: true, ticket: populatedTicket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).userId;

    // 1) Fetch the old ticket
    const existingTicket = await Tickets.findById(id);
    if (!existingTicket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    // 2) Capture old consumer values
    const oldConsumerCost = existingTicket.consumerCost || 0;
    const oldConsumerFee = existingTicket.consumerFee || 0;

    // 3) Extract new consumer values from req.body (fallback to old if undefined)
    const newConsumerCost =
      typeof req.body.consumerCost === "number"
        ? req.body.consumerCost
        : oldConsumerCost;

    const newConsumerFee =
      typeof req.body.consumerFee === "number"
        ? req.body.consumerFee
        : oldConsumerFee;

    // 4) Calculate the differences
    const consumerCostDiff = newConsumerCost - oldConsumerCost;
    const consumerFeeDiff = newConsumerFee - oldConsumerFee;

    // 5) Update the ticket document in DB
    const updatedTicket = await Tickets.findByIdAndUpdate(
      id,
      { ...req.body, user },
      { new: true }
    )
      .populate("provider", "name")
      .populate("agent", "name");

    console.log({ updatedTicket: updatedTicket });

    if (updatedTicket) {
      const referenceNumber = updatedTicket.ticketNumber;
      const entityId = updatedTicket.agent
        ? updatedTicket.agent._id
        : updatedTicket._id;
      const entityType = updatedTicket.agent ? "Agents" : "Tickets";
      const ticketId = updatedTicket?._id as string;

      // Check for agent card condition using the payment method from the request body
      let isAgentCard = false;
      if (req.body.paymentToProvider) {
        const paymentMethod = await PaymentMethodDropdown.findOne({
          _id: req.body.paymentToProvider,
          user,
        });
        isAgentCard = paymentMethod?.type === "Agent Card";
      }

      console.log({
        consumerCostDiff,
        consumerFeeDiff,
        isAgentCard,
      });

      if (consumerCostDiff !== 0) {
        await handleLedgerDifference({
          difference: consumerCostDiff,
          entityId: entityId as string,
          entityType,
          ticketId,
          referenceNumber,
          descriptionPrefix: "Price",
          isAgentCard,
        });
      }

      if (consumerFeeDiff !== 0) {
        await handleLedgerDifference({
          difference: consumerFeeDiff,
          entityId: entityId as string,
          entityType,
          ticketId,
          referenceNumber,
          descriptionPrefix: "Fee",
        });
      }
    }

    res.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Tickets.findByIdAndDelete(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const generateReceiptPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await Tickets.findById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    const templatePath = path.join(
      __dirname,
      "../templates/receiptTemplate.hbs"
    );
    const templateHtml = await fs.readFile(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(templateHtml);

    const htmlContent = compiledTemplate({
      pnr: ticket.pnr,
      passengerName: ticket.passengerName,
      ticketNumber: ticket.ticketNumber,
      issueDate: formatDateToLocal(ticket.issueDate as any),
      departureDate: formatDateToLocal(ticket.departureDate as any),
      destination: ticket.destination,
      price: ticket.consumerCost,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: "A5" });
    await browser.close();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);

    const base64Stream = new Base64Encode();
    let base64Data = "";

    base64Stream.on("data", (chunk: any) => {
      base64Data += chunk;
    });

    base64Stream.on("end", () => {
      // Send the Base64 string as JSON
      res.json({
        pdf: base64Data,
        filename: `${ticket.passengerName} ${ticket.ticketNumber}.pdf`,
      });
    });

    // Pipe the PDF buffer stream into the Base64 encoder
    bufferStream.pipe(base64Stream);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Internal Server Error");
  }
};
