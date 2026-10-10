"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, Calculator, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateJobTotal, formatINR } from "@/lib/calculations";
import { JobReceipt } from "@/components/dashboard/job-receipt";

interface Booking {
  _id: string;
  bookingNumber: string;
  scheduledAt: string;
  serviceType: string;
  village: string;
  status: string;
  farmerId: { _id: string; name: string; phone: string };
}

interface CompletedJob {
  _id: string;
  bookingNumber?: string;
  farmerId: { name: string; phone: string };
  serviceType: string;
  billingMethod: string;
  area?: number;
  areaUnit?: string;
  hoursWorked?: number;
  ratePaise: number;
  totalAmountPaise: number;
  completedAt: string;
  village?: string; // Added for receipt
}

export default function JobsPage() {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Complete Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingMethod, setBillingMethod] = useState<"area" | "hourly" | "fixed">("area");
  const [quantity, setQuantity] = useState<number>(0);
  const [areaUnit, setAreaUnit] = useState<"bigha" | "acre" | "hectare">("bigha");
  const [rate, setRate] = useState<number>(0);
  const [meterStart, setMeterStart] = useState<number>(0);
  const [meterEnd, setMeterEnd] = useState<number>(0);

  // Print Receipt State
  const [printJob, setPrintJob] = useState<CompletedJob | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pending bookings
        const bookingsRes = await fetch("/api/bookings");
        const bookingsData = await bookingsRes.json();
        setPendingBookings(bookingsData.filter((b: Booking) => b.status !== "completed" && b.status !== "cancelled"));

        // Fetch completed jobs (We'll use the jobs API if you created it, or filter bookings for MVP)
        // For this MVP update, we will just show a placeholder completed job if you completed one in the previous step.
        // In a real app, you'd fetch from /api/jobs.
        const jobsRes = await fetch("/api/jobs"); 
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setCompletedJobs(jobsData);
        }
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    }
    fetchData();
  }, []);

  const calculatedTotalRupees = (() => {
    const ratePaise = rate * 100;
    return calculateJobTotal(billingMethod, quantity, ratePaise, 0, 0) / 100;
  })();

  async function handleCompleteJob(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooking) return;
    setIsSubmitting(true);

    const payload = {
      bookingId: selectedBooking._id,
      farmerId: selectedBooking.farmerId._id,
      serviceType: selectedBooking.serviceType,
      billingMethod,
      area: billingMethod === "area" ? quantity : undefined,
      areaUnit: billingMethod === "area" ? areaUnit : undefined,
      hoursWorked: billingMethod === "hourly" ? quantity : undefined,
      startMeterHours: meterStart,
      endMeterHours: meterEnd,
      ratePaise: rate * 100,
      totalAmountPaise: calculatedTotalRupees * 100,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newJob = await res.json();
        setCompletedJobs([newJob, ...completedJobs]);
        setPendingBookings(pendingBookings.filter(b => b._id !== selectedBooking._id));
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  }

  function resetForm() {
    setBillingMethod("area"); setQuantity(0); setRate(0); setMeterStart(0); setMeterEnd(0);
  }

  function openPrintDialog(job: CompletedJob) {
    setPrintJob(job);
    setPaidAmount(job.totalAmountPaise / 100); // Default to full payment
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs & Billing</h1>
        <p className="text-muted-foreground">Complete bookings and generate farmer receipts.</p>
      </div>

      {/* Pending Jobs Table */}
      <Card>
        <CardHeader><CardTitle>Pending Jobs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : pendingBookings.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No pending jobs.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Farmer</TableHead><TableHead>Service</TableHead><TableHead>Village</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBookings.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>{new Date(b.scheduledAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-medium">{b.farmerId?.name}</TableCell>
                    <TableCell>{b.serviceType}</TableCell>
                    <TableCell>{b.village}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => { setSelectedBooking(b); setIsDialogOpen(true); }}>Complete & Bill</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Completed Jobs Table */}
      <Card>
        <CardHeader><CardTitle>Completed Jobs & Receipts</CardTitle></CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No completed jobs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Farmer</TableHead><TableHead>Service</TableHead><TableHead>Total Bill</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedJobs.map((j) => (
                  <TableRow key={j._id}>
                    <TableCell>{new Date(j.completedAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-medium">{j.farmerId?.name}</TableCell>
                    <TableCell>{j.serviceType}</TableCell>
                    <TableCell className="font-bold">{formatINR(j.totalAmountPaise)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openPrintDialog(j)}>
                        <Printer className="h-4 w-4 mr-1" /> Print Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Complete Job Dialog (Same as before) */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Complete Job</DialogTitle></DialogHeader>
          <form onSubmit={handleCompleteJob} className="space-y-4">
            <div className="flex gap-2">
              {(["area", "hourly", "fixed"] as const).map((m) => (
                <Button key={m} type="button" variant={billingMethod === m ? "default" : "outline"} className="flex-1 capitalize" onClick={() => setBillingMethod(m)}>{m}</Button>
              ))}
            </div>
            {billingMethod !== "fixed" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{billingMethod === "area" ? "Area" : "Hours"}</Label><Input type="number" step="0.1" value={quantity || ""} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} required /></div>
                {billingMethod === "area" && (
                  <div className="space-y-2"><Label>Unit</Label>
                    <select value={areaUnit} onChange={e => setAreaUnit(e.target.value as any)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="bigha">Bigha</option><option value="acre">Acre</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2"><Label>Rate (₹)</Label><Input type="number" value={rate || ""} onChange={e => setRate(parseFloat(e.target.value) || 0)} required /></div>
            <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center">
              <span className="font-medium">Total Bill:</span>
              <span className="text-2xl font-bold text-primary">{formatINR(calculatedTotalRupees * 100)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Job</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Receipt Dialog */}
      <Dialog open={!!printJob} onOpenChange={(open) => { if(!open) setPrintJob(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto no-print">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle>Preview Receipt</DialogTitle>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
          </DialogHeader>
          
          {printJob && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <Label className="whitespace-nowrap font-bold">Amount Paid by Farmer (₹):</Label>
                <Input type="number" value={paidAmount || ""} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="max-w-[150px]" />
                <p className="text-sm text-muted-foreground">Adjust this to show partial payments on the receipt.</p>
              </div>
              <JobReceipt 
                job={{
                  bookingNumber: printJob.bookingNumber,
                  farmerName: printJob.farmerId.name,
                  farmerPhone: printJob.farmerId.phone,
                  village: printJob.village || "N/A",
                  serviceType: printJob.serviceType,
                  billingMethod: printJob.billingMethod,
                  area: printJob.area,
                  areaUnit: printJob.areaUnit,
                  hoursWorked: printJob.hoursWorked,
                  ratePaise: printJob.ratePaise,
                  totalAmountPaise: printJob.totalAmountPaise,
                  completedAt: printJob.completedAt
                }} 
                paidAmount={paidAmount} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}