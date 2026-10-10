import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import { z } from "zod";

// Validation schema for creating a farmer
const farmerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number is required"),
  village: z.string().min(2, "Village is required"),
  address: z.string().optional(),
  openingBalance: z.number().default(0), // In Rupees
});

// GET: Fetch all farmers for the current business
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const farmers = await Farmer.find({ businessId: session.user.businessId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(farmers);
}

// POST: Create a new farmer
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = farmerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  // Convert Rupees to Paise for the database
  const openingBalancePaise = Math.round(parsed.data.openingBalance * 100);

  const newFarmer = await Farmer.create({
    businessId: session.user.businessId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    village: parsed.data.village,
    address: parsed.data.address,
    openingBalancePaise,
  });

  return NextResponse.json(newFarmer, { status: 201 });
}