import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Job from "@/models/Job";
import Transaction from "@/models/Transaction";
import DieselLog from "@/models/DieselLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = session.user.businessId;

  // Fetch all data (For MVP, we fetch all. For large datasets, use MongoDB Aggregation Pipelines)
  const [jobs, transactions, dieselLogs] = await Promise.all([
    Job.find({ businessId }).lean(),
    Transaction.find({ businessId, status: "posted" }).lean(),
    DieselLog.find({ businessId }).lean(),
  ]);

  // 1. Financial Calculations
  const totalBilledPaise = jobs.reduce((sum, j) => sum + j.totalAmountPaise, 0);
  
  const totalIncomePaise = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amountPaise, 0);
    
  const totalBusinessExpensePaise = transactions
    .filter(t => t.type === "expense" && t.expenseScope === "business")
    .reduce((sum, t) => sum + t.amountPaise, 0);
    
  const totalPersonalExpensePaise = transactions
    .filter(t => t.type === "expense" && t.expenseScope === "personal")
    .reduce((sum, t) => sum + t.amountPaise, 0);

  // Net Operating Profit = Billed Revenue - Business Expenses
  const netOperatingProfitPaise = totalBilledPaise - totalBusinessExpensePaise;
  
  // Estimated Outstanding = Total Billed - Total Cash Collected (Income)
  const approximateOutstandingPaise = totalBilledPaise - totalIncomePaise;

  // 2. Diesel Calculations
  const totalDieselLiters = dieselLogs.reduce((sum, d) => sum + d.liters, 0);
  const totalDieselCostPaise = dieselLogs
    .filter(d => d.type === "purchase" && d.totalCostPaise)
    .reduce((sum, d) => sum + (d.totalCostPaise || 0), 0);

  return NextResponse.json({
    financials: {
      totalBilledPaise,
      totalIncomePaise,
      totalBusinessExpensePaise,
      totalPersonalExpensePaise,
      netOperatingProfitPaise,
      approximateOutstandingPaise,
    },
    diesel: {
      totalLiters: totalDieselLiters,
      totalCostPaise: totalDieselCostPaise,
    }
  });
}