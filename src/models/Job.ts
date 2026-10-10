import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  businessId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  tractorId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  serviceType: "Rotavator" | "Palava" | "Shredder" | "Mulcher" | "Disc Harrow";
  billingMethod: "area" | "hourly" | "fixed";
  area?: number;
  areaUnit?: "bigha" | "acre" | "hectare";
  hoursWorked?: number;
  startMeterHours: number;
  endMeterHours: number;
  ratePaise: number;
  additionalChargesPaise: number;
  discountPaise: number;
  totalAmountPaise: number;
  completedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true },
    tractorId: { type: Schema.Types.ObjectId, ref: "Tractor", required: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    serviceType: { 
      type: String, 
      enum: ["Rotavator", "Palava", "Shredder", "Mulcher", "Disc Harrow"], 
      required: true 
    },
    billingMethod: { type: String, enum: ["area", "hourly", "fixed"], required: true },
    area: { type: Number },
    areaUnit: { type: String, enum: ["bigha", "acre", "hectare"] },
    hoursWorked: { type: Number },
    startMeterHours: { type: Number, required: true },
    endMeterHours: { type: Number, required: true },
    ratePaise: { type: Number, required: true },
    additionalChargesPaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    totalAmountPaise: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

JobSchema.index({ businessId: 1, completedAt: -1 });
JobSchema.index({ businessId: 1, farmerId: 1 });

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);