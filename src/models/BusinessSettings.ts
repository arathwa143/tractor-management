import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessSettings extends Document {
  businessId: mongoose.Types.ObjectId;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  // Unit Conversions (Configurable as per PRD)
  bighaToAcreConversion: number; // e.g., 1 Bigha = 0.625 Acres (varies by region in Gujarat)
  currency: string;
}

const BusinessSettingsSchema = new Schema<IBusinessSettings>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, unique: true },
    businessName: { type: String, default: "TractorPro Services" },
    ownerName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bighaToAcreConversion: { type: Number, default: 0.625 }, // Default standard conversion
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

export default mongoose.models.BusinessSettings || mongoose.model<IBusinessSettings>("BusinessSettings", BusinessSettingsSchema);