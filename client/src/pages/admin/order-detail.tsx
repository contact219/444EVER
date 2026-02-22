import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Package, Truck, MessageSquare, RotateCcw,
  Clock, Loader2, Send, MapPin, Mail, User
} from "lucide-react";
import { adminGet, adminPatch, adminPost, formatMoney, formatDateTime } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderItem, OrderNote, OrderEvent } from "@shared/schema";

type OrderDetail = Order & {
  items: OrderItem[];
  notes: OrderNote[];
  events: OrderEvent[];
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
};

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/orders/:id");
  const orderId = params?.id || "";
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["/api/admin/orders", orderId],
    queryFn: () => adminGet(`/api/admin/orders/${orderId}`),
    enabled: !!orderId,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => adminPatch(`/api/admin/orders/${orderId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Status updated" });
    },
  });

  const addTracking = useMutation({
    mutationFn: () => adminPatch(`/api/admin/orders/${orderId}`, { trackingNumber: tracking, carrier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setTracking(""); setCarrier("");
      toast({ title: "Tracking added" });
    },
  });

  const addNote = useMutation({
    mutationFn: () => adminPost(`/api/admin/orders/${orderId}/notes`, { content: noteText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setNoteText("");
      toast({ title: "Note added" });
    },
  });

  const processRefund = useMutation({
    mutationFn: () => adminPost(`/api/admin/orders/${orderId}/refund`, {
      amountCents: refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined,
      reason: refundReason,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setRefundAmount(""); setRefundReason("");
      toast({ title: "Refund processed" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found</p>;
  }

  return (
    <div className="space-y-6" data-testid="admin-order-detail">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" data-testid="button-back-orders">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-xl font-heading font-bold">Order #{order.id.slice(0, 8)}</h1>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${statusColors[order.status]}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" /> Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">{item.variantLabel} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatMoney(item.lineTotalCents)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotalCents)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{formatMoney(order.shippingCents)}</span></div>
              {order.discountCents > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatMoney(order.discountCents)}</span></div>}
              {order.taxCents > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatMoney(order.taxCents)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>{formatMoney(order.totalCents)}</span></div>
              {order.refundedCents > 0 && <div className="flex justify-between text-orange-600"><span>Refunded</span><span>-{formatMoney(order.refundedCents)}</span></div>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Shipping & Tracking
            </h3>
            {order.trackingNumber ? (
              <div className="text-sm mb-4">
                <p><span className="text-muted-foreground">Carrier:</span> {order.carrier || "N/A"}</p>
                <p><span className="text-muted-foreground">Tracking:</span> {order.trackingNumber}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No tracking info yet</p>
            )}
            <div className="flex gap-2">
              <Input placeholder="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="w-32" data-testid="input-carrier" />
              <Input placeholder="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} className="flex-1" data-testid="input-tracking" />
              <Button size="sm" onClick={() => addTracking.mutate()} disabled={!tracking || addTracking.isPending} data-testid="button-add-tracking">
                {addTracking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Internal Notes
            </h3>
            {order.notes && order.notes.length > 0 ? (
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {order.notes.map((n) => (
                  <div key={n.id} className="text-sm bg-muted/50 rounded-lg p-3">
                    <p>{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.authorName} · {formatDateTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 min-h-[60px]"
                data-testid="textarea-note"
              />
              <Button size="sm" onClick={() => addNote.mutate()} disabled={!noteText.trim() || addNote.isPending} className="self-end" data-testid="button-add-note">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Refund
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Amount ($)" type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-32" data-testid="input-refund-amount" />
              <Input placeholder="Reason (optional)" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="flex-1" data-testid="input-refund-reason" />
              <Button size="sm" variant="destructive" onClick={() => processRefund.mutate()} disabled={processRefund.isPending} data-testid="button-process-refund">
                {processRefund.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process Refund"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Leave amount blank for full refund ({formatMoney(order.totalCents)})</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3">Status</h3>
            <Select value={order.status} onValueChange={(val) => updateStatus.mutate(val)}>
              <SelectTrigger data-testid="select-order-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Customer</h3>
            <div className="text-sm space-y-2">
              <p className="font-medium">{order.name}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" />{order.email}</p>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5" />
                <div>
                  <p>{order.address1}</p>
                  {order.address2 && <p>{order.address2}</p>}
                  <p>{order.city}, {order.state} {order.postalCode}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {order.events && order.events.length > 0 ? order.events.map((e) => (
                <div key={e.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p>{e.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No events yet</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-3">Details</h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Order ID: <span className="font-mono text-xs">{order.id}</span></p>
              <p>Created: {formatDateTime(order.createdAt)}</p>
              {order.promoCode && <p>Promo: {order.promoCode}</p>}
              {order.stripeChargeId && <p>Stripe: {order.stripeChargeId}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
