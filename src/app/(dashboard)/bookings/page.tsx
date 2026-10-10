"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, CalendarDays } from "lucide-react";

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

interface Farmer {
  _id: string;
  name: string;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  scheduledAt: string;
  serviceType: string;
  village: string;
  status: string;
  farmerId: Farmer;
}

const SERVICE_TYPES = ["Rotavator", "Palava", "Shredder", "Mulcher", "Disc Harrow"] as const;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    farmerId: "",
    scheduledAt: "",
    serviceType: "Rotavator",
    village: "",
    notes: "",
  });

  // Fetch data on load
  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, farmersRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/farmers"),
        ]);
        const bookingsData = await bookingsRes.json();
        const farmersData = await farmersRes.json();
        
        setBookings(bookingsData);
        setFarmers(farmersData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newBooking = await res.json();
        setBookings([newBooking, ...bookings]);
        setFormData({ farmerId: "", scheduledAt: "", serviceType: "Rotavator", village: "", notes: "" });
        setIsDialogOpen(false);
      } else {
        alert("Failed to create booking.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in_progress": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "scheduled": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
      default: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"; // pending
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Schedule tractor services for farmers.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </Button>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farmerId">Farmer</Label>
                <select 
                  id="farmerId"
                  value={formData.farmerId}
                  onChange={(e) => setFormData({...formData, farmerId: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a farmer...</option>
                  {farmers.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date</Label>
                <Input 
                  id="scheduledAt" 
                  type="date" 
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <select 
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="village">Village / Field</Label>
                <Input 
                  id="village" 
                  placeholder="e.g. Anand, Field 2" 
                  value={formData.village}
                  onChange={(e) => setFormData({...formData, village: e.target.value})}
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Booking
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No bookings scheduled yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>{new Date(booking.scheduledAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="font-medium">{booking.farmerId?.name || "Unknown"}</TableCell>
                    <TableCell>{booking.serviceType}</TableCell>
                    <TableCell>{booking.village}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}