import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  businessId: mongoose.Types.ObjectId;
  transactionNumber: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amountPaise: number;
  paymentMethod: "cash" | "upi" | "bank" | "other";
  account: string;
  farmerId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  expenseScope: "business" | "personal";
  transactionDate: Date;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  status: "posted" | "void";
}

const TransactionSchema = new Schema<ITransaction>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    transactionNumber: { type: String, required: true },
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
    category: { type: String, required: true }, // e.g., "diesel", "farmer_payment", "driver_wages"
    amountPaise: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "upi", "bank", "other"], required: true },
    account: { type: String, required: true }, // e.g., "Main Cash Box", "HDFC Bank"
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer" },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    expenseScope: { type: String, enum: ["business", "personal"], default: "business" },
    transactionDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["posted", "void"], default: "posted" },
  },
  { timestamps: true }
);

TransactionSchema.index({ businessId: 1, transactionDate: -1 });
TransactionSchema.index({ businessId: 1, category: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);