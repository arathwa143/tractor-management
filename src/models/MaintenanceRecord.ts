import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenanceRecord extends Document {
  businessId: mongoose.Types.ObjectId;
  tractorName: string; // Simplified for Phase 2 (can be linked to Tractor model later)
  serviceDate: Date;
  meterHours: number;
  serviceType: string; // e.g., "Engine Oil", "Filter Change", "Tyre", "Repair"
  description: string;
  partsCostPaise: number;
  laborCostPaise: number;
  nextServiceDate?: Date;
  nextServiceMeterHours?: number;
  status: "scheduled" | "completed";
}

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    tractorName: { type: String, required: true },
    serviceDate: { type: Date, required: true },
    meterHours: { type: Number, required: true },
    serviceType: { type: String, required: true },
    description: { type: String, required: true },
    partsCostPaise: { type: Number, default: 0 },
    laborCostPaise: { type: Number, default: 0 },
    nextServiceDate: { type: Date },
    nextServiceMeterHours: { type: Number },
    status: { type: String, enum: ["scheduled", "completed"], default: "completed" },
  },
  { timestamps: true }
);

MaintenanceRecordSchema.index({ businessId: 1, serviceDate: -1 });
MaintenanceRecordSchema.index({ businessId: 1, nextServiceMeterHours: 1 });

export default mongoose.models.MaintenanceRecord || mongoose.model<IMaintenanceRecord>("MaintenanceRecord", MaintenanceRecordSchema);