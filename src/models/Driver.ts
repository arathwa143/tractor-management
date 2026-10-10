import mongoose, { Schema, Document } from "mongoose";

export interface IDriver extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  licenseNumber?: string;
  salaryType: "monthly" | "daily" | "hourly" | "per-job";
  salaryRatePaise: number;
  advanceBalancePaise: number; // Tracks money given to driver as advance
  status: "active" | "inactive";
}

const DriverSchema = new Schema<IDriver>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String },
    salaryType: { type: String, enum: ["monthly", "daily", "hourly", "per-job"], required: true },
    salaryRatePaise: { type: Number, required: true },
    advanceBalancePaise: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

DriverSchema.index({ businessId: 1, phone: 1 });

export default mongoose.models.Driver || mongoose.model<IDriver>("Driver", DriverSchema);