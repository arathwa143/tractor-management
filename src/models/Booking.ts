import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  businessId: mongoose.Types.ObjectId;
  bookingNumber: string;
  farmerId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  serviceType: "Rotavator" | "Palava" | "Shredder" | "Mulcher" | "Disc Harrow";
  village: string;
  tractorId?: mongoose.Types.ObjectId; // Optional for now
  driverId?: mongoose.Types.ObjectId;  // Optional for now
  status: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

const BookingSchema = new Schema<IBooking>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    bookingNumber: { type: String, required: true, unique: true },
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true },
    scheduledAt: { type: Date, required: true },
    serviceType: { 
      type: String, 
      enum: ["Rotavator", "Palava", "Shredder", "Mulcher", "Disc Harrow"], 
      required: true 
    },
    village: { type: String, required: true },
    tractorId: { type: Schema.Types.ObjectId, ref: "Tractor" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    status: { 
      type: String, 
      enum: ["pending", "scheduled", "in_progress", "completed", "cancelled"], 
      default: "pending" 
    },
    notes: { type: String },
  },
  { timestamps: true }
);

BookingSchema.index({ businessId: 1, scheduledAt: -1 });

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);