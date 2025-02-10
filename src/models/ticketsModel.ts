import mongoose, { Schema, Document } from "mongoose";

export interface Ticket extends Document {
  user: mongoose.Types.ObjectId;
  airlineCode: string;
  ticketNumberWithoutPrefix: string;
  ticketNumber: string;
  passengerName: string;
  provider: mongoose.Types.ObjectId;
  agent?: mongoose.Types.ObjectId;
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
  reference?: string;
  clientPaymentMethod: string;
  paymentToProvider: string;
  segment: string;
  furtherDescription?: string;
  paymentType: string;
  // Fields for Hotel/Umrah operations
  checkInDate?: Date;
  checkOutDate?: Date;
  hotelName?: string;
  // Fields for Re-Issue/Refund operations
  providerFee?: number;
  consumerFee?: number;
  providerPaymentDate?: Date;
  clientPaymentDate?: Date;
}

const ticketSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    airlineCode: { type: String },
    ticketNumberWithoutPrefix: { type: String },
    ticketNumber: { type: String },
    passengerName: { type: String },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Providers",
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agents",
    },
    operationType: { type: String, required: true },
    issueDate: { type: Date },
    departureDate: { type: Date },
    returnDate: { type: Date },
    departure: { type: String },
    destination: { type: String },
    pnr: { type: String },
    providerCost: { type: Number },
    consumerCost: { type: Number },
    profit: { type: Number },
    reference: { type: String },
    clientPaymentMethod: { type: String },
    paymentToProvider: { type: String },
    segment: { type: String },
    furtherDescription: { type: String },
    paymentType: { type: String },
    // Hotel/Umrah fields
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    hotelName: { type: String },
    // Re-Issue/Refund fields
    providerFee: { type: Number },
    consumerFee: { type: Number },
    providerPaymentDate: { type: Date },
    clientPaymentDate: { type: Date },
  },
  { timestamps: true }
);

/**
 * Create a partial unique index on ticketNumber so that uniqueness is enforced
 * only for ticket numbers that are NOT all zeros.
 */
ticketSchema.index(
  { ticketNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ticketNumber: { $nin: ["0000000000000", "0000000000000000"] },
    },
  }
);

export const Tickets = mongoose.model<Ticket>("Tickets", ticketSchema);
