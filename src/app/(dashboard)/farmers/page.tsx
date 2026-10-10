"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Users, Search } from "lucide-react";

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

// 1. Form Validation Schema
const farmerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  village: z.string().min(2, "Village is required"),
  address: z.string().optional(),
  openingBalance: z.coerce.number().default(0),
});

type FarmerFormValues = z.infer<typeof farmerFormSchema>;

// 2. TypeScript Interfaces
interface Farmer {
  _id: string;
  name: string;
  phone: string;
  village: string;
  openingBalancePaise: number;
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerFormSchema),
    defaultValues: { name: "", phone: "", village: "", address: "", openingBalance: 0 },
  });

  // 3. Fetch Farmers on Load
  useEffect(() => {
    async function fetchFarmers() {
      try {
        const res = await fetch("/api/farmers");
        const data = await res.json();
        setFarmers(data);
      } catch (error) {
        console.error("Failed to fetch farmers", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFarmers();
  }, []);

  // 4. Handle Form Submission
  async function onSubmit(data: FarmerFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newFarmer = await res.json();
        setFarmers([newFarmer, ...farmers]); // Add to top of list
        form.reset();
        setIsDialogOpen(false); // Close dialog
      } else {
        alert("Failed to add farmer. Please check your inputs.");
      }
    } catch (error) {
      console.error("Error saving farmer:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5. Search Filter Logic
  const filteredFarmers = farmers.filter((f) => {
    const query = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(query) ||
      f.phone.includes(query) ||
      f.village.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Farmers</h1>
          <p className="text-muted-foreground">Manage your farmer directory and balances.</p>
        </div>
        
        {/* Note: We use onClick instead of DialogTrigger to prevent HTML button-inside-button errors */}
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Farmer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search farmers by name, phone, or village..." 
          className="max-w-sm pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Farmers Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Farmer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchQuery ? "No farmers match your search." : "No farmers added yet."}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">Click "Add Farmer" to get started.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer._id}>
                    <TableCell className="font-medium">{farmer.name}</TableCell>
                    <TableCell>{farmer.phone}</TableCell>
                    <TableCell>{farmer.village}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        ₹{(farmer.openingBalancePaise / 100).toFixed(2)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Farmer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Farmer</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Ramesh Patel" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="99999 99999" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="village">Village</Label>
              <Input id="village" placeholder="Anand" {...form.register("village")} />
              {form.formState.errors.village && (
                <p className="text-xs text-red-500">{form.formState.errors.village.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="openingBalance">Opening Balance (₹)</Label>
              <Input 
                id="openingBalance" 
                type="number" 
                placeholder="0.00" 
                {...form.register("openingBalance")} 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Farmer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}