import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, Loader2 } from "lucide-react";
import { adminGet, adminPatch } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SettingsData = Record<string, string>;

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsData>({});

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => adminGet("/api/admin/settings"),
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => adminPatch("/api/admin/settings", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-settings">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save All
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="font-heading font-semibold mb-4">Store Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Store Name</Label>
            <Input value={form.storeName || ""} onChange={(e) => setField("storeName", e.target.value)} placeholder="444 EVER Candle Company" data-testid="input-store-name" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input value={form.storeEmail || ""} onChange={(e) => setField("storeEmail", e.target.value)} placeholder="hello@444ever.com" data-testid="input-store-email" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.storePhone || ""} onChange={(e) => setField("storePhone", e.target.value)} placeholder="(555) 444-3837" />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.storeAddress || ""} onChange={(e) => setField("storeAddress", e.target.value)} placeholder="123 Candle Lane, Sweet City" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-heading font-semibold mb-4">Shipping & Tax</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Flat-Rate Shipping ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.shippingFlatCents ? (parseInt(form.shippingFlatCents) / 100).toFixed(2) : ""}
              onChange={(e) => setField("shippingFlatCents", String(Math.round(parseFloat(e.target.value || "0") * 100)))}
              placeholder="8.00"
              data-testid="input-shipping-rate"
            />
          </div>
          <div>
            <Label>Free Shipping Threshold ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.freeShippingThresholdCents ? (parseInt(form.freeShippingThresholdCents) / 100).toFixed(2) : ""}
              onChange={(e) => setField("freeShippingThresholdCents", String(Math.round(parseFloat(e.target.value || "0") * 100)))}
              placeholder="50.00"
            />
          </div>
          <div>
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.taxRatePercent || ""}
              onChange={(e) => setField("taxRatePercent", e.target.value)}
              placeholder="0"
              data-testid="input-tax-rate"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-heading font-semibold mb-4">Branding</h3>
        <div className="space-y-4">
          <div>
            <Label>Invoice Footer</Label>
            <Textarea
              value={form.invoiceFooter || ""}
              onChange={(e) => setField("invoiceFooter", e.target.value)}
              placeholder="Thank you for your purchase! 444 EVER Candle Company"
            />
          </div>
          <div>
            <Label>Email Footer</Label>
            <Textarea
              value={form.emailFooter || ""}
              onChange={(e) => setField("emailFooter", e.target.value)}
              placeholder="Follow us on Instagram @444EverCandles"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
