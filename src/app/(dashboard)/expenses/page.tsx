"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingDown, Briefcase, User, Plus, Filter } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations";

interface Expense {
  _id: string;
  transactionNumber: string;
  category: string;
  amountPaise: number;
  paymentMethod: string;
  description: string;
  expenseScope: "business" | "personal";
  transactionDate: string;
}

interface Summary {
  totalPaise: number;
  businessPaise: number;
  personalPaise: number;
}

const CATEGORIES = ["Diesel", "Repair", "Driver Wages", "Parts", "Food/Travel", "Maintenance", "Personal", "Other"];
const COLORS = ["#166534", "#84CC16", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalPaise: 0, businessPaise: 0, personalPaise: 0 });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<"all" | "business" | "personal">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Form State
  const [formData, setFormData] = useState({
    category: "Diesel",
    amount: 0,
    paymentMethod: "cash" as "cash" | "upi" | "bank",
    description: "",
    expenseScope: "business" as "business" | "personal",
  });

  useEffect(() => {
    async function fetchExpenses() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (scopeFilter !== "all") params.append("scope", scopeFilter);
        if (categoryFilter !== "All") params.append("category", categoryFilter);

        const res = await fetch(`/api/expenses?${params.toString()}`);
        const data = await res.json();
        
        setExpenses(data.expenses);
        setSummary(data.summary);

        // Format data for Pie Chart
        const chartData = Object.entries(data.categoryBreakdown).map(([name, value]) => ({
          name,
          value: Number((value / 100).toFixed(2)), // Convert to Rupees for chart
        }));
        setCategoryData(chartData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExpenses();
  }, [scopeFilter, categoryFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newExpense = await res.json();
        setExpenses([newExpense, ...expenses]);
        
        // Update summary locally
        const newSummary = { ...summary };
        newSummary.totalPaise += newExpense.amountPaise;
        if (newExpense.expenseScope === "business") newSummary.businessPaise += newExpense.amountPaise;
        else newSummary.personalPaise += newExpense.amountPaise;
        setSummary(newSummary);

        setFormData({ category: "Diesel", amount: 0, paymentMethod: "cash", description: "", expenseScope: "business" });
        setIsDialogOpen(false);
      } else {
        alert("Failed to record expense.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track business and personal outflows.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatINR(summary.totalPaise)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Expenses</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatINR(summary.businessPaise)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Withdrawals</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{formatINR(summary.personalPaise)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatINR(value * 100)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label>Scope</Label>
                <div className="flex gap-2">
                  {(["all", "business", "personal"] as const).map((s) => (
                    <Button key={s} variant={scopeFilter === s ? "default" : "outline"} className="flex-1 capitalize" onClick={() => setScopeFilter(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Category</Label>
                <select 
                  value={categoryFilter} 
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>All</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader><CardTitle>Expense Ledger</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              No expenses found for this filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp._id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(exp.transactionDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-medium">{exp.description}</TableCell>
                    <TableCell><Badge variant="secondary">{exp.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={exp.expenseScope === "business" ? "default" : "outline"} className="capitalize">
                        {exp.expenseScope}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase text-xs">{exp.paymentMethod}</TableCell>
                    <TableCell className="text-right font-bold text-red-500">
                      - {formatINR(exp.amountPaise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Record New Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex gap-2">
              <Button type="button" variant={formData.expenseScope === "business" ? "default" : "outline"} className="flex-1" onClick={() => setFormData({...formData, expenseScope: "business"})}>
                <Briefcase className="mr-2 h-4 w-4" /> Business
              </Button>
              <Button type="button" variant={formData.expenseScope === "personal" ? "destructive" : "outline"} className="flex-1" onClick={() => setFormData({...formData, expenseScope: "personal"})}>
                <User className="mr-2 h-4 w-4" /> Personal
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" step="0.01" value={formData.amount || ""} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} required />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-2">
                {(["cash", "upi", "bank"] as const).map(method => (
                  <Button key={method} type="button" variant={formData.paymentMethod === method ? "default" : "outline"} className="flex-1 capitalize" onClick={() => setFormData({...formData, paymentMethod: method})}>
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="e.g. Diesel for Tractor GJ-01" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Expense
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}