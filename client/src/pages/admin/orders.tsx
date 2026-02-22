import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Search, Eye, Loader2 } from "lucide-react";
import { adminGet, formatMoney, formatDate } from "@/lib/admin";
import type { Order, OrderItem } from "@shared/schema";

type OrderWithItems = Order & { items: OrderItem[] };

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  FULFILLED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  REFUNDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return adminGet(`/api/admin/orders?${params.toString()}`);
    },
  });

  const filtered = orders?.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.name.toLowerCase().includes(s) || o.email.toLowerCase().includes(s) || o.id.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6" data-testid="admin-orders">
      <h1 className="text-2xl font-heading font-bold">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-orders"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FULFILLED">Fulfilled</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" data-testid={`order-row-${order.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}...</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="font-semibold mt-1">{order.name}</p>
                    <p className="text-sm text-muted-foreground">{order.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(order.totalCents)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{order.items?.length || 0} item(s)</p>
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No orders found</p>
        </Card>
      )}
    </div>
  );
}
