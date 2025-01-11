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

export const getLedger = async (req: Request<{}, {}, {}, LedgerQueryParams>, res: Response) => {
  try {
    const { entityId, startDate, endDate } = req.query;
    
    if (!entityId) {
      return res.status(400).json({
        success: false,
        error: "entityId is required"
      });
    }

    const query: any = { 
      entityId: new mongoose.Types.ObjectId(entityId) 
    };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const ledgerEntries = await Ledger.find(query)
      .sort({ date: 1 })
      .populate('ticketId');

    res.status(200).json({
      success: true,
      data: ledgerEntries
    });
  } catch (error) {
    console.error("Error getting ledger:", error);
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
