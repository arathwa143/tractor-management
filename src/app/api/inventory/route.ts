import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InventoryItem from "@/models/InventoryItem";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.enum(["Spare Part", "Lubricant", "Tool", "Other"]),
  unit: z.string().min(1, "Unit is required"),
  quantityOnHand: z.coerce.number().default(0),
  reorderLevel: z.coerce.number().default(0),
  purchasePrice: z.coerce.number().default(0), // In Rupees
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const items = await InventoryItem.find({ businessId: session.user.businessId, isActive: true }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  await dbConnect();
  const newItem = await InventoryItem.create({
    businessId: session.user.businessId,
    ...parsed.data,
    purchasePricePaise: Math.round(parsed.data.purchasePrice * 100),
  });

  return NextResponse.json(newItem, { status: 201 });
}