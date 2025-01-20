import mongoose, { Schema, Document } from "mongoose";

export interface Payment extends Document {
  entityId: string; // ID of agent or client
  entityType: string; // "agent" or "client"
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  referenceNumber: string;
  description: string;
}

const paymentSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Agents", "Tickets"],
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    referenceNumber: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<Payment>("Payment", paymentSchema);
