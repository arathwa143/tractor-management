import mongoose, { Schema, Document } from "mongoose";

export interface IDieselLog extends Document {
  businessId: mongoose.Types.ObjectId;
  tractorId?: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  type: "purchase" | "usage" | "adjustment";
  liters: number;
  pricePerLiterPaise?: number;
  totalCostPaise?: number;
  startMeterHours?: number;
  endMeterHours?: number;
  loggedAt: Date;
  notes?: string;
}

const DieselLogSchema = new Schema<IDieselLog>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    tractorId: { type: Schema.Types.ObjectId, ref: "Tractor" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    type: { type: String, enum: ["purchase", "usage", "adjustment"], required: true },
    liters: { type: Number, required: true },
    pricePerLiterPaise: { type: Number },
    totalCostPaise: { type: Number },
    startMeterHours: { type: Number },
    endMeterHours: { type: Number },
    loggedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

DieselLogSchema.index({ businessId: 1, loggedAt: -1 });

export default mongoose.models.DieselLog || mongoose.model<IDieselLog>("DieselLog", DieselLogSchema);