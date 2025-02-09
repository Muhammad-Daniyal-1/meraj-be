import mongoose, { Schema, Document } from "mongoose";

export interface PaymentMethodDropown extends Document {
  user: string;
  name: string;
  type: string;
  paymentMethodType: string;
}

const paymentMethodDropownSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    type: { type: String, required: true },
    methodFor: { type: String, required: true },
  },
  { timestamps: true }
);

export const PaymentMethodDropown = mongoose.model<PaymentMethodDropown>(
  "PaymentMethodDropown",
  paymentMethodDropownSchema
);
