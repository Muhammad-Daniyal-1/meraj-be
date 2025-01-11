import mongoose, { Schema, Document } from "mongoose";

export interface Providers extends Document {
  userId: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const providersSchema: Schema = new Schema(
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
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export const Providers = mongoose.model<Providers>(
  "Providers",
  providersSchema
);
