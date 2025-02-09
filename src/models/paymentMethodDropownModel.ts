import mongoose, { Schema, Document } from "mongoose";

export interface PaymentMethodDropdown extends Document {
  user: string;
  name: string;
  type: string;
  paymentMethodType: string;
}

const paymentMethodDropdownSchema: Schema = new Schema(
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

export const PaymentMethodDropdown = mongoose.model<PaymentMethodDropdown>(
  "PaymentMethodDropdown",
  paymentMethodDropdownSchema
);
