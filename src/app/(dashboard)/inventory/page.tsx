"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations";

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  purchasePricePaise: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item Form
  const [itemForm, setItemForm] = useState({ name: "", sku: "", category: "Spare Part", unit: "Piece", quantityOnHand: 0, reorderLevel: 0, purchasePrice: 0 });
  
  // Movement Form
  const [moveForm, setMoveForm] = useState({ movementType: "in" as "in" | "out", quantity: 0, unitCost: 0, notes: "" });

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        setItems(data);
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    }
    fetchItems();
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems([newItem, ...items]);
        setItemForm({ name: "", sku: "", category: "Spare Part", unit: "Piece", quantityOnHand: 0, reorderLevel: 0, purchasePrice: 0 });
        setIsItemDialogOpen(false);
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  }

  async function handleStockMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItem._id, ...moveForm }),
      });
      if (res.ok) {
        const { updatedItem } = await res.json();
        setItems(items.map(i => i._id === updatedItem._id ? updatedItem : i));
        setMoveForm({ movementType: "in", quantity: 0, unitCost: 0, notes: "" });
        setIsMoveDialogOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update stock");
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage spare parts, lubricants, and stock levels.</p>
        </div>
        <Button onClick={() => setIsItemDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Stock Overview</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mb-2" /> No inventory items added yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLowStock = item.quantityOnHand <= item.reorderLevel;
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLowStock ? "text-red-500" : "text-foreground"}`}>
                            {item.quantityOnHand} {item.unit}
                          </span>
                          {isLowStock && <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{formatINR(item.purchasePricePaise)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setMoveForm({...moveForm, movementType: "in", unitCost: item.purchasePricePaise / 100}); setIsMoveDialogOpen(true); }}>
                            <ArrowUpCircle className="h-4 w-4 mr-1 text-green-600" /> In
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedItem(item); setMoveForm({...moveForm, movementType: "out"}); setIsMoveDialogOpen(true); }}>
                            <ArrowDownCircle className="h-4 w-4 mr-1 text-red-600" /> Out
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Inventory Item</DialogTitle></DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>SKU / Code</Label><Input value={itemForm.sku} onChange={e => setItemForm({...itemForm, sku: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option>Spare Part</option><option>Lubricant</option><option>Tool</option><option>Other</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Unit (e.g., Piece, Liter)</Label><Input value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Initial Stock</Label><Input type="number" value={itemForm.quantityOnHand || ""} onChange={e => setItemForm({...itemForm, quantityOnHand: parseFloat(e.target.value) || 0})} /></div>
              <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" value={itemForm.reorderLevel || ""} onChange={e => setItemForm({...itemForm, reorderLevel: parseFloat(e.target.value) || 0})} /></div>
              <div className="space-y-2"><Label>Cost (₹)</Label><Input type="number" value={itemForm.purchasePrice || ""} onChange={e => setItemForm({...itemForm, purchasePrice: parseFloat(e.target.value) || 0})} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Item</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Stock: {selectedItem?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleStockMovement} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={moveForm.movementType === "in" ? "default" : "outline"} className="flex-1" onClick={() => setMoveForm({...moveForm, movementType: "in"})}>Stock In (Purchase)</Button>
              <Button type="button" variant={moveForm.movementType === "out" ? "destructive" : "outline"} className="flex-1" onClick={() => setMoveForm({...moveForm, movementType: "out"})}>Stock Out (Usage)</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" step="0.1" value={moveForm.quantity || ""} onChange={e => setMoveForm({...moveForm, quantity: parseFloat(e.target.value) || 0})} required /></div>
              <div className="space-y-2"><Label>Unit Cost ()</Label><Input type="number" step="0.01" value={moveForm.unitCost || ""} onChange={e => setMoveForm({...moveForm, unitCost: parseFloat(e.target.value) || 0})} required /></div>
            </div>
            <div className="space-y-2"><Label>Notes (Optional)</Label><Input value={moveForm.notes} onChange={e => setMoveForm({...moveForm, notes: e.target.value})} placeholder="e.g. Bought from local shop" /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Update Stock</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}