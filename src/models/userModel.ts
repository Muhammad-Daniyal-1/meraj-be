import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  password: string;
  role: string;
  isActive: boolean;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User"],
      default: "User",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
