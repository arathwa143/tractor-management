"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer, TrendingUp, TrendingDown, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations";

interface ReportData {
  financials: {
    totalBilledPaise: number;
    totalIncomePaise: number;
    totalBusinessExpensePaise: number;
    totalPersonalExpensePaise: number;
    netOperatingProfitPaise: number;
    approximateOutstandingPaise: number;
  };
  diesel: {
    totalLiters: number;
    totalCostPaise: number;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/api/reports/summary");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to load report", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { financials, diesel } = data;

  return (
    <div className="space-y-6">
      {/* Header & Print Action */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-muted-foreground">Overall profitability and operational summary.</p>
        </div>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90">
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Printable Report Container */}
      <div className="bg-white p-8 border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Report Header */}
        <div className="text-center border-b-2 border-primary pb-6 mb-8">
          <h1 className="text-3xl font-bold text-primary">TractorPro Services</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-2">Financial & Operational Report</h2>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Section 1: Profit & Loss */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Profit & Loss Statement
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Service Revenue (Billed)</span>
              <span className="font-semibold">{formatINR(financials.totalBilledPaise)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 pl-4">Less: Business Operating Expenses</span>
              <span className="font-semibold text-red-500">- {formatINR(financials.totalBusinessExpensePaise)}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between items-center text-lg font-bold bg-green-50 p-3 rounded-md">
              <span className="text-green-800">Net Operating Profit</span>
              <span className={financials.netOperatingProfitPaise >= 0 ? "text-green-600" : "text-red-600"}>
                {formatINR(financials.netOperatingProfitPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Cash Flow & Dues */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 p-4 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Cash Flow Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cash Collected (Income)</span>
                <span className="font-medium">{formatINR(financials.totalIncomePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Business Expenses Paid</span>
                <span className="font-medium text-red-500">{formatINR(financials.totalBusinessExpensePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Personal Withdrawals</span>
                <span className="font-medium text-muted-foreground">{formatINR(financials.totalPersonalExpensePaise)}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 p-4 rounded-lg">
            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" /> Outstanding Dues
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Billed to Farmers</span>
                <span className="font-medium">{formatINR(financials.totalBilledPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Less: Total Collected</span>
                <span className="font-medium text-green-600">- {formatINR(financials.totalIncomePaise)}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between font-bold text-base">
                <span className="text-gray-800">Estimated Outstanding</span>
                <span className={financials.approximateOutstandingPaise > 0 ? "text-orange-600" : "text-green-600"}>
                  {formatINR(financials.approximateOutstandingPaise)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Diesel Analytics */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Diesel & Fuel Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-md text-center">
              <p className="text-sm text-blue-800 mb-1">Total Diesel Consumed/Purchased</p>
              <p className="text-2xl font-bold text-blue-900">{diesel.totalLiters.toFixed(2)} Liters</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md text-center">
              <p className="text-sm text-blue-800 mb-1">Total Fuel Cost</p>
              <p className="text-2xl font-bold text-blue-900">{formatINR(diesel.totalCostPaise)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This report is auto-generated by TractorPro Management System.</p>
          <p className="mt-1">For internal business use only.</p>
        </div>
      </div>
    </div>
  );
}