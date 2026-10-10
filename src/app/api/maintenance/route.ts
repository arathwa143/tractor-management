import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import MaintenanceRecord from "@/models/MaintenanceRecord";
import { z } from "zod";

const maintenanceSchema = z.object({
  tractorName: z.string().min(1, "Tractor name is required"),
  serviceDate: z.string().min(1, "Date is required"),
  meterHours: z.coerce.number().min(0, "Meter hours required"),
  serviceType: z.string().min(2, "Service type required"),
  description: z.string().min(2, "Description required"),
  partsCost: z.coerce.number().default(0), // In Rupees
  laborCost: z.coerce.number().default(0), // In Rupees
  nextServiceDate: z.string().optional(),
  nextServiceMeterHours: z.coerce.number().optional(),
  status: z.enum(["scheduled", "completed"]).default("completed"),
});

// GET: Fetch maintenance records
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  
  const records = await MaintenanceRecord.find({ businessId: session.user.businessId })
    .sort({ serviceDate: -1 })
    .lean();

  return NextResponse.json(records);
}

// POST: Create a maintenance record
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = maintenanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const newRecord = await MaintenanceRecord.create({
    businessId: session.user.businessId,
    tractorName: parsed.data.tractorName,
    serviceDate: new Date(parsed.data.serviceDate),
    meterHours: parsed.data.meterHours,
    serviceType: parsed.data.serviceType,
    description: parsed.data.description,
    partsCostPaise: Math.round(parsed.data.partsCost * 100),
    laborCostPaise: Math.round(parsed.data.laborCost * 100),
    nextServiceDate: parsed.data.nextServiceDate ? new Date(parsed.data.nextServiceDate) : undefined,
    nextServiceMeterHours: parsed.data.nextServiceMeterHours,
    status: parsed.data.status,
  });

  return NextResponse.json(newRecord, { status: 201 });
}