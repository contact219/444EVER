import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, MapPin, DollarSign, ShoppingCart, Save, Loader2 } from "lucide-react";
import { adminGet, adminPatch, formatMoney, formatDate } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Order, OrderItem } from "@shared/schema";

type CustomerDetail = Customer & { orders: (Order & { items: OrderItem[] })[] };

export default function AdminCustomerDetail() {
  const [, params] = useRoute("/admin/customers/:id");
  const customerId = params?.id || "";
  const { toast } = useToast();
  const [editTags, setEditTags] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: ["/api/admin/customers", customerId],
    queryFn: () => adminGet(`/api/admin/customers/${customerId}`),
    enabled: !!customerId,
  });

  const updateCustomer = useMutation({
    mutationFn: (data: any) => adminPatch(`/api/admin/customers/${customerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setEditTags(null);
      setEditNotes(null);
      toast({ title: "Customer updated" });
    },
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!customer) {
    return <p className="text-muted-foreground">Customer not found</p>;
  }

  const avgOrderValue = customer.totalOrderCount > 0
    ? Math.round(customer.totalSpentCents / customer.totalOrderCount)
    : 0;

  return (
    <div className="space-y-6" data-testid="admin-customer-detail">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-xl font-heading font-bold">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Orders</span>
          </div>
          <p className="text-2xl font-bold">{customer.totalOrderCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Total Spent</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(customer.totalSpentCents)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-muted-foreground">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold">{formatMoney(avgOrderValue)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Order History</h3>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="space-y-3">
                {customer.orders.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`}>
                    <div className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded">
                      <div>
                        <span className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</span>
                        <span className="ml-2">{o.items?.length || 0} item(s)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                        <span className="font-semibold">{formatMoney(o.totalCents)}</span>
                        <span className="text-muted-foreground">{formatDate(o.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3">Contact</h3>
            <div className="text-sm space-y-2">
              <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {customer.email}</p>
              {customer.phone && <p>{customer.phone}</p>}
              {customer.address1 && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 mt-0.5" />
                  <div>
                    <p>{customer.address1}</p>
                    {customer.address2 && <p>{customer.address2}</p>}
                    <p>{customer.city}, {customer.state} {customer.postalCode}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3">Tags</h3>
            {editTags !== null ? (
              <div className="space-y-2">
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="VIP, Wholesale, Influencer" data-testid="input-customer-tags" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCustomer.mutate({ tags: editTags })} disabled={updateCustomer.isPending}>
                    {updateCustomer.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditTags(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                {customer.tags ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {customer.tags.split(",").map((t, i) => (
                      <Badge key={i} variant="secondary">{t.trim()}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-2">No tags</p>
                )}
                <button className="text-xs text-primary hover:underline" onClick={() => setEditTags(customer.tags || "")}>Edit tags</button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3">Notes</h3>
            {editNotes !== null ? (
              <div className="space-y-2">
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." data-testid="input-customer-notes" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCustomer.mutate({ notes: editNotes })} disabled={updateCustomer.isPending}>
                    {updateCustomer.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditNotes(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                {customer.notes ? <p className="text-sm mb-2">{customer.notes}</p> : <p className="text-sm text-muted-foreground mb-2">No notes</p>}
                <button className="text-xs text-primary hover:underline" onClick={() => setEditNotes(customer.notes || "")}>Edit notes</button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
