import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Job from "@/models/Job";
import Booking from "@/models/Booking";
import { z } from "zod";

const jobSchema = z.object({
  bookingId: z.string().optional(),
  farmerId: z.string().min(1, "Farmer is required"),
  serviceType: z.enum(["Rotavator", "Palava", "Shredder", "Mulcher", "Disc Harrow"]),
  billingMethod: z.enum(["area", "hourly", "fixed"]),
  area: z.coerce.number().optional(),
  areaUnit: z.enum(["bigha", "acre", "hectare"]).optional(),
  hoursWorked: z.coerce.number().optional(),
  startMeterHours: z.coerce.number().default(0),
  endMeterHours: z.coerce.number().default(0),
  ratePaise: z.coerce.number().min(1, "Rate is required"),
  additionalChargesPaise: z.coerce.number().default(0),
  discountPaise: z.coerce.number().default(0),
  totalAmountPaise: z.coerce.number(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = jobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  // 1. Create the Job Record
  const newJob = await Job.create({
    businessId: session.user.businessId,
    bookingId: parsed.data.bookingId || undefined,
    farmerId: parsed.data.farmerId,
    // Tractor and Driver are optional for MVP, can be added later
    tractorId: new (await import("mongoose")).Types.ObjectId(), 
    driverId: new (await import("mongoose")).Types.ObjectId(),
    serviceType: parsed.data.serviceType,
    billingMethod: parsed.data.billingMethod,
    area: parsed.data.area,
    areaUnit: parsed.data.areaUnit,
    hoursWorked: parsed.data.hoursWorked,
    startMeterHours: parsed.data.startMeterHours,
    endMeterHours: parsed.data.endMeterHours,
    ratePaise: parsed.data.ratePaise,
    additionalChargesPaise: parsed.data.additionalChargesPaise,
    discountPaise: parsed.data.discountPaise,
    totalAmountPaise: parsed.data.totalAmountPaise,
    completedAt: new Date(),
  });

  // 2. Update the Booking status to 'completed' if a bookingId was provided
  if (parsed.data.bookingId) {
    await Booking.findByIdAndUpdate(parsed.data.bookingId, { status: "completed" });
  }

  return NextResponse.json(newJob, { status: 201 });
}