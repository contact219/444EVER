import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Boxes, Plus, Minus, Loader2, X } from "lucide-react";
import { adminGet, adminPost, formatMoney, formatDateTime } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InventoryAdjustment, Variant } from "@shared/schema";

type InventoryItem = {
  variantId: string;
  productName: string;
  sku: string;
  vessel: string;
  sizeOz: number;
  wickType: string;
  stockOnHand: number;
  stockReserved: number;
  reorderPoint: number;
  priceCents: number;
};

type LowStockVariant = Variant & { productName: string };

export default function AdminInventory() {
  const { toast } = useToast();
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [adjQuantity, setAdjQuantity] = useState("0");
  const [adjReason, setAdjReason] = useState("RESTOCK");
  const [adjNotes, setAdjNotes] = useState("");

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/inventory"],
    queryFn: () => adminGet("/api/admin/inventory"),
  });

  const { data: lowStock } = useQuery<LowStockVariant[]>({
    queryKey: ["/api/admin/inventory/low-stock"],
    queryFn: () => adminGet("/api/admin/inventory/low-stock"),
  });

  const { data: adjustments } = useQuery<InventoryAdjustment[]>({
    queryKey: ["/api/admin/inventory/adjustments"],
    queryFn: () => adminGet("/api/admin/inventory/adjustments"),
  });

  const adjustMutation = useMutation({
    mutationFn: () => adminPost("/api/admin/inventory/adjust", {
      variantId: adjusting!.variantId,
      quantityChange: parseInt(adjQuantity),
      reason: adjReason,
      notes: adjNotes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setAdjusting(null);
      setAdjQuantity("0"); setAdjReason("RESTOCK"); setAdjNotes("");
      toast({ title: "Stock adjusted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6" data-testid="admin-inventory">
      <h1 className="text-2xl font-heading font-bold">Inventory</h1>

      {lowStock && lowStock.length > 0 && (
        <Card className="p-4 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-orange-800 dark:text-orange-300">Low Stock Alerts ({lowStock.length})</h3>
          </div>
          <div className="space-y-1">
            {lowStock.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span>{v.productName} - {v.vessel} {v.sizeOz}oz ({v.sku || "N/A"})</span>
                <Badge variant="destructive">{v.stockOnHand} left</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {adjusting && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Adjust Stock: {adjusting.productName} ({adjusting.sku || adjusting.vessel})</h3>
            <button onClick={() => setAdjusting(null)}><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Current stock: {adjusting.stockOnHand}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Quantity Change</Label>
              <Input type="number" value={adjQuantity} onChange={(e) => setAdjQuantity(e.target.value)} data-testid="input-adj-quantity" />
              <p className="text-xs text-muted-foreground mt-1">Positive = add, Negative = remove</p>
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={adjReason} onValueChange={setAdjReason}>
                <SelectTrigger data-testid="select-adj-reason"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTOCK">Restock</SelectItem>
                  <SelectItem value="DAMAGE">Damage</SelectItem>
                  <SelectItem value="CORRECTION">Correction</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="SALE">Manual Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={parseInt(adjQuantity) === 0 || adjustMutation.isPending} data-testid="button-submit-adjustment">
              {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Adjustment"}
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-4"><Skeleton className="h-40 w-full" /></Card>
      ) : inventory && inventory.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Variant</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">On Hand</th>
                  <th className="text-right p-3 font-medium">Reorder At</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item) => (
                  <tr key={item.variantId} className="hover:bg-muted/30" data-testid={`inventory-row-${item.variantId}`}>
                    <td className="p-3 font-medium">{item.productName}</td>
                    <td className="p-3 font-mono text-xs">{item.sku || "-"}</td>
                    <td className="p-3">{item.vessel} · {item.sizeOz}oz · {item.wickType}</td>
                    <td className="p-3 text-right">{formatMoney(item.priceCents)}</td>
                    <td className="p-3 text-right">
                      <span className={item.stockOnHand <= item.reorderPoint ? "text-orange-600 font-semibold" : ""}>{item.stockOnHand}</span>
                    </td>
                    <td className="p-3 text-right">{item.reorderPoint}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setAdjusting(item)} data-testid={`button-adjust-${item.variantId}`}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Boxes className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No inventory data</p>
        </Card>
      )}

      {adjustments && adjustments.length > 0 && (
        <Card className="p-5">
          <h3 className="font-heading font-semibold mb-4">Recent Adjustments</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {adjustments.slice(0, 20).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <span className={a.quantityChange > 0 ? "text-green-600" : "text-red-600"}>
                    {a.quantityChange > 0 ? "+" : ""}{a.quantityChange}
                  </span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span>{a.reason}</span>
                  {a.notes && <span className="text-muted-foreground ml-2">({a.notes})</span>}
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
