"use client";

import { useEffect, useState } from "react";
import { Loader2, Wrench, Plus, Calendar } from "lucide-react";

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

interface MaintenanceRecord {
  _id: string;
  tractorName: string;
  serviceDate: string;
  meterHours: number;
  serviceType: string;
  description: string;
  partsCostPaise: number;
  laborCostPaise: number;
  nextServiceDate?: string;
  nextServiceMeterHours?: number;
  status: "scheduled" | "completed";
}

const SERVICE_TYPES = ["Engine Oil", "Oil Filter", "Air Filter", "Fuel Filter", "Tyre Replacement", "Battery", "General Repair", "Other"];

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tractorName: "",
    serviceDate: "",
    meterHours: 0,
    serviceType: "Engine Oil",
    description: "",
    partsCost: 0,
    laborCost: 0,
    nextServiceDate: "",
    nextServiceMeterHours: 0,
    status: "completed" as "scheduled" | "completed",
  });

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/maintenance");
        const data = await res.json();
        setRecords(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecords();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setRecords([newRecord, ...records]);
        resetForm();
        setIsDialogOpen(false);
      } else {
        alert("Failed to save maintenance record.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      tractorName: "", serviceDate: "", meterHours: 0, serviceType: "Engine Oil",
      description: "", partsCost: 0, laborCost: 0, nextServiceDate: "", nextServiceMeterHours: 0, status: "completed"
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance & Service</h1>
          <p className="text-muted-foreground">Track tractor repairs, servicing, and upcoming schedules.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Log Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Wrench className="h-12 w-12 mb-2" />
              No maintenance records yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tractor</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Meter (Hrs)</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const totalCost = record.partsCostPaise + record.laborCostPaise;
                  return (
                    <TableRow key={record._id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(record.serviceDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="font-medium">{record.tractorName}</TableCell>
                      <TableCell>
                        <div className="font-medium">{record.serviceType}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{record.description}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{record.meterHours} hrs</TableCell>
                      <TableCell className="font-bold">{formatINR(totalCost)}</TableCell>
                      <TableCell className="text-xs">
                        {record.nextServiceDate ? new Date(record.nextServiceDate).toLocaleDateString('en-IN') : "-"}
                        {record.nextServiceMeterHours ? ` / ${record.nextServiceMeterHours} hrs` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Log Tractor Service
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tractor Name/No.</Label>
                <Input placeholder="e.g. MH-12-AB-1234" value={formData.tractorName} onChange={e => setFormData({...formData, tractorName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled (Upcoming)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Date</Label>
                <Input type="date" value={formData.serviceDate} onChange={e => setFormData({...formData, serviceDate: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Current Meter (Hours)</Label>
                <Input type="number" value={formData.meterHours || ""} onChange={e => setFormData({...formData, meterHours: parseFloat(e.target.value) || 0})} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <select 
                value={formData.serviceType} 
                onChange={e => setFormData({...formData, serviceType: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SERVICE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description / Mechanic Notes</Label>
              <Input placeholder="e.g. Changed engine oil and greased chassis" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Parts Cost (₹)</Label>
                <Input type="number" value={formData.partsCost || ""} onChange={e => setFormData({...formData, partsCost: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>Labor Cost (₹)</Label>
                <Input type="number" value={formData.laborCost || ""} onChange={e => setFormData({...formData, laborCost: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Next Service Date</Label>
                <Input type="date" value={formData.nextServiceDate} onChange={e => setFormData({...formData, nextServiceDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Next Service Meter (Hrs)</Label>
                <Input type="number" value={formData.nextServiceMeterHours || ""} onChange={e => setFormData({...formData, nextServiceMeterHours: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}