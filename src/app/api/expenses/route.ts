import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { z } from "zod";

const expenseSchema = z.object({
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "upi", "bank", "other"]),
  description: z.string().min(2, "Description is required"),
  expenseScope: z.enum(["business", "personal"]).default("business"),
});

// GET: Fetch expenses with optional filters
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope"); // 'business' or 'personal'
  const category = searchParams.get("category");

  await dbConnect();

  const query: any = { 
    businessId: session.user.businessId, 
    type: "expense", 
    status: "posted" 
  };

  if (scope) query.expenseScope = scope;
  if (category && category !== "All") query.category = category;

  const expenses = await Transaction.find(query)
    .sort({ transactionDate: -1 })
    .limit(100)
    .lean();

  // Calculate summary
  let totalPaise = 0;
  let businessPaise = 0;
  let personalPaise = 0;
  const categoryBreakdown: Record<string, number> = {};

  expenses.forEach((exp: any) => {
    totalPaise += exp.amountPaise;
    if (exp.expenseScope === "business") businessPaise += exp.amountPaise;
    else personalPaise += exp.amountPaise;

    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amountPaise;
  });

  return NextResponse.json({
    expenses,
    summary: { totalPaise, businessPaise, personalPaise },
    categoryBreakdown,
  });
}

// POST: Record a new expense
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const transactionNumber = `EXP-${Date.now().toString().slice(-6)}`;

  const newExpense = await Transaction.create({
    businessId: session.user.businessId,
    transactionNumber,
    type: "expense",
    category: parsed.data.category,
    amountPaise: Math.round(parsed.data.amount * 100),
    paymentMethod: parsed.data.paymentMethod,
    account: parsed.data.paymentMethod === "cash" ? "Main Cash Box" : "Bank Account",
    description: parsed.data.description,
    expenseScope: parsed.data.expenseScope,
    createdBy: session.user.id,
    status: "posted",
  });

  return NextResponse.json(newExpense, { status: 201 });
}