import { useState, useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2, LogOut,
  LayoutDashboard, ShoppingCart, Package, Boxes,
  Users, Tag, BarChart3, Settings, ScrollText,
  Menu, X, Flame, Target, Zap, TrendingUp,
  UserCog, Star
} from "lucide-react";
import { setAdminToken, clearAdminToken, isAdminAuthenticated } from "@/lib/admin";
import AdminOverview from "./admin/overview";
import AdminOrders from "./admin/orders";
import AdminOrderDetail from "./admin/order-detail";
import AdminProducts from "./admin/products";
import AdminInventory from "./admin/inventory";
import AdminCustomers from "./admin/customers";
import AdminCustomerDetail from "./admin/customer-detail";
import AdminPromotions from "./admin/promotions";
import AdminReports from "./admin/reports";
import AdminSettings from "./admin/settings";
import AdminAuditLogs from "./admin/audit-logs";
import AdminSegments from "./admin/segments";
import AdminAutomations from "./admin/automations";
import AdminDrops from "./admin/drops";
import AdminPromoPerformance from "./admin/promo-performance";
import AdminUsers from "./admin/admin-users";
import AdminReviews from "./admin/reviews-admin";

const navItems = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/inventory", label: "Inventory", icon: Boxes },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/segments", label: "Segments", icon: Target },
  { path: "/admin/drops", label: "Drops", icon: Flame },
  { path: "/admin/promotions", label: "Promotions", icon: Tag },
  { path: "/admin/promo-performance", label: "Promo Performance", icon: TrendingUp },
  { path: "/admin/automations", label: "Automations", icon: Zap },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  { path: "/admin/admin-users", label: "Admin Users", icon: UserCog },
  { path: "/admin/settings", label: "Settings", icon: Settings },
  { path: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        setAdminToken(data.token);
        onLogin();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4" data-testid="page-admin-login">
      <Card className="p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">444 EVER Candle Company</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-admin-password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function AdminSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="font-heading text-lg font-bold">444 EVER</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path ||
              (item.path !== "/admin" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path} onClick={onClose}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted cursor-pointer" data-testid="nav-storefront">
              <Package className="w-4 h-4" />
              View Storefront
            </div>
          </Link>
          <button
            onClick={() => { clearAdminToken(); window.location.href = "/admin"; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-muted/30">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 lg:px-6 gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-md hover:bg-muted"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-heading text-lg font-semibold">Admin Dashboard</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Switch>
            <Route path="/admin" component={AdminOverview} />
            <Route path="/admin/orders/:id" component={AdminOrderDetail} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/products" component={AdminProducts} />
            <Route path="/admin/inventory" component={AdminInventory} />
            <Route path="/admin/customers/:id" component={AdminCustomerDetail} />
            <Route path="/admin/customers" component={AdminCustomers} />
            <Route path="/admin/segments" component={AdminSegments} />
            <Route path="/admin/drops" component={AdminDrops} />
            <Route path="/admin/promotions" component={AdminPromotions} />
            <Route path="/admin/promo-performance" component={AdminPromoPerformance} />
            <Route path="/admin/automations" component={AdminAutomations} />
            <Route path="/admin/reviews" component={AdminReviews} />
            <Route path="/admin/admin-users" component={AdminUsers} />
            <Route path="/admin/reports" component={AdminReports} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/admin/audit-logs" component={AdminAuditLogs} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated());

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminLayout />;
}
