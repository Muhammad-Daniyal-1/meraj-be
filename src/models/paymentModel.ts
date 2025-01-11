import mongoose, { Schema, Document } from "mongoose";

export interface Payment extends Document {
  entityId: string;  // ID of agent or client
  entityType: string;  // "agent" or "client"
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  referenceNumber: string;
  description: string;
  relatedTickets: string[];  // Array of ticket IDs this payment is for
}

const paymentSchema: Schema = new Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType'
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Agents', 'Client']
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    referenceNumber: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    relatedTickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket"
    }]
  },
  { timestamps: true }
);

export const Payment = mongoose.model<Payment>("Payment", paymentSchema);
