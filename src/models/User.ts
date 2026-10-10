import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  passwordHash: string;
  role: "admin" | "manager" | "driver" | "accountant";
  businessId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "driver", "accountant"], default: "manager" },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ensure unique phone per business
UserSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);