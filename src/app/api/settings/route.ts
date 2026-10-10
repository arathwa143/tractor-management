import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BusinessSettings from "@/models/BusinessSettings";
import { z } from "zod";

const settingsSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  bighaToAcreConversion: z.coerce.number().min(0.1, "Conversion rate must be greater than 0"),
});

// GET: Fetch business settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  let settings = await BusinessSettings.findOne({ businessId: session.user.businessId }).lean();
  
  // If no settings exist yet, return default values
  if (!settings) {
    settings = {
      businessId: session.user.businessId,
      businessName: "My Tractor Business",
      ownerName: session.user.name || "Owner",
      phone: session.user.phone || "",
      address: "Gujarat, India",
      bighaToAcreConversion: 0.625,
      currency: "INR",
    } as any;
  }

  return NextResponse.json(settings);
}

// PUT: Update business settings
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  // Upsert: Update if exists, create if it doesn't
  const updatedSettings = await BusinessSettings.findOneAndUpdate(
    { businessId: session.user.businessId },
    { ...parsed.data, businessId: session.user.businessId },
    { upsert: true, new: true }
  );

  return NextResponse.json(updatedSettings);
}