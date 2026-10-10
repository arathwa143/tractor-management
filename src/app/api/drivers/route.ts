import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Driver from "@/models/Driver";
import { z } from "zod";

const driverSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  licenseNumber: z.string().optional(),
  salaryType: z.enum(["monthly", "daily", "hourly", "per-job"]),
  salaryRate: z.coerce.number().min(0, "Rate is required"), // In Rupees
});

const updateBalanceSchema = z.object({
  amount: z.coerce.number(), // In Rupees. Positive = Give Advance, Negative = Pay Salary/Deduct
  description: z.string().optional(),
});

// GET: Fetch all drivers
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const drivers = await Driver.find({ businessId: session.user.businessId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(drivers);
}

// POST: Create a new driver
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = driverSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const newDriver = await Driver.create({
    businessId: session.user.businessId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    licenseNumber: parsed.data.licenseNumber,
    salaryType: parsed.data.salaryType,
    salaryRatePaise: Math.round(parsed.data.salaryRate * 100),
  });

  return NextResponse.json(newDriver, { status: 201 });
}

// PATCH: Update driver advance balance (Give advance or record payment)
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });

  const body = await request.json();
  const parsed = updateBalanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const driver = await Driver.findById(id);
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  // Convert Rupees to Paise and update balance
  const amountPaise = Math.round(parsed.data.amount * 100);
  driver.advanceBalancePaise += amountPaise; 
  
  await driver.save();

  return NextResponse.json(driver);
}