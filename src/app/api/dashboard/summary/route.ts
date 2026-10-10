import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Job from "@/models/Job";
import Transaction from "@/models/Transaction";
import DieselLog from "@/models/DieselLog";
import Booking from "@/models/Booking";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = session.user.businessId;

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // 1. Today's Metrics
  const [todayJobs, todayIncome, todayExpenses, todayDiesel, pendingBookings] = await Promise.all([
    Job.find({ businessId, completedAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Transaction.find({ businessId, type: "income", transactionDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Transaction.find({ businessId, type: "expense", transactionDate: { $gte: todayStart, $lte: todayEnd } }).lean(),
    DieselLog.find({ businessId, loggedAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    Booking.find({ businessId, status: { $in: ["pending", "scheduled"] } }).countDocuments(),
  ]);

  const todayRevenue = todayJobs.reduce((sum, job) => sum + job.totalAmountPaise, 0);
  const todayIncomeTotal = todayIncome.reduce((sum, t) => sum + t.amountPaise, 0);
  const todayExpenseTotal = todayExpenses.reduce((sum, t) => sum + t.amountPaise, 0);
  const todayDieselLiters = todayDiesel.reduce((sum, d) => sum + d.liters, 0);

  // 2. Last 7 Days Chart Data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const start = startOfDay(date);
    const end = endOfDay(date);

    const [dayJobs, dayExpenses] = await Promise.all([
      Job.find({ businessId, completedAt: { $gte: start, $lte: end } }).lean(),
      Transaction.find({ businessId, type: "expense", transactionDate: { $gte: start, $lte: end } }).lean(),
    ]);

    const revenue = dayJobs.reduce((sum, job) => sum + job.totalAmountPaise, 0) / 100; // Convert to Rupees for chart
    const expense = dayExpenses.reduce((sum, t) => sum + t.amountPaise, 0) / 100;

    chartData.push({
      date: format(date, "EEE"), // e.g., "Mon", "Tue"
      revenue: Number(revenue.toFixed(2)),
      expense: Number(expense.toFixed(2)),
    });
  }

  return NextResponse.json({
    today: {
      revenuePaise: todayRevenue,
      incomePaise: todayIncomeTotal,
      expensePaise: todayExpenseTotal,
      jobsCount: todayJobs.length,
      dieselLiters: todayDieselLiters,
      pendingBookings,
    },
    chartData,
  });
}