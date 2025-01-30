import mongoose, { Schema, Document } from "mongoose";

export interface Agents extends Document {
  userId: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  cf: string;
}

const agentsSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    cf: { type: String },
  },
  { timestamps: true }
);

export const Agents = mongoose.model<Agents>("Agents", agentsSchema);
