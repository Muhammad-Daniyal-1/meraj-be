import mongoose, { Schema, Document } from "mongoose";

export interface Ticket extends Document {
  user: mongoose.Types.ObjectId;
  airlineCode: string;
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
    airlineCode: { type: String, required: true },
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
    },
    operationType: { type: String, required: true },
    issueDate: { type: Date, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    pnr: { type: String, required: true },
    providerCost: { type: Number, required: true },
    consumerCost: { type: Number, required: true },
    profit: { type: Number, required: true },
    reference: { type: String },
    clientPaymentMethod: { type: String, required: true },
    paymentToProvider: { type: String, required: true },
    segment: { type: String, required: true },
    furtherDescription: { type: String },
    paymentType: { type: String, required: true },
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
