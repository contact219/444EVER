import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  DollarSign, ShoppingCart, TrendingUp, AlertTriangle,
  RotateCcw, Plus, Tag, ArrowRight
} from "lucide-react";
import { adminGet, formatMoney, formatDateTime } from "@/lib/admin";

type KPIs = {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  refundedAmount: number;
  lowStockCount: number;
};

type Activity = {
  type: string;
  description: string;
  createdAt: string;
};

export default function AdminOverview() {
  const { data: kpis, isLoading: kLoading } = useQuery<KPIs>({
    queryKey: ["/api/admin/kpis", 30],
    queryFn: () => adminGet("/api/admin/kpis?days=30"),
  });

  const { data: kpis7 } = useQuery<KPIs>({
    queryKey: ["/api/admin/kpis", 7],
    queryFn: () => adminGet("/api/admin/kpis?days=7"),
  });

  const { data: kpisToday } = useQuery<KPIs>({
    queryKey: ["/api/admin/kpis", 1],
    queryFn: () => adminGet("/api/admin/kpis?days=1"),
  });

  const { data: activity } = useQuery<Activity[]>({
    queryKey: ["/api/admin/recent-activity"],
    queryFn: () => adminGet("/api/admin/recent-activity"),
  });

  const { data: topProducts } = useQuery<{ productName: string; revenue: number; quantity: number }[]>({
    queryKey: ["/api/admin/top-products"],
    queryFn: () => adminGet("/api/admin/top-products?days=30&limit=5"),
  });

  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Overview</h1>
        <div className="flex gap-2">
          <Link href="/admin/products">
            <Button size="sm" data-testid="quick-create-product">
              <Plus className="w-4 h-4 mr-1" /> Product
            </Button>
          </Link>
          <Link href="/admin/promotions">
            <Button size="sm" variant="outline" data-testid="quick-create-promo">
              <Tag className="w-4 h-4 mr-1" /> Promo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-5" data-testid="kpi-revenue">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Revenue (30d)</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{formatMoney(kpis?.revenue || 0)}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>7d: {formatMoney(kpis7?.revenue || 0)}</span>
                <span>Today: {formatMoney(kpisToday?.revenue || 0)}</span>
              </div>
            </Card>
            <Card className="p-5" data-testid="kpi-orders">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Orders (30d)</span>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{kpis?.orderCount || 0}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>7d: {kpis7?.orderCount || 0}</span>
                <span>Today: {kpisToday?.orderCount || 0}</span>
              </div>
            </Card>
            <Card className="p-5" data-testid="kpi-aov">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Order Value</span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{formatMoney(kpis?.avgOrderValue || 0)}</p>
            </Card>
            <Card className="p-5" data-testid="kpi-low-stock">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Low Stock Items</span>
                <AlertTriangle className={`w-4 h-4 ${(kpis?.lowStockCount || 0) > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <p className="text-2xl font-bold">{kpis?.lowStockCount || 0}</p>
              {(kpis?.lowStockCount || 0) > 0 && (
                <Link href="/admin/inventory">
                  <span className="text-xs text-primary cursor-pointer hover:underline mt-1 inline-block">View alerts →</span>
                </Link>
              )}
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Top Products (30d)</h3>
            <Link href="/admin/reports">
              <span className="text-xs text-primary cursor-pointer hover:underline">Full report →</span>
            </Link>
          </div>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                    <span className="font-medium">{p.productName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatMoney(p.revenue)}</span>
                    <span className="text-muted-foreground ml-2">({p.quantity} sold)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sales data yet</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Recent Activity</h3>
          </div>
          {activity && activity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === "order" ? "bg-blue-500" : "bg-gray-400"}`} />
                  <div className="min-w-0">
                    <p className="truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </Card>
      </div>

      {kpis && (kpis.refundedAmount > 0) && (
        <Card className="p-5 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium">Refunds (30d): {formatMoney(kpis.refundedAmount)}</p>
              <p className="text-sm text-muted-foreground">Monitor refund trends in the Reports section</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
