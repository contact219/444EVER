import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Download, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { adminGet, formatMoney } from "@/lib/admin";

type ReportData = {
  byDay: { date: string; revenue: number; orders: number }[];
  topProducts: { productName: string; revenue: number; quantity: number }[];
  kpis: { revenue: number; orderCount: number; avgOrderValue: number; refundedAmount: number; lowStockCount: number };
};

function SimpleBarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-20 text-right text-muted-foreground shrink-0 truncate">{d.label}</span>
          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${maxValue > 0 ? (d.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className="w-20 font-medium shrink-0">{formatMoney(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReports() {
  const [days, setDays] = useState("30");

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/admin/reports/sales", days],
    queryFn: () => adminGet(`/api/admin/reports/sales?days=${days}`),
  });

  function exportCSV() {
    if (!report) return;
    const rows = [
      ["Date", "Revenue ($)", "Orders"],
      ...report.byDay.map(d => [d.date, (d.revenue / 100).toFixed(2), String(d.orders)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6" data-testid="admin-reports">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36" data-testid="select-report-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} disabled={!report} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(report.kpis.revenue)}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Orders</span>
              </div>
              <p className="text-2xl font-bold">{report.kpis.orderCount}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Avg Order Value</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(report.kpis.avgOrderValue)}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Revenue by Day</h3>
            {report.byDay.length > 0 ? (
              <SimpleBarChart
                data={report.byDay.slice(-14).map(d => ({
                  label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  value: d.revenue,
                }))}
                maxValue={Math.max(...report.byDay.map(d => d.revenue), 1)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No sales data for this period</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Top Products by Revenue</h3>
            {report.topProducts.length > 0 ? (
              <div className="space-y-3">
                {report.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="font-medium">{p.productName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{p.quantity} units</span>
                      <span className="font-semibold w-24 text-right">{formatMoney(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No product data for this period</p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
