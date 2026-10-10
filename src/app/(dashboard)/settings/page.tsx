"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Building2, Ruler, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"; // Make sure to install this if missing: npx shadcn@latest add separator

interface SettingsData {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  bighaToAcreConversion: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    businessName: "", ownerName: "", phone: "", address: "", bighaToAcreConversion: 0.625
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setIsSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Hide success message after 3s
      } else {
        alert("Failed to save settings.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and local unit configurations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Business Profile
            </CardTitle>
            <CardDescription>
              This information will appear on your printed receipts and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={settings.businessName} onChange={e => setSettings({...settings, businessName: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input id="ownerName" value={settings.ownerName} onChange={e => setSettings({...settings, ownerName: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input id="phone" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input id="address" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Local Units */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" /> Local Unit Conversions
            </CardTitle>
            <CardDescription>
              Configure how local land measurements convert to standard units.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bighaToAcre">1 Bigha = ? Acres</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="bighaToAcre" 
                  type="number" 
                  step="0.001" 
                  value={settings.bighaToAcreConversion} 
                  onChange={e => setSettings({...settings, bighaToAcreConversion: parseFloat(e.target.value) || 0})} 
                  required 
                  className="max-w-[200px]"
                />
                <span className="text-sm text-muted-foreground">Acres (Standard in Gujarat varies from 0.4 to 0.625)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Action */}
        <div className="flex items-center justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
          {isSaved && (
            <div className="flex items-center text-sm text-green-600 font-medium animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle className="mr-2 h-4 w-4" /> Settings saved successfully!
            </div>
          )}
          <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 min-w-[120px]">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}