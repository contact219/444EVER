import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Eye } from "lucide-react";
import { adminGet, formatMoney, formatDate } from "@/lib/admin";
import type { Customer } from "@shared/schema";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
    queryFn: () => adminGet("/api/admin/customers"),
  });

  const filtered = customers?.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.tags || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6" data-testid="admin-customers">
      <h1 className="text-2xl font-heading font-bold">Customers</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-customers"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-12 w-full" /></Card>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-right p-3 font-medium">Orders</th>
                  <th className="text-right p-3 font-medium">Total Spent</th>
                  <th className="text-left p-3 font-medium">Tags</th>
                  <th className="text-left p-3 font-medium">Last Order</th>
                  <th className="text-right p-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30" data-testid={`customer-row-${c.id}`}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.email}</td>
                    <td className="p-3 text-right">{c.totalOrderCount}</td>
                    <td className="p-3 text-right font-semibold">{formatMoney(c.totalSpentCents)}</td>
                    <td className="p-3">
                      {c.tags && c.tags.split(",").map((t, i) => (
                        <Badge key={i} variant="secondary" className="mr-1 text-xs">{t.trim()}</Badge>
                      ))}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "-"}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/customers/${c.id}`}>
                        <span className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No customers yet</p>
        </Card>
      )}
    </div>
  );
}
