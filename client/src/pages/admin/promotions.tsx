import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Tag, Loader2, X, Pencil } from "lucide-react";
import { adminGet, adminPost, adminPatch, adminDelete, formatMoney, formatDate } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Promotion } from "@shared/schema";

function PromoForm({ promo, onClose }: { promo?: Promotion; onClose: () => void }) {
  const { toast } = useToast();
  const isEdit = !!promo;
  const [form, setForm] = useState({
    code: promo?.code || "",
    description: promo?.description || "",
    discountType: promo?.discountType || "PERCENTAGE",
    discountValue: promo?.discountValue || 10,
    minSpendCents: promo?.minSpendCents || null as number | null,
    maxUsageCount: promo?.maxUsageCount || null as number | null,
    customerEmail: promo?.customerEmail || "",
    active: promo?.active ?? true,
    startsAt: promo?.startsAt ? new Date(promo.startsAt).toISOString().slice(0, 16) : "",
    endsAt: promo?.endsAt ? new Date(promo.endsAt).toISOString().slice(0, 16) : "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt) : null,
        endsAt: form.endsAt ? new Date(form.endsAt) : null,
        customerEmail: form.customerEmail || null,
      };
      if (isEdit) return adminPatch(`/api/admin/promotions/${promo.id}`, payload);
      return adminPost("/api/admin/promotions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      toast({ title: isEdit ? "Promotion updated" : "Promotion created" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Code</Label>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" data-testid="input-promo-code" />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="20% off your order" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
            <SelectTrigger data-testid="select-discount-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Fixed Amount ($)</SelectItem>
              <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{form.discountType === "PERCENTAGE" ? "Discount %" : form.discountType === "FREE_SHIPPING" ? "N/A" : "Amount (cents)"}</Label>
          <Input
            type="number"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: parseInt(e.target.value) || 0 })}
            disabled={form.discountType === "FREE_SHIPPING"}
            data-testid="input-discount-value"
          />
        </div>
        <div>
          <Label>Min Spend ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.minSpendCents ? (form.minSpendCents / 100).toFixed(2) : ""}
            onChange={(e) => setForm({ ...form, minSpendCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
            placeholder="No minimum"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Max Uses</Label>
          <Input
            type="number"
            value={form.maxUsageCount || ""}
            onChange={(e) => setForm({ ...form, maxUsageCount: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Unlimited"
          />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Customer Email (leave blank for all)</Label>
        <Input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="specific@customer.com" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="switch-promo-active" />
        <Label>Active</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={!form.code || mutation.isPending} data-testid="button-save-promo">
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPromotions() {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const { data: promos, isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/admin/promotions"],
    queryFn: () => adminGet("/api/admin/promotions"),
  });

  const deletePromo = useMutation({
    mutationFn: (id: string) => adminDelete(`/api/admin/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      toast({ title: "Promotion deleted" });
    },
  });

  return (
    <div className="space-y-6" data-testid="admin-promotions">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Promotions</h1>
        <Button onClick={() => setCreating(true)} data-testid="button-create-promo">
          <Plus className="w-4 h-4 mr-1" /> New Promotion
        </Button>
      </div>

      {(creating || editing) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{editing ? "Edit Promotion" : "New Promotion"}</h3>
            <button onClick={() => { setCreating(false); setEditing(null); }}><X className="w-4 h-4" /></button>
          </div>
          <PromoForm promo={editing || undefined} onClose={() => { setCreating(false); setEditing(null); }} />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      ) : promos && promos.length > 0 ? (
        <div className="space-y-3">
          {promos.map((p) => (
            <Card key={p.id} className="p-5" data-testid={`promo-card-${p.code}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-bold text-lg">{p.code}</span>
                    <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
                    <Badge variant="outline">
                      {p.discountType === "PERCENTAGE" ? `${p.discountValue}% off` :
                       p.discountType === "FREE_SHIPPING" ? "Free Shipping" :
                       `${formatMoney(p.discountValue)} off`}
                    </Badge>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>Used: {p.usedCount}{p.maxUsageCount ? `/${p.maxUsageCount}` : ""}</span>
                    {p.minSpendCents && <span>Min: {formatMoney(p.minSpendCents)}</span>}
                    {p.startsAt && <span>From: {formatDate(p.startsAt)}</span>}
                    {p.endsAt && <span>Until: {formatDate(p.endsAt)}</span>}
                    {p.customerEmail && <span>For: {p.customerEmail}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete promo "${p.code}"?`)) deletePromo.mutate(p.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No promotions yet</p>
        </Card>
      )}
    </div>
  );
}
