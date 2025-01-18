import { Request, Response } from "express";
import { Tickets } from "../models/ticketsModel";
import { createTicketSchema } from "./schema";
import { createTicketLedgerEntry } from "./ledgerController";
import mongoose from "mongoose";

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const pipeline = [];

    // Add lookups for provider and agent
    pipeline.push(
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
      }
    );

    // Add search conditions if search parameter exists
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { operationType: { $regex: search, $options: "i" } },
            { pnr: { $regex: search, $options: "i" } },
            { ticketNumber: { $regex: search, $options: "i" } },
            { issueDate: { $regex: search, $options: "i" } },
            { passengerName: { $regex: search, $options: "i" } },
            { departureDate: { $regex: search, $options: "i" } },
            { "provider.name": { $regex: search, $options: "i" } },
            { "agent.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add count facet for pagination
    pipeline.push({
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
    });

    const result = await Tickets.aggregate(pipeline as any);

    const tickets = result[0].data;
    const totalTickets = result[0].metadata[0]?.total || 0;

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
      message: "Failed to fetch tickets",
      error: error instanceof Error ? error.message : "Internal Server Error",
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

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { error, value } = createTicketSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.details });
      return;
    }

    const existingTicket = await Tickets.findOne({
      ticketNumber: value.ticketNumber,
    });

    if (existingTicket) {
      res.status(400).json({ success: false, error: "Ticket already exists" });
      return;
    }

    const user = (req as any).userId;

    const newTicket = await Tickets.create({ ...value, user });
    const populatedTicket = await Tickets.findById(newTicket._id)
      .populate("provider", "name")
      .populate("agent", "name");

    // Create ledger entry if there's an agent or if there's remaining payment
    if (value.agent || value.consumerCost > 0) {
      try {
        await createTicketLedgerEntry(
          value.agent || newTicket._id,
          value.agent ? "Agents" : "Tickets",
          // @ts-ignore
          newTicket._id,
          value.consumerCost,
          value.ticketNumber
        );
      } catch (ledgerError) {
        // If ledger creation fails, we should log it but not fail the ticket creation
        console.error("Error creating ledger entry:", ledgerError);
      }
    }

    res.json({ success: true, ticket: populatedTicket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
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
