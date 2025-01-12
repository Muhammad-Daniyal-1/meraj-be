import mongoose, { Schema, Document } from "mongoose";

export interface Ledger extends Document {
  entityId: string;  // ID of agent or client
  entityType: string;  // "agent" or "client"
  ticketId: string;
  transactionType: string;  // "debit" or "credit"
  amount: number;
  balance: number;
  description: string;
  date: Date;
  referenceNumber: string;  // ticket number or payment reference
}

const ledgerSchema: Schema = new Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType'
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Agents', 'Tickets']
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tickets",
      required: false
    },
    transactionType: {
      type: String,
      required: true,
      enum: ['debit', 'credit']
    },
    amount: {
      type: Number,
      required: true
    },
    balance: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    referenceNumber: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Ledger = mongoose.model<Ledger>("Ledger", ledgerSchema);
