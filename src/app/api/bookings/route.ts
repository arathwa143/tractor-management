import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { z } from "zod";

const bookingSchema = z.object({
  farmerId: z.string().min(1, "Farmer is required"),
  scheduledAt: z.string().min(1, "Date is required"),
  serviceType: z.enum(["Rotavator", "Palava", "Shredder", "Mulcher", "Disc Harrow"]),
  village: z.string().min(2, "Village is required"),
  notes: z.string().optional(),
});

// GET: Fetch bookings
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  
  // Fetch bookings and populate farmer details
  const bookings = await Booking.find({ businessId: session.user.businessId })
    .populate("farmerId", "name phone")
    .sort({ scheduledAt: -1 })
    .lean();

  return NextResponse.json(bookings);
}

// POST: Create booking
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  // Generate a simple booking number (e.g., BK-17154321)
  const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;

  const newBooking = await Booking.create({
    businessId: session.user.businessId,
    bookingNumber,
    farmerId: parsed.data.farmerId,
    scheduledAt: new Date(parsed.data.scheduledAt),
    serviceType: parsed.data.serviceType,
    village: parsed.data.village,
    notes: parsed.data.notes,
  });

  // Return populated data immediately
  const populatedBooking = await Booking.findById(newBooking._id).populate("farmerId", "name phone").lean();
  return NextResponse.json(populatedBooking, { status: 201 });
}