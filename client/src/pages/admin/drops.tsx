import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Clock, Bell, Users, Mail, Loader2, CalendarClock } from "lucide-react";
import { adminGet, adminPost, formatDate, formatDateTime } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithVariants, WaitlistEntry } from "@shared/schema";

export default function AdminDrops() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/admin/products"],
    queryFn: () => adminGet("/api/admin/products"),
  });

  const waitlistUrl = selectedProductId && selectedProductId !== "all"
    ? `/api/admin/waitlist?productId=${selectedProductId}`
    : "/api/admin/waitlist";

  const { data: waitlistEntries, isLoading: waitlistLoading } = useQuery<WaitlistEntry[]>({
    queryKey: ["/api/admin/waitlist", selectedProductId],
    queryFn: () => adminGet(waitlistUrl),
  });

  const notifyMutation = useMutation({
    mutationFn: (id: string) => adminPost(`/api/admin/waitlist/${id}/notify`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/waitlist"] });
      toast({ title: "Marked as notified" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const limitedProducts = products?.filter(
    (p) => p.isLimitedEdition || p.scheduledAt
  ) || [];

  const productMap = new Map(products?.map((p) => [p.id, p]) || []);

  const waitlistCounts = new Map<string, number>();
  waitlistEntries?.forEach((e) => {
    waitlistCounts.set(e.productId, (waitlistCounts.get(e.productId) || 0) + 1);
  });

  return (
    <div className="space-y-8" data-testid="admin-drops">
      <h1 className="text-2xl font-heading font-bold">Drops & Waitlist</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-heading font-semibold">Limited Edition Drops</h2>
          </div>

          {productsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>
              ))}
            </div>
          ) : limitedProducts.length > 0 ? (
            <div className="space-y-3">
              {limitedProducts.map((product) => {
                const totalCap = product.variants.reduce((sum, v) => sum + (v.quantityCap || 0), 0);
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockOnHand, 0);
                const count = waitlistCounts.get(product.id) || 0;

                return (
                  <Card key={product.id} className="p-5" data-testid={`drop-card-${product.id}`}>
                    <div className="flex gap-4">
                      {product.imageUrl && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-heading font-semibold">{product.name}</span>
                          {product.isLimitedEdition && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              <Flame className="w-3 h-3 mr-1" /> Limited Edition
                            </Badge>
                          )}
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                          {product.scheduledAt && (
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>Launch: {formatDateTime(product.scheduledAt)}</span>
                            </div>
                          )}
                          {totalCap > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Qty Cap: {totalCap} total across {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Stock: {totalStock} on hand</span>
                          </div>
                          {count > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{count} waitlist entr{count !== 1 ? "ies" : "y"}</span>
                            </div>
                          )}
                        </div>

                        {product.variants.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {product.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-3 py-1.5">
                                <span>{v.vessel} · {v.sizeOz}oz · {v.sku || "no SKU"}</span>
                                <div className="flex items-center gap-3">
                                  {v.quantityCap && (
                                    <span className="text-muted-foreground">Cap: {v.quantityCap}</span>
                                  )}
                                  <span className="text-muted-foreground">Stock: {v.stockOnHand}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Flame className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No limited edition or scheduled drops</p>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-heading font-semibold">Waitlist</h2>
              {waitlistEntries && (
                <Badge variant="secondary">{waitlistEntries.length}</Badge>
              )}
            </div>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-48" data-testid="select-waitlist-product">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {waitlistLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4"><Skeleton className="h-14 w-full" /></Card>
              ))}
            </div>
          ) : waitlistEntries && waitlistEntries.length > 0 ? (
            <div className="space-y-2">
              {waitlistEntries.map((entry) => {
                const product = productMap.get(entry.productId);
                return (
                  <Card key={entry.id} className="p-4" data-testid={`waitlist-entry-${entry.id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm truncate" data-testid={`waitlist-email-${entry.id}`}>{entry.email}</span>
                          {entry.notified ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Notified
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{product?.name || entry.productId}</span>
                          <span>Joined {formatDate(entry.createdAt)}</span>
                        </div>
                      </div>
                      {!entry.notified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => notifyMutation.mutate(entry.id)}
                          disabled={notifyMutation.isPending}
                          data-testid={`button-notify-${entry.id}`}
                        >
                          {notifyMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Bell className="w-3 h-3 mr-1" />
                              Mark Notified
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No waitlist entries</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
