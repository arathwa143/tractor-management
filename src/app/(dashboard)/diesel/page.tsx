"use client";

import { useEffect, useState } from "react";
import { Loader2, Fuel, TrendingUp, Droplet, Plus } from "lucide-react";

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

interface DieselLog {
  _id: string;
  type: "purchase" | "usage";
  liters: number;
  pricePerLiterPaise?: number;
  totalCostPaise?: number;
  startMeterHours?: number;
  endMeterHours?: number;
  loggedAt: string;
  notes?: string;
}

interface Summary {
  totalLiters: number;
  totalCostPaise: number;
  avgPricePerLiterPaise: number;
}

export default function DieselPage() {
  const [logs, setLogs] = useState<DieselLog[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalLiters: 0, totalCostPaise: 0, avgPricePerLiterPaise: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState<"purchase" | "usage">("purchase");
  const [liters, setLiters] = useState<number>(0);
  const [pricePerLiter, setPricePerLiter] = useState<number>(0);
  const [startMeter, setStartMeter] = useState<number>(0);
  const [endMeter, setEndMeter] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchDiesel() {
      try {
        const res = await fetch("/api/diesel");
        const data = await res.json();
        setLogs(data.logs);
        setSummary(data.summary);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDiesel();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: any = { type, liters };
    if (type === "purchase") {
      payload.pricePerLiter = pricePerLiter;
    } else {
      payload.startMeterHours = startMeter;
      payload.endMeterHours = endMeter;
    }
    if (notes) payload.notes = notes;

    try {
      const res = await fetch("/api/diesel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newLog = await res.json();
        setLogs([newLog, ...logs]);
        
        // Update summary locally
        const newSummary = { ...summary };
        newSummary.totalLiters += newLog.liters;
        if (newLog.totalCostPaise) {
          newSummary.totalCostPaise += newLog.totalCostPaise;
          newSummary.avgPricePerLiterPaise = newSummary.totalCostPaise / newSummary.totalLiters;
        }
        setSummary(newSummary);

        resetForm();
        setIsDialogOpen(false);
      } else {
        alert("Failed to record diesel log.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setType("purchase");
    setLiters(0);
    setPricePerLiter(0);
    setStartMeter(0);
    setEndMeter(0);
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diesel Management</h1>
          <p className="text-muted-foreground">Track fuel purchases, consumption, and costs.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Log Diesel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liters</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLiters.toFixed(2)} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
            <Fuel className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatINR(summary.totalCostPaise)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price / Liter</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(summary.avgPricePerLiterPaise)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Diesel Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              No diesel logs recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Meter (Start - End)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.loggedAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.type === "purchase" ? "default" : "secondary"} className="capitalize">
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.liters} L</TableCell>
                    <TableCell className={log.totalCostPaise ? "text-primary font-bold" : "text-muted-foreground"}>
                      {log.totalCostPaise ? formatINR(log.totalCostPaise) : "-"}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {log.startMeterHours !== undefined ? `${log.startMeterHours} - ${log.endMeterHours}` : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Diesel Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Diesel Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant={type === "purchase" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setType("purchase")}
              >
                Purchase (Buy Fuel)
              </Button>
              <Button 
                type="button" 
                variant={type === "usage" ? "default" : "outline"} 
                className="flex-1"
                onClick={() => setType("usage")}
              >
                Usage (Fill Tractor)
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Liters</Label>
              <Input 
                type="number" 
                step="0.1" 
                value={liters || ""} 
                onChange={e => setLiters(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>

            {type === "purchase" ? (
              <div className="space-y-2">
                <Label>Price per Liter (₹)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={pricePerLiter || ""} 
                  onChange={e => setPricePerLiter(parseFloat(e.target.value) || 0)} 
                  required 
                />
                <p className="text-xs text-muted-foreground">
                  Total Cost: {formatINR(Math.round(liters * pricePerLiter * 100))}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Meter (Hrs)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={startMeter || ""} 
                    onChange={e => setStartMeter(parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Meter (Hrs)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={endMeter || ""} 
                    onChange={e => setEndMeter(parseFloat(e.target.value) || 0)} 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input 
                placeholder="e.g. Bought from HP Pump" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Log
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}