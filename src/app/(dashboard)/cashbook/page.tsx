"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Wallet, Plus, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations";

interface Transaction {
  _id: string;
  transactionNumber: string;
  type: "income" | "expense";
  category: string;
  amountPaise: number;
  paymentMethod: string;
  description: string;
  transactionDate: string;
}

interface Summary {
  totalIncomePaise: number;
  totalExpensePaise: number;
  balancePaise: number;
}

const CATEGORIES = ["Diesel", "Repair", "Driver Wages", "Food/Travel", "Service Income", "Farmer Payment", "Personal", "Other"];

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncomePaise: 0, totalExpensePaise: 0, balancePaise: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter State
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  // Form State
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Diesel");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "bank">("cash");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function fetchCashbook() {
      setIsLoading(true);
      try {
        // Pass the filter to the API
        const res = await fetch(`/api/transactions?type=${typeFilter}`);
        const data = await res.json();
        setTransactions(data.transactions);
        setSummary(data.summary);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCashbook();
  }, [typeFilter]); // Re-fetch when filter changes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { type, category, amount, paymentMethod, description };

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newTxn = await res.json();
        setTransactions([newTxn, ...transactions]);
        
        // Update summary locally
        const newSummary = { ...summary };
        if (type === "income") newSummary.totalIncomePaise += newTxn.amountPaise;
        else newSummary.totalExpensePaise += newTxn.amountPaise;
        newSummary.balancePaise = newSummary.totalIncomePaise - newSummary.totalExpensePaise;
        setSummary(newSummary);

        resetForm();
        setIsDialogOpen(false);
      } else {
        alert("Failed to record transaction.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setType("expense");
    setCategory("Diesel");
    setAmount(0);
    setPaymentMethod("cash");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cashbook</h1>
          <p className="text-muted-foreground">Track daily income, expenses, and cash flow.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatINR(summary.totalIncomePaise)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatINR(summary.totalExpensePaise)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balancePaise >= 0 ? "text-primary" : "text-red-600"}`}>
              {formatINR(summary.balancePaise)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground mr-2">Filter Entries:</span>
            <div className="flex gap-2">
              {(["all", "income", "expense"] as const).map((filter) => (
                <Button 
                  key={filter} 
                  variant={typeFilter === filter ? "default" : "outline"} 
                  size="sm"
                  className="capitalize"
                  onClick={() => setTypeFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn._id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(txn.transactionDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-medium">{txn.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{txn.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "income" ? "default" : "destructive"} className="capitalize">
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase text-xs">{txn.paymentMethod}</TableCell>
                    <TableCell className={`text-right font-bold ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {txn.type === "income" ? "+" : "-"}{formatINR(txn.amountPaise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant={type === "expense" ? "destructive" : "outline"} 
                className="flex-1"
                onClick={() => setType("expense")}
              >
                Expense
              </Button>
              <Button 
                type="button" 
                variant={type === "income" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setType("income")}
              >
                Income
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={amount || ""} 
                onChange={e => setAmount(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-2">
                {(["cash", "upi", "bank"] as const).map(method => (
                  <Button 
                    key={method} 
                    type="button" 
                    variant={paymentMethod === method ? "default" : "outline"}
                    className="flex-1 capitalize"
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="e.g. Diesel for Tractor GJ-01-AB-1234" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Transaction
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}