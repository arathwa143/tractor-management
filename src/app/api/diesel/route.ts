import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import DieselLog from "@/models/DieselLog";
import { z } from "zod";

const dieselSchema = z.object({
  type: z.enum(["purchase", "usage"]),
  liters: z.coerce.number().min(0.1, "Liters must be greater than 0"),
  pricePerLiter: z.coerce.number().min(0).optional(), // In Rupees
  startMeterHours: z.coerce.number().optional(),
  endMeterHours: z.coerce.number().optional(),
  notes: z.string().optional(),
});

// GET: Fetch logs and summary
export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const logs = await DieselLog.find({ businessId: session.user.businessId })
    .sort({ loggedAt: -1 })
    .limit(50)
    .lean();

  // Calculate summary
  let totalLiters = 0;
  let totalCostPaise = 0;

  logs.forEach((log: any) => {
    totalLiters += log.liters;
    if (log.totalCostPaise) {
      totalCostPaise += log.totalCostPaise;
    }
  });

  const avgPricePerLiterPaise = totalLiters > 0 ? totalCostPaise / totalLiters : 0;

  return NextResponse.json({
    logs,
    summary: {
      totalLiters,
      totalCostPaise,
      avgPricePerLiterPaise,
    },
  });
}

// POST: Record a diesel log
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = dieselSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const totalCostPaise = parsed.data.pricePerLiter 
    ? Math.round(parsed.data.liters * parsed.data.pricePerLiter * 100) 
    : undefined;

  const newLog = await DieselLog.create({
    businessId: session.user.businessId,
    type: parsed.data.type,
    liters: parsed.data.liters,
    pricePerLiterPaise: parsed.data.pricePerLiter ? Math.round(parsed.data.pricePerLiter * 100) : undefined,
    totalCostPaise,
    startMeterHours: parsed.data.startMeterHours,
    endMeterHours: parsed.data.endMeterHours,
    notes: parsed.data.notes,
  });

  return NextResponse.json(newLog, { status: 201 });
}