import { Request, Response } from "express";
import { Ledger } from "../models/ledgerModel";
import { Payment } from "../models/paymentModel";
import mongoose from "mongoose";

interface PaymentRequestBody {
  entityId: string;
  entityType: "Agents" | "Client";
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  relatedTickets?: string[];
}

interface ManualLedgerEntryBody {
  entityId: string;
  entityType: "Agents" | "Client";
  transactionType: "debit" | "credit";
  amount: number;
  description: string;
  referenceNumber: string;
  date?: string;
}

interface LedgerQueryParams {
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export const createTicketLedgerEntry = async (
  entityId: mongoose.Types.ObjectId | string,
  entityType: "Agents" | "Tickets",
  ticketId: mongoose.Types.ObjectId | string,
  amount: number,
  referenceNumber: string
) => {
  try {
    // Get the current balance
    const lastEntry = await Ledger.findOne({ entityId }).sort({
      createdAt: -1,
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    const newBalance = currentBalance + amount;

    // Create new ledger entry
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      transactionType: "debit",
      amount,
      balance: newBalance,
      description: `Ticket charge - ${referenceNumber}`,
      referenceNumber,
    });

    await ledgerEntry.save();
    return ledgerEntry;
  } catch (error) {
    console.error("Error creating ledger entry:", error);
    throw error;
  }
};

export const recordPayment = async (
  req: Request<{}, {}, PaymentRequestBody>,
  res: Response
) => {
  try {
    const {
      entityId,
      entityType,
      amount,
      paymentMethod,
      referenceNumber,
      description,
      relatedTickets = [],
    } = req.body;

    // Get current balance
    const lastEntry = await Ledger.findOne({ entityId }).sort({
      createdAt: -1,
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    const newBalance = currentBalance - amount;

    // Create payment record
    const payment = new Payment({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      amount,
      paymentMethod,
      referenceNumber,
      description,
      relatedTickets: relatedTickets.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    });

    // Create ledger entry for payment
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      transactionType: "credit",
      amount,
      balance: newBalance,
      description: `Payment received - ${referenceNumber}`,
      referenceNumber,
    });

    await Promise.all([payment.save(), ledgerEntry.save()]);

    res.status(200).json({
      success: true,
      data: {
        payment,
        ledgerEntry,
      },
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getLedgerByEntity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract query parameters and path parameters
    const {
      page = "1",
      limit = "10",
      startDate,
      endDate,
    } = req.query as LedgerQueryParams;
    const { entityId } = req.params;
    console.log("Received Query Parameters:", {
      entityId,
      page,
      limit,
      startDate,
      endDate,
    });

    // Validate required fields
    if (!entityId) {
      res.status(400).json({
        success: false,
        error: "entityId is required",
      });
      return;
    }

    // Convert page and limit to numbers with validation
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const limitNumber = Math.max(parseInt(limit, 10), 1);

    // Build date range query
    // Build date range query
    let dateQuery: Record<string, any> = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {}; // Use createdAt instead of date for consistency
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Set to start of day
        if (!isNaN(start.getTime())) {
          dateQuery.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        if (!isNaN(end.getTime())) {
          dateQuery.createdAt.$lte = end;
        }
      }
    }

    // Combine entityId with date range query
    const finalQuery =
      startDate || endDate ? { entityId, ...dateQuery } : { entityId };

    console.log("Final MongoDB Query:", finalQuery);

    // Query the database
    const ledgerEntries = await Ledger.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("ticketId", "ticketNumber passengerName");

    // Populate entityId based on entityType
    const populatedLedgers = await Promise.all(
      ledgerEntries.map(async (ledger) => {
        const ledgerObj = ledger.toObject();

        if (ledger.entityType === "Agents") {
          const agent = await mongoose
            .model("Agents")
            .findById(ledger.entityId)
            .select("name")
            .lean();
          // ledgerObj.entityId = agent;
        } else if (ledger.entityType === "Tickets") {
          const ticket = await mongoose
            .model("Tickets")
            .findById(ledger.entityId)
            .select("ticketNumber passengerName")
            .lean();
          // ledgerObj.entityId = ticket;
        }

        return ledgerObj;
      })
    );

    // Count total documents matching the query
    const totalLedgers = await Ledger.countDocuments(finalQuery);

    // Send the response
    res.status(200).json({
      success: true,
      ledgers: populatedLedgers,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalLedgers / limitNumber),
        totalItems: totalLedgers,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error getting ledger:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
export const getLedgers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Query for search functionality
    const query = search
      ? {
          $or: [
            { entityId: { $regex: search, $options: "i" } },
            { entityType: { $regex: search, $options: "i" } },
            { ticketId: { $regex: search, $options: "i" } },
            { transactionType: { $regex: search, $options: "i" } },
            { amount: { $regex: search, $options: "i" } },
            { balance: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { date: { $regex: search, $options: "i" } },
            { referenceNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetching ledgers with pagination and search query
    const ledgers = await Ledger.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("ticketId", "ticketNumber passengerName");

    // Dynamically populate entityId based on entityType
    const populatedLedgers = await Promise.all(
      ledgers.map(async (ledger) => {
        const ledgerObj = ledger.toObject();

        if (ledger.entityType === "Agents") {
          const agent = await mongoose
            .model("Agents")
            .findById(ledger.entityId)
            .select("name");
          ledgerObj.entityId = agent;
        } else if (ledger.entityType === "Tickets") {
          console.log(ledger.entityId);
          const ticket = await mongoose
            .model("Tickets")
            .findById(ledger.entityId)
            .select("passengerName ticketNumber");
          ledgerObj.entityId = ticket;
        }
        return ledgerObj;
      })
    );

    // Total count for pagination
    const totalLedgers = await Ledger.countDocuments(query);

    res.status(200).json({
      success: true,
      ledgers: populatedLedgers,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalLedgers / limitNumber),
        totalItems: totalLedgers,
        pageSize: limitNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const getLedgerSummary = async (req: Request, res: Response) => {
  try {
    // Get summaries for both entity types
    const summaries = await Ledger.aggregate([
      // Group by entityId and entityType to get latest entry
      {
        $group: {
          _id: {
            entityId: "$entityId",
            entityType: "$entityType",
          },
          latestEntry: { $last: "$_id" },
          balance: { $last: "$balance" },
        },
      },
      // Lookup agent details
      {
        $lookup: {
          from: "agents",
          localField: "_id.entityId",
          foreignField: "_id",
          as: "agentDetails",
        },
      },
      // Lookup client details
      {
        $lookup: {
          from: "tickets",
          localField: "_id.entityId",
          foreignField: "_id",
          as: "ticketDetails",
        },
      },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          entityId: "$_id.entityId",
          entityType: "$_id.entityType",
          balance: 1,
          name: {
            $cond: {
              if: { $eq: ["$_id.entityType", "Agents"] },
              then: { $arrayElemAt: ["$agentDetails.name", 0] },
              else: { $arrayElemAt: ["$ticketDetails.passengerName", 0] },
            },
          },
        },
      },
      // Sort by entityType and then by name
      {
        $sort: {
          "_id.entityType": 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      summaries,
    });
  } catch (error) {
    console.error("Error in getLedgerSummary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ledger summaries",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createManualLedgerEntry = async (
  req: Request<{}, {}, ManualLedgerEntryBody>,
  res: Response
) => {
  try {
    const {
      entityId,
      entityType,
      transactionType,
      amount,
      description,
      referenceNumber,
      date,
    } = req.body;

    // Get the current balance
    const lastEntry = await Ledger.findOne({ entityId }).sort({
      createdAt: -1,
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    // If it's a credit entry, subtract from balance, if debit add to balance
    const newBalance =
      transactionType === "credit"
        ? currentBalance - amount
        : currentBalance + amount;

    // Create new ledger entry
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      transactionType,
      amount,
      balance: newBalance,
      description,
      referenceNumber,
      date: date ? new Date(date) : new Date(),
    });

    await ledgerEntry.save();

    res.status(200).json({
      success: true,
      data: ledgerEntry,
    });
  } catch (error) {
    console.error("Error creating manual ledger entry:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
