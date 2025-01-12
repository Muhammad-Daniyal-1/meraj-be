import { Request, Response } from "express";
import { Ledger } from "../models/ledgerModel";
import { Payment } from "../models/paymentModel";
import mongoose from "mongoose";

interface PaymentRequestBody {
  entityId: string;
  entityType: 'Agents' | 'Client';
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  relatedTickets?: string[];
}

interface ManualLedgerEntryBody {
  entityId: string;
  entityType: 'Agents' | 'Client';
  transactionType: 'debit' | 'credit';
  amount: number;
  description: string;
  referenceNumber: string;
  date?: string;
}

interface LedgerQueryParams {
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export const createTicketLedgerEntry = async (
  entityId: mongoose.Types.ObjectId | string,
  entityType: 'Agents' | 'Client',
  ticketId: mongoose.Types.ObjectId | string,
  amount: number,
  referenceNumber: string
) => {
  try {
    // Get the current balance
    const lastEntry = await Ledger.findOne({ entityId })
      .sort({ createdAt: -1 });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    const newBalance = currentBalance + amount;

    // Create new ledger entry
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      ticketId: new mongoose.Types.ObjectId(ticketId),
      transactionType: 'debit',
      amount,
      balance: newBalance,
      description: `Ticket charge - ${referenceNumber}`,
      referenceNumber
    });

    await ledgerEntry.save();
    return ledgerEntry;
  } catch (error) {
    console.error("Error creating ledger entry:", error);
    throw error;
  }
};

export const recordPayment = async (req: Request<{}, {}, PaymentRequestBody>, res: Response) => {
  try {
    const {
      entityId,
      entityType,
      amount,
      paymentMethod,
      referenceNumber,
      description,
      relatedTickets = []
    } = req.body;

    // Get current balance
    const lastEntry = await Ledger.findOne({ entityId })
      .sort({ createdAt: -1 });

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
      relatedTickets: relatedTickets.map(id => new mongoose.Types.ObjectId(id))
    });

    // Create ledger entry for payment
    const ledgerEntry = new Ledger({
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
      transactionType: 'credit',
      amount,
      balance: newBalance,
      description: `Payment received - ${referenceNumber}`,
      referenceNumber
    });

    await Promise.all([
      payment.save(),
      ledgerEntry.save()
    ]);

    res.status(200).json({
      success: true,
      data: {
        payment,
        ledgerEntry
      }
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

export const getLedgerByEntity = async (req: Request, res: Response) => {
  try {
    // Extract query parameters and body
    const { page = "1", limit = "20", search = "" } = req.query;
    const { entityId } = req.body;

    // Validate required fields
    if (!entityId) {
      res.status(400).json({
        success: false,
        error: "entityId is required",
      });
      return;
    }

    // Convert page and limit to numbers
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Build search query
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

    // Query the database
    const ledgerEntries = await Ledger.find({ entityId, ...query })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);


    const totalLedgers = await Ledger.countDocuments({ entityId, ...query });

    // Send the response
    res.status(200).json({
      success: true,
      ledgerEntries,
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
      .populate('ticketId', 'ticketNumber passengerName');

    // Dynamically populate entityId based on entityType
    const populatedLedgers = await Promise.all(
      ledgers.map(async (ledger) => {
        const ledgerObj = ledger.toObject();

        if (ledger.entityType === 'Agents') {
          const agent = await mongoose.model('Agents').findById(ledger.entityId).select('name');
          ledgerObj.entityId = agent;
        } else if (ledger.entityType === 'Tickets') {
          console.log(ledger.entityId);
          const ticket = await mongoose.model('Tickets').findById(ledger.entityId).select('passengerName ticketNumber');
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
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};

export const createManualLedgerEntry = async (req: Request<{}, {}, ManualLedgerEntryBody>, res: Response) => {
  try {
    const {
      entityId,
      entityType,
      transactionType,
      amount,
      description,
      referenceNumber,
      date
    } = req.body;

    // Get the current balance
    const lastEntry = await Ledger.findOne({ entityId })
      .sort({ createdAt: -1 });

    const currentBalance = lastEntry ? lastEntry.balance : 0;
    // If it's a credit entry, subtract from balance, if debit add to balance
    const newBalance = transactionType === 'credit'
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
      date: date ? new Date(date) : new Date()
    });

    await ledgerEntry.save();

    res.status(200).json({
      success: true,
      data: ledgerEntry
    });
  } catch (error) {
    console.error("Error creating manual ledger entry:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
};
