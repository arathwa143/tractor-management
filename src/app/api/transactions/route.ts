import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "upi", "bank", "other"]),
  description: z.string().min(2, "Description is required"),
  farmerId: z.string().optional(),
  jobId: z.string().optional(),
});

// GET: Fetch ALL transactions and calculate totals
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type"); // 'income', 'expense', or null for all

  await dbConnect();

  const query: any = { 
    businessId: session.user.businessId,
    status: "posted"
  };
  
  // Apply filter if provided
  if (typeFilter && typeFilter !== "all") {
    query.type = typeFilter;
  }

  // Fetch ALL transactions (Removed the .limit(50))
  const transactions = await Transaction.find(query)
    .sort({ transactionDate: -1 })
    .lean();

  // Calculate totals for the dashboard summary (Always calculates from ALL posted transactions)
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amountPaise, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amountPaise, 0);

  return NextResponse.json({
    transactions,
    summary: {
      totalIncomePaise: totalIncome,
      totalExpensePaise: totalExpense,
      balancePaise: totalIncome - totalExpense,
    }
  });
}

// POST: Record a new transaction (Keep your existing POST code here)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await dbConnect();

  const transactionNumber = `TXN-${Date.now().toString().slice(-6)}`;

  const newTransaction = await Transaction.create({
    businessId: session.user.businessId,
    transactionNumber,
    type: parsed.data.type,
    category: parsed.data.category,
    amountPaise: Math.round(parsed.data.amount * 100),
    paymentMethod: parsed.data.paymentMethod,
    account: parsed.data.paymentMethod === "cash" ? "Main Cash Box" : "Bank Account",
    description: parsed.data.description,
    farmerId: parsed.data.farmerId || undefined,
    jobId: parsed.data.jobId || undefined,
    expenseScope: parsed.data.category === "Personal" ? "personal" : "business",
    createdBy: session.user.id,
    status: "posted",
  });

  return NextResponse.json(newTransaction, { status: 201 });
}