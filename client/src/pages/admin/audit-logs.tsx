import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Search } from "lucide-react";
import { adminGet, formatDateTime } from "@/lib/admin";
import type { AuditLog } from "@shared/schema";

const entityColors: Record<string, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  product: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  variant: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  inventory: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  promotion: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
  settings: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
};

export default function AdminAuditLogs() {
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs", entityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (entityFilter !== "all") params.set("entityType", entityFilter);
      return adminGet(`/api/admin/audit-logs?${params.toString()}`);
    },
  });

  const filtered = logs?.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.description || "").toLowerCase().includes(s) || l.entityId.toLowerCase().includes(s) || l.action.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6" data-testid="admin-audit-logs">
      <h1 className="text-2xl font-heading font-bold">Audit Logs</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by description, ID, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-logs"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-entity-filter">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="variant">Variants</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="promotion">Promotions</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-3"><Skeleton className="h-8 w-full" /></Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <Card className="divide-y divide-border">
          {filtered.map((log) => (
            <div key={log.id} className="p-4 hover:bg-muted/30" data-testid={`audit-log-${log.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Badge className={`shrink-0 text-xs ${entityColors[log.entityType] || "bg-gray-100 text-gray-800"}`}>
                    {log.entityType}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{log.description || log.action}</p>
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Action: {log.action}</span>
                      <span>·</span>
                      <span className="font-mono">{log.entityId.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{log.authorName}</span>
                    </div>
                    {(log.beforeData || log.afterData) && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer">View changes</summary>
                        <div className="mt-1 text-xs bg-muted/50 rounded p-2 font-mono overflow-x-auto">
                          {log.beforeData && <div><span className="text-red-500">Before:</span> {log.beforeData}</div>}
                          {log.afterData && <div><span className="text-green-500">After:</span> {log.afterData}</div>}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <ScrollText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No audit logs found</p>
        </Card>
      )}
    </div>
  );
}
