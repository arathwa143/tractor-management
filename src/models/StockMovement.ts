import mongoose, { Schema, Document } from "mongoose";

export interface IStockMovement extends Document {
  businessId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  movementType: "in" | "out";
  quantity: number;
  unitCostPaise: number;
  occurredAt: Date;
  notes?: string;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    movementType: { type: String, enum: ["in", "out"], required: true },
    quantity: { type: Number, required: true },
    unitCostPaise: { type: Number, required: true },
    occurredAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

StockMovementSchema.index({ businessId: 1, occurredAt: -1 });

export default mongoose.models.StockMovement || mongoose.model<IStockMovement>("StockMovement", StockMovementSchema);