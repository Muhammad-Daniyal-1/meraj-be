import mongoose, { Schema, Document } from "mongoose";

export interface Ticket extends Document {
  userId: string;
  ticketNumber: string;
  passengerName: string;
  providerId: string;
  agent: string;
  operationType: string;
  issueDate: Date;
  departureDate: Date;
  returnDate: Date;
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    provider: {
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
    issueDate: { type: Date, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    pnr: { type: String, required: true },
    providerCost: { type: Number, required: true, min: 0 },
    consumerCost: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    reference: { type: String },
    clientPaymentMethod: { type: String, required: true },
    paymentToProvider: { type: String, required: true },
    segment: { type: String, required: true },
    furtherDescription: { type: String },
  },
  { timestamps: true }
);

export const Tickets = mongoose.model<Ticket>("Tickets", ticketSchema);
