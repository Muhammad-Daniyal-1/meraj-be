import { Request, Response } from "express";
import { Ledger } from "../models/ledgerModel";
import { Payment } from "../models/paymentModel";
import mongoose from "mongoose";
import {
  LedgerQueryParams,
  PaymentRequestBody,
  ManualLedgerEntryBody,
} from "../types";

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

export const createLedgerEntryWithType = async (
  entityId: mongoose.Types.ObjectId | string,
  entityType: "Agents" | "Tickets",
  ticketId: mongoose.Types.ObjectId | string,
  amount: number,
  referenceNumber: string,
  description: string,
  transactionType: "debit" | "credit" | "no-effect" = "debit"
) => {
  try {
    // Get the current balance
    const lastEntry = await Ledger.findOne({ entityId }).sort({
      createdAt: -1,
    });

    const currentBalance = lastEntry ? lastEntry.balance : 0;

    // Only adjust balance for debit/credit transactions, not for no-effect
    const newBalance =
      transactionType === "no-effect"
        ? currentBalance
        : transactionType === "debit"
        ? currentBalance + amount
        : currentBalance - amount;

    // Create new ledger entry
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      transactionType,
      amount,
      balance: newBalance,
      description,
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
      paymentDate,
    } = req.body;

    const user = (req as any).userId;

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
      paymentDate,
      user,
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
      date: paymentDate,
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
      limit = "20",
      startDate,
      endDate,
    } = req.query as LedgerQueryParams;
    const { entityId } = req.params;

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

          ledgerObj.entityId = agent || { name: "Unknown Agent" }; // Handle null case
        } else if (ledger.entityType === "Tickets") {
          const ticket = await mongoose
            .model("Tickets")
            .findById(ledger.entityId)
            .select("ticketNumber passengerName")
            .lean();

          ledgerObj.entityId = ticket || {
            ticketNumber: "Unknown",
            passengerName: "Unknown",
          }; // Handle null case
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

// export const getAllPayments = async (req: Request, res: Response) => {
//   try {
//     const { page = 1, limit = 20, search = "" } = req.query;

//     const pageNumber = parseInt(page as string, 10);
//     const limitNumber = parseInt(limit as string, 10);
//     const user = (req as any).userId;

//     // Query for search functionality
//     const searchQuery = search
//       ? {
//           $or: [
//             { id: { $regex: search, $options: "i" } },
//             { description: { $regex: search, $options: "i" } },
//             // { amount: { $regex: search, $options: "i" } },
//             { status: { $regex: search, $options: "i" } },
//           ],
//         }
//       : {};

//     // Role-based query adjustment
//     const roleQuery = user.role === "admin" ? {} : { createdBy: user._id };

//     // Combined query
//     const query = { ...searchQuery, ...roleQuery };

//     // Fetching payments with pagination and search query
//     const payments = await Payment.find(query)
//       .sort({ createdAt: -1 })
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber)
//       .lean()
//       .populate("user", "name username");

//     // Populate the name or passengerName based on entityType
//     const populatedPayments = await Promise.all(
//       payments.map(async (payment) => {
//         if (payment.entityType === "Agents") {
//           const agent = await mongoose
//             .model("Agents")
//             .findById(payment.entityId)
//             .select("name");
//           return { ...payment, name: agent?.name || null };
//         } else if (payment.entityType === "Tickets") {
//           const ticket = await mongoose
//             .model("Tickets")
//             .findById(payment.entityId)
//             .select("passengerName");
//           return { ...payment, name: ticket?.passengerName || null };
//         }
//         return payment;
//       })
//     );

//     // Total count for pagination
//     const totalPayments = await Payment.countDocuments(query);

//     res.json({
//       success: true,
//       message: "Payments fetched successfully",
//       payments: populatedPayments,
//       pagination: {
//         currentPage: pageNumber,
//         totalPages: Math.ceil(totalPayments / limitNumber),
//         totalPayments,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching payments:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch payments",
//       error: error instanceof Error ? error.message : "Internal Server Error",
//     });
//   }
// };

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const user = (req as any).userId;

    // Base query
    const query: any = {};

    // Role-based query adjustment
    if (user.role !== "admin") {
      query.createdBy = user._id;
    }

    // Search query (username, agent name, passenger name, description)
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { paymentMethod: { $regex: search, $options: "i" } },
      ];

      // Dynamically add entity-specific searches
      const agents = await mongoose
        .model("Agents")
        .find({ name: { $regex: search, $options: "i" } })
        .select("_id");
      const tickets = await mongoose
        .model("Tickets")
        .find({ passengerName: { $regex: search, $options: "i" } })
        .select("_id");
      const users = await mongoose
        .model("User")
        .find({ name: { $regex: search, $options: "i" } })
        .select("_id");

      if (agents.length > 0 || tickets.length > 0 || users.length > 0) {
        query.$or.push(
          { entityId: { $in: agents.map((agent: any) => agent._id) } },
          { entityId: { $in: tickets.map((ticket: any) => ticket._id) } },
          { entityId: { $in: users.map((user: any) => user._id) } }
        );
      }
    }

    // Amount filtering
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount as string);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount as string);
    }

    // Date range filtering
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate as string);
      if (endDate) query.paymentDate.$lte = new Date(endDate as string);
    }

    // Fetch payments
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean()
      .populate("user", "name username");

    // Populate agent or passenger names
    const populatedPayments = await Promise.all(
      payments.map(async (payment) => {
        if (payment.entityType === "Agents") {
          const agent = await mongoose
            .model("Agents")
            .findById(payment.entityId)
            .select("name");
          return { ...payment, name: agent?.name || null };
        } else if (payment.entityType === "Tickets") {
          const ticket = await mongoose
            .model("Tickets")
            .findById(payment.entityId)
            .select("passengerName");
          return { ...payment, name: ticket?.passengerName || null };
        }
        return payment;
      })
    );

    // Total count for pagination
    const totalPayments = await Payment.countDocuments(query);

    res.json({
      success: true,
      message: "Payments fetched successfully",
      payments: populatedPayments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalPayments / limitNumber),
        totalPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};
