import mongoose, { Schema, Document } from "mongoose";

export interface Ticket extends Document {
  userId: string;
  ticketNumber: string;
  clientName: string;
  providerId: string;
  agent: string;
  operationType: string;
  issueDate: string;
  departureDate: string;
  returnDate: string;
  departure: string;
  destination: string;
  pnr: string;
  providerCost: number;
  consumerCost: number;
  profit: number;
  reference: string;
  clientPaymentMethod: string;
  paymentToProvider: string;
  segment: string;
  furtherDescription?: string;
}

const ticketSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketNumber: { type: String, required: true },
    clientName: { type: String, required: true },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Providers",
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agents",
      required: false,
    },
    operationType: { type: String, required: true },
    issueDate: { type: String, required: true },
    departureDate: { type: String, required: true },
    returnDate: { type: String, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    pnr: { type: String, required: true },
    providerCost: { type: Number, required: true, min: 0 },
    consumerCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    reference: { type: String, required: true },
    clientPaymentMethod: { type: String, required: true },
    paymentToProvider: { type: String, required: true },
    segment: { type: String, required: true },
    furtherDescription: { type: String },
  },
  { timestamps: true }
);

export const Tickets = mongoose.model<Ticket>("Tickets", ticketSchema);
