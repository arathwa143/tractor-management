import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InventoryItem from "@/models/InventoryItem";
import StockMovement from "@/models/StockMovement";
import { z } from "zod";

const movementSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  movementType: z.enum(["in", "out"]),
  quantity: z.coerce.number().min(0.1, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0), // In Rupees
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = movementSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  await dbConnect();

  const item = await InventoryItem.findById(parsed.data.itemId);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Update quantity
  if (parsed.data.movementType === "in") {
    item.quantityOnHand += parsed.data.quantity;
  } else {
    if (item.quantityOnHand < parsed.data.quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }
    item.quantityOnHand -= parsed.data.quantity;
  }
  await item.save();

  // Record movement
  const movement = await StockMovement.create({
    businessId: session.user.businessId,
    itemId: parsed.data.itemId,
    movementType: parsed.data.movementType,
    quantity: parsed.data.quantity,
    unitCostPaise: Math.round(parsed.data.unitCost * 100),
    notes: parsed.data.notes,
  });

  return NextResponse.json({ movement, updatedItem: item }, { status: 201 });
}