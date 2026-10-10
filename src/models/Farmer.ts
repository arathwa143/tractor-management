import mongoose, { Schema, Document } from "mongoose";

export interface IFarmer extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  village: string;
  address?: string;
  openingBalancePaise: number;
  notes?: string;
  isActive: boolean;
}

const FarmerSchema = new Schema<IFarmer>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    village: { type: String, required: true },
    address: { type: String },
    openingBalancePaise: { type: Number, default: 0 },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FarmerSchema.index({ businessId: 1, phone: 1 });
FarmerSchema.index({ businessId: 1, village: 1 });

export default mongoose.models.Farmer || mongoose.model<IFarmer>("Farmer", FarmerSchema);