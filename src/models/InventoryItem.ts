import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryItem extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  category: "Spare Part" | "Lubricant" | "Tool" | "Other";
  unit: string; // e.g., "Piece", "Liter", "Kg"
  quantityOnHand: number;
  reorderLevel: number;
  purchasePricePaise: number;
  isActive: boolean;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, enum: ["Spare Part", "Lubricant", "Tool", "Other"], required: true },
    unit: { type: String, required: true },
    quantityOnHand: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    purchasePricePaise: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.InventoryItem || mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);