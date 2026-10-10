"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations";

interface Driver {
  _id: string;
  name: string;
  phone: string;
  salaryType: string;
  salaryRatePaise: number;
  advanceBalancePaise: number;
  status: "active" | "inactive";
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Driver Form
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", licenseNumber: "", salaryType: "monthly" as const, salaryRate: 0 });
  
  // Balance Form
  const [balanceForm, setBalanceForm] = useState({ amount: 0, description: "" });

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const res = await fetch("/api/drivers");
        const data = await res.json();
        setDrivers(data);
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    }
    fetchDrivers();
  }, []);

  async function handleAddDriver(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverForm),
      });
      if (res.ok) {
        const newDriver = await res.json();
        setDrivers([newDriver, ...drivers]);
        setDriverForm({ name: "", phone: "", licenseNumber: "", salaryType: "monthly", salaryRate: 0 });
        setIsDriverDialogOpen(false);
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  }

  async function handleUpdateBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDriver) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drivers?id=${selectedDriver._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(balanceForm),
      });
      if (res.ok) {
        const updatedDriver = await res.json();
        setDrivers(drivers.map(d => d._id === updatedDriver._id ? updatedDriver : d));
        setBalanceForm({ amount: 0, description: "" });
        setIsBalanceDialogOpen(false);
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers & Staff</h1>
          <p className="text-muted-foreground">Manage operators, salaries, and advances.</p>
        </div>
        <Button onClick={() => setIsDriverDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Driver
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Driver Directory</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mb-2" /> No drivers added yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Salary Type</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Advance Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver._id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell className="capitalize">{driver.salaryType}</TableCell>
                    <TableCell>{formatINR(driver.salaryRatePaise)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${driver.advanceBalancePaise > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {formatINR(driver.advanceBalancePaise)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={driver.status === "active" ? "default" : "secondary"}>{driver.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedDriver(driver); setIsBalanceDialogOpen(true); }}>
                        <Wallet className="h-4 w-4 mr-1" /> Advance/Pay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Driver</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDriver} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Phone Number</Label><Input value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} required /></div>
            </div>
            <div className="space-y-2"><Label>License Number (Optional)</Label><Input value={driverForm.licenseNumber} onChange={e => setDriverForm({...driverForm, licenseNumber: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <select value={driverForm.salaryType} onChange={e => setDriverForm({...driverForm, salaryType: e.target.value as any})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="monthly">Monthly</option><option value="daily">Daily</option><option value="hourly">Hourly</option><option value="per-job">Per Job</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Rate (₹)</Label><Input type="number" value={driverForm.salaryRate || ""} onChange={e => setDriverForm({...driverForm, salaryRate: parseFloat(e.target.value) || 0})} required /></div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Driver</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Advance/Payment Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Balance: {selectedDriver?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateBalance} className="space-y-4">
            <div className="p-3 bg-muted rounded-md text-sm">
              Current Advance Balance: <span className="font-bold">{formatINR(selectedDriver?.advanceBalancePaise || 0)}</span>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <p className="text-xs text-muted-foreground">Use positive (+) to give an advance. Use negative (-) to record a salary payment or deduction.</p>
              <Input type="number" step="0.01" value={balanceForm.amount || ""} onChange={e => setBalanceForm({...balanceForm, amount: parseFloat(e.target.value) || 0})} required />
            </div>
            <div className="space-y-2"><Label>Description (Optional)</Label><Input value={balanceForm.description} onChange={e => setBalanceForm({...balanceForm, description: e.target.value})} placeholder="e.g. Advance for personal use" /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Update Balance</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}