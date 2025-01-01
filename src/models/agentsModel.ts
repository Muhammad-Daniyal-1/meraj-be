import mongoose, { Schema, Document } from "mongoose";

export interface Agents extends Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const agentsSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export const Agents = mongoose.model<Agents>("Agents", agentsSchema);
