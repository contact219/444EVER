import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Tag, AlertTriangle, Power, BarChart3, Loader2 } from "lucide-react";
import { adminGet, adminPost, adminPatch, formatMoney } from "@/lib/admin";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PromoPerformance = {
  promoCode: string;
  usageCount: number;
  totalRevenue: number;
  totalDiscount: number;
  promoId: string;
  discountType: string;
  discountValue: number;
  active: boolean;
};

function formatDiscountValue(type: string, value: number): string {
  if (type === "PERCENTAGE") return `${value}%`;
  if (type === "FREE_SHIPPING") return "Free Ship";
  return formatMoney(value);
}

function getRoi(revenue: number, discount: number): number {
  if (discount === 0) return revenue > 0 ? Infinity : 0;
  return revenue / discount;
}

function formatRoi(roi: number): string {
  if (roi === Infinity) return "---";
  return `${roi.toFixed(2)}x`;
}

export default function AdminPromoPerformance() {
  const { toast } = useToast();

  const { data: promos, isLoading } = useQuery<PromoPerformance[]>({
    queryKey: ["/api/admin/promo-performance"],
    queryFn: () => adminGet("/api/admin/promo-performance"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ promoId, active }: { promoId: string; active: boolean }) =>
      adminPatch(`/api/admin/promotions/${promoId}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      toast({ title: "Promo status updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const autoStopMutation = useMutation({
    mutationFn: (promoId: string) =>
      adminPost<{ ok: boolean; stopped: boolean; reason?: string }>(
        `/api/admin/promotions/${promoId}/auto-stop`,
        {}
      ),
    onSuccess: (data, promoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      if (data.stopped) {
        toast({
          title: "Promo Auto-Stopped",
          description: data.reason || "Promo was deactivated due to inventory constraints.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Auto-Stop Check Complete", description: "No issues found. Promo remains active." });
      }
    },
    onError: (e: Error) =>
      toast({ title: "Auto-Stop Error", description: e.message, variant: "destructive" }),
  });

  const totals = promos
    ? promos.reduce(
        (acc, p) => ({
          usageCount: acc.usageCount + p.usageCount,
          totalRevenue: acc.totalRevenue + p.totalRevenue,
          totalDiscount: acc.totalDiscount + p.totalDiscount,
        }),
        { usageCount: 0, totalRevenue: 0, totalDiscount: 0 }
      )
    : null;

  const totalRoi = totals ? getRoi(totals.totalRevenue, totals.totalDiscount) : 0;

  return (
    <div className="space-y-6" data-testid="admin-promo-performance">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold">Promo Performance</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      ) : promos && promos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5" data-testid="card-total-revenue">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(totals!.totalRevenue)}</p>
            </Card>
            <Card className="p-5" data-testid="card-total-discount">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Total Discounts Given</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(totals!.totalDiscount)}</p>
            </Card>
            <Card className="p-5" data-testid="card-overall-roi">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${totalRoi >= 1 ? "text-green-500" : "text-red-500"}`} />
                <span className="text-sm text-muted-foreground">Overall ROI</span>
              </div>
              <p className={`text-2xl font-bold ${totalRoi >= 1 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatRoi(totalRoi)}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Performance by Promo</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-promo-performance">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Promo Code</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Discount</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Usage</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Revenue</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Discount Given</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">ROI</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-center">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => {
                    const roi = getRoi(p.totalRevenue, p.totalDiscount);
                    return (
                      <tr
                        key={p.promoId}
                        className="border-b last:border-b-0"
                        data-testid={`row-promo-${p.promoCode}`}
                      >
                        <td className="py-3 pr-4">
                          <span className="font-mono font-bold">{p.promoCode}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate">
                            {p.discountType === "PERCENTAGE"
                              ? "Percent"
                              : p.discountType === "FREE_SHIPPING"
                              ? "Free Ship"
                              : "Fixed"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{formatDiscountValue(p.discountType, p.discountValue)}</td>
                        <td className="py-3 pr-4 text-right">{p.usageCount}</td>
                        <td className="py-3 pr-4 text-right font-medium">{formatMoney(p.totalRevenue)}</td>
                        <td className="py-3 pr-4 text-right font-medium">{formatMoney(p.totalDiscount)}</td>
                        <td className="py-3 pr-4 text-right">
                          <span
                            className={`font-semibold ${
                              roi >= 1
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatRoi(roi)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={p.active}
                              onCheckedChange={(checked) =>
                                toggleMutation.mutate({ promoId: p.promoId, active: checked })
                              }
                              data-testid={`switch-toggle-${p.promoCode}`}
                            />
                            <Badge
                              variant={p.active ? "default" : "secondary"}
                              className="no-default-hover-elevate no-default-active-elevate"
                            >
                              {p.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => autoStopMutation.mutate(p.promoId)}
                            disabled={autoStopMutation.isPending}
                            data-testid={`button-auto-stop-${p.promoCode}`}
                          >
                            {autoStopMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            Auto-Stop
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="pt-3 pr-4">Totals</td>
                    <td className="pt-3 pr-4" />
                    <td className="pt-3 pr-4" />
                    <td className="pt-3 pr-4 text-right">{totals!.usageCount}</td>
                    <td className="pt-3 pr-4 text-right">{formatMoney(totals!.totalRevenue)}</td>
                    <td className="pt-3 pr-4 text-right">{formatMoney(totals!.totalDiscount)}</td>
                    <td className="pt-3 pr-4 text-right">
                      <span
                        className={
                          totalRoi >= 1
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {formatRoi(totalRoi)}
                      </span>
                    </td>
                    <td className="pt-3 pr-4" />
                    <td className="pt-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No promo performance data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create promotions and process orders to see performance metrics here.
          </p>
        </Card>
      )}
    </div>
  );
}
