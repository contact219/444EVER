import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";

const adminTokens = new Set<string>();

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-admin-token"] as string;
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const checkoutSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().positive(),
      productName: z.string().optional(),
      variantLabel: z.string().optional(),
    })
  ).min(1, "Cart cannot be empty"),
});

async function logAudit(entityType: string, entityId: string, action: string, description: string, beforeData?: any, afterData?: any) {
  try {
    await storage.createAuditLog({
      entityType,
      entityId,
      action,
      description,
      authorName: "Admin",
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Public storefront routes ──
  app.get("/api/products", async (_req, res) => {
    try {
      const prods = await storage.getProducts(true);
      res.json(prods);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (_req, res) => {
    try {
      const featured = await storage.getFeaturedProducts();
      res.json(featured);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
      }

      const { email, name, address1, address2, city, state, postalCode, items } = parsed.data;

      let subtotalCents = 0;
      const resolvedItems: { productName: string; variantLabel: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[] = [];

      for (const item of items) {
        const variant = await storage.getVariantById(item.variantId);
        if (!variant) return res.status(400).json({ error: `Invalid variant: ${item.variantId}` });

        const product = await storage.getProductByVariantId(variant.productId);
        const productName = product?.name || "Unknown Product";
        const variantLabel = `${variant.vessel} - ${variant.sizeOz}oz - ${variant.wickType === "WOOD" ? "Wood Wick" : "Cotton Wick"}`;

        const lineTotal = variant.priceCents * item.quantity;
        subtotalCents += lineTotal;
        resolvedItems.push({
          productName, variantLabel,
          quantity: item.quantity,
          unitPriceCents: variant.priceCents,
          lineTotalCents: lineTotal,
        });
      }

      const shippingSetting = await storage.getSetting("shippingFlatCents");
      const shippingCents = shippingSetting ? parseInt(shippingSetting) : 800;
      const totalCents = subtotalCents + shippingCents;

      let customer = await storage.getCustomerByEmail(email);
      if (!customer) {
        customer = await storage.createCustomer({ email, name, address1, address2: address2 || null, city, state, postalCode });
      }

      const order = await storage.createOrder({
        email, name, address1, address2: address2 || null,
        city, state, postalCode,
        subtotalCents, shippingCents, totalCents,
        customerId: customer.id,
      });

      for (const item of resolvedItems) {
        await storage.createOrderItem({ orderId: order.id, ...item });
      }

      await storage.updateCustomer(customer.id, {
        totalOrderCount: (customer.totalOrderCount || 0) + 1,
        totalSpentCents: (customer.totalSpentCents || 0) + totalCents,
        lastOrderAt: new Date(),
      });

      await storage.createOrderEvent({
        orderId: order.id,
        eventType: "ORDER_CREATED",
        description: `Order placed by ${name} (${email})`,
      });

      res.json({ orderId: order.id, total: totalCents });
    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ error: "Checkout failed" });
    }
  });

  // ── Admin Auth ──
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (password === adminPassword) {
      const token = generateToken();
      adminTokens.add(token);
      res.json({ ok: true, token });
    } else {
      res.status(401).json({ ok: false, error: "Invalid password" });
    }
  });

  // ── Admin KPI / Dashboard ──
  app.get("/api/admin/kpis", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const kpis = await storage.getKPIs(days);
      res.json(kpis);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/admin/revenue-chart", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getRevenueByDay(days);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/admin/top-products", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await storage.getTopProducts(days, limit);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/admin/recent-activity", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs({ limit: 20 });
      const recentOrders = await storage.getOrders();
      const activity = [
        ...logs.map(l => ({ type: "audit", description: l.description || l.action, createdAt: l.createdAt })),
        ...recentOrders.slice(0, 10).map(o => ({
          type: "order", description: `Order from ${o.name} - ${(o.totalCents / 100).toFixed(2)}`, createdAt: o.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
      res.json(activity);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // ── Admin Orders ──
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      const allOrders = await storage.getOrders(filters);
      res.json(allOrders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      const items = await storage.getOrders();
      const fullOrder = items.find(o => o.id === order.id);
      const notes = await storage.getOrderNotes(order.id);
      const events = await storage.getOrderEvents(order.id);
      res.json({ ...fullOrder, notes, events });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { status, trackingNumber, carrier } = req.body;
      const before = await storage.getOrderById(req.params.id);
      if (!before) return res.status(404).json({ error: "Order not found" });

      const updateData: any = {};
      if (status && ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].includes(status)) {
        updateData.status = status;
      }
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
      if (carrier !== undefined) updateData.carrier = carrier;

      const updated = await storage.updateOrder(req.params.id, updateData);
      if (!updated) return res.status(404).json({ error: "Order not found" });

      if (status && status !== before.status) {
        await storage.createOrderEvent({
          orderId: before.id,
          eventType: "STATUS_CHANGE",
          description: `Status changed from ${before.status} to ${status}`,
        });
        await logAudit("order", before.id, "status_change", `Order status: ${before.status} → ${status}`, { status: before.status }, { status });
      }

      if (trackingNumber) {
        await storage.createOrderEvent({
          orderId: before.id,
          eventType: "TRACKING_ADDED",
          description: `Tracking: ${carrier || "N/A"} - ${trackingNumber}`,
        });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.post("/api/admin/orders/:id/notes", requireAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Content required" });
      const note = await storage.createOrderNote({
        orderId: req.params.id,
        content,
        authorName: "Admin",
      });
      res.json(note);
    } catch (err) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.post("/api/admin/orders/:id/refund", requireAdmin, async (req, res) => {
    try {
      const { amountCents, reason } = req.body;
      const order = await storage.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const refundAmount = amountCents || order.totalCents;
      await storage.updateOrder(req.params.id, {
        refundedCents: (order.refundedCents || 0) + refundAmount,
        status: refundAmount >= order.totalCents ? "REFUNDED" as any : order.status,
      });

      await storage.createOrderEvent({
        orderId: order.id,
        eventType: "REFUND",
        description: `Refund of $${(refundAmount / 100).toFixed(2)}${reason ? `: ${reason}` : ""}`,
      });

      await logAudit("order", order.id, "refund", `Refund $${(refundAmount / 100).toFixed(2)}`, null, { refundAmount, reason });
      res.json({ ok: true, refundedCents: refundAmount });
    } catch (err) {
      res.status(500).json({ error: "Failed to process refund" });
    }
  });

  // ── Admin Products ──
  app.get("/api/admin/products", requireAdmin, async (_req, res) => {
    try {
      const prods = await storage.getProducts(false);
      res.json(prods);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      await logAudit("product", product.id, "create", `Created product: ${product.name}`);
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const before = await storage.getProductById(req.params.id);
      const updated = await storage.updateProduct(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Product not found" });
      await logAudit("product", updated.id, "update", `Updated product: ${updated.name}`, before, updated);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      await storage.deleteProduct(req.params.id);
      if (product) await logAudit("product", req.params.id, "delete", `Deleted product: ${product.name}`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ── Admin Variants ──
  app.post("/api/admin/products/:productId/variants", requireAdmin, async (req, res) => {
    try {
      const variant = await storage.createVariant({ ...req.body, productId: req.params.productId });
      await logAudit("variant", variant.id, "create", `Created variant: ${variant.sku || variant.id}`);
      res.json(variant);
    } catch (err) {
      res.status(500).json({ error: "Failed to create variant" });
    }
  });

  app.patch("/api/admin/variants/:id", requireAdmin, async (req, res) => {
    try {
      const before = await storage.getVariantById(req.params.id);
      const updated = await storage.updateVariant(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Variant not found" });
      if (before && before.priceCents !== updated.priceCents) {
        await logAudit("variant", updated.id, "price_change", `Price: ${before.priceCents} → ${updated.priceCents}`, { priceCents: before.priceCents }, { priceCents: updated.priceCents });
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update variant" });
    }
  });

  app.delete("/api/admin/variants/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteVariant(req.params.id);
      await logAudit("variant", req.params.id, "delete", `Deleted variant`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  });

  // ── Admin Inventory ──
  app.get("/api/admin/inventory", requireAdmin, async (_req, res) => {
    try {
      const prods = await storage.getProducts(false);
      const inventory = prods.flatMap(p =>
        p.variants.map(v => ({
          variantId: v.id,
          productName: p.name,
          sku: v.sku,
          vessel: v.vessel,
          sizeOz: v.sizeOz,
          wickType: v.wickType,
          stockOnHand: v.stockOnHand,
          stockReserved: v.stockReserved,
          reorderPoint: v.reorderPoint,
          priceCents: v.priceCents,
        }))
      );
      res.json(inventory);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/admin/inventory/low-stock", requireAdmin, async (_req, res) => {
    try {
      const lowStock = await storage.getLowStockVariants();
      res.json(lowStock);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch low stock" });
    }
  });

  app.post("/api/admin/inventory/adjust", requireAdmin, async (req, res) => {
    try {
      const { variantId, quantityChange, reason, notes } = req.body;
      if (!variantId || quantityChange === undefined || !reason) {
        return res.status(400).json({ error: "variantId, quantityChange, reason required" });
      }

      const variant = await storage.getVariantById(variantId);
      if (!variant) return res.status(404).json({ error: "Variant not found" });

      const previousOnHand = variant.stockOnHand;
      const newOnHand = previousOnHand + quantityChange;

      await storage.updateVariantStock(variantId, quantityChange);
      const adj = await storage.createInventoryAdjustment({
        variantId,
        quantityChange,
        reason,
        notes: notes || null,
        previousOnHand,
        newOnHand,
        authorName: "Admin",
      });

      await logAudit("inventory", variantId, "stock_adjustment", `Stock: ${previousOnHand} → ${newOnHand} (${reason})`, { stockOnHand: previousOnHand }, { stockOnHand: newOnHand });
      res.json(adj);
    } catch (err) {
      res.status(500).json({ error: "Failed to adjust inventory" });
    }
  });

  app.get("/api/admin/inventory/adjustments", requireAdmin, async (req, res) => {
    try {
      const variantId = req.query.variantId as string | undefined;
      const adjs = await storage.getInventoryAdjustments(variantId);
      res.json(adjs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch adjustments" });
    }
  });

  // ── Admin Customers ──
  app.get("/api/admin/customers", requireAdmin, async (_req, res) => {
    try {
      const custs = await storage.getCustomers();
      res.json(custs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      const allOrders = await storage.getOrders();
      const customerOrders = allOrders.filter(o => o.email === customer.email);
      res.json({ ...customer, orders: customerOrders });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.patch("/api/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateCustomer(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // ── Admin Categories ──
  app.get("/api/admin/categories", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getCategories());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const cat = await storage.createCategory(req.body);
      res.json(cat);
    } catch (err) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // ── Admin Collections ──
  app.get("/api/admin/collections", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getCollections());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.post("/api/admin/collections", requireAdmin, async (req, res) => {
    try {
      const col = await storage.createCollection(req.body);
      res.json(col);
    } catch (err) {
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  app.delete("/api/admin/collections/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCollection(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // ── Admin Promotions ──
  app.get("/api/admin/promotions", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getPromotions());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  app.post("/api/admin/promotions", requireAdmin, async (req, res) => {
    try {
      const promo = await storage.createPromotion(req.body);
      await logAudit("promotion", promo.id, "create", `Created promo: ${promo.code}`);
      res.json(promo);
    } catch (err) {
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/admin/promotions/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updatePromotion(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Promotion not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  app.delete("/api/admin/promotions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePromotion(req.params.id);
      await logAudit("promotion", req.params.id, "delete", `Deleted promotion`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete promotion" });
    }
  });

  // ── Admin Reports ──
  app.get("/api/admin/reports/sales", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const byDay = await storage.getRevenueByDay(days);
      const topProducts = await storage.getTopProducts(days, 10);
      const kpis = await storage.getKPIs(days);
      res.json({ byDay, topProducts, kpis });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // ── Admin Settings ──
  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    try {
      const keys = ["storeName", "storeEmail", "storePhone", "storeAddress",
        "shippingFlatCents", "freeShippingThresholdCents", "taxRatePercent",
        "invoiceFooter", "emailFooter"];
      const result: Record<string, string> = {};
      for (const key of keys) {
        result[key] = (await storage.getSetting(key)) || "";
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body) as [string, string][];
      for (const [key, value] of entries) {
        await storage.setSetting(key, value);
      }
      await logAudit("settings", "global", "update", `Updated settings: ${entries.map(([k]) => k).join(", ")}`);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ── Admin Audit Logs ──
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.entityType) filters.entityType = req.query.entityType;
      if (req.query.entityId) filters.entityId = req.query.entityId;
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // ── Admin Users ──
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAdminUsers();
      res.json(users.map(u => ({ ...u, passwordHash: undefined })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });

  const createAdminUserSchema = z.object({
    email: z.string().email("Valid email required"),
    name: z.string().min(1, "Name required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["OWNER", "ADMIN", "STAFF", "READONLY"]).optional().default("ADMIN"),
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const parsed = createAdminUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
      const { email, name, password, role } = parsed.data;
      const existing = await storage.getAdminUserByEmail(email);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createAdminUser({ email, name, passwordHash, role });
      await logAudit("admin_user", user.id, "create", `Created admin user: ${email}`);
      res.json({ ...user, passwordHash: undefined });
    } catch (err) {
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { name, role, active, password } = req.body;
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (role !== undefined) data.role = role;
      if (active !== undefined) data.active = active;
      if (password) data.passwordHash = await bcrypt.hash(password, 12);
      const updated = await storage.updateAdminUser(req.params.id, data);
      if (!updated) return res.status(404).json({ error: "User not found" });
      await logAudit("admin_user", updated.id, "update", `Updated admin user: ${updated.email}`);
      res.json({ ...updated, passwordHash: undefined });
    } catch (err) {
      res.status(500).json({ error: "Failed to update admin user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAdminUser(req.params.id);
      await logAudit("admin_user", req.params.id, "delete", "Deleted admin user");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete admin user" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getAdminUserById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const rawToken = generateToken();
      const hashedToken = await bcrypt.hash(rawToken, 10);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.updateAdminUser(user.id, { resetToken: hashedToken, resetTokenExpiresAt: expiresAt });
      res.json({ resetToken: rawToken, expiresAt });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate reset token" });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });
      if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      const allUsers = await storage.getAdminUsers();
      let matchedUser = null;
      for (const u of allUsers) {
        if (u.resetToken && u.resetTokenExpiresAt && new Date(u.resetTokenExpiresAt) > new Date()) {
          const valid = await bcrypt.compare(token, u.resetToken);
          if (valid) { matchedUser = u; break; }
        }
      }
      if (!matchedUser) return res.status(400).json({ error: "Invalid or expired token" });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateAdminUser(matchedUser.id, { passwordHash, resetToken: null, resetTokenExpiresAt: null });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ── Customer Segments & Campaigns ──
  app.get("/api/admin/segments", requireAdmin, async (req, res) => {
    try {
      const segment = (req.query.segment as string) || "all";
      const customers = await storage.getCustomersBySegment(segment);
      res.json(customers);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch segment" });
    }
  });

  app.get("/api/admin/segments/counts", requireAdmin, async (_req, res) => {
    try {
      const [vip, firstTime, inactive, repeat, all] = await Promise.all([
        storage.getCustomersBySegment("vip"),
        storage.getCustomersBySegment("first_time"),
        storage.getCustomersBySegment("inactive"),
        storage.getCustomersBySegment("repeat"),
        storage.getCustomersBySegment("all"),
      ]);
      res.json({ vip: vip.length, first_time: firstTime.length, inactive: inactive.length, repeat: repeat.length, all: all.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch segment counts" });
    }
  });

  app.get("/api/admin/campaigns", requireAdmin, async (_req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  const createCampaignSchema = z.object({
    name: z.string().min(1, "Name required"),
    segment: z.enum(["vip", "first_time", "inactive", "repeat", "all"]),
    subject: z.string().min(1, "Subject required"),
    body: z.string().min(1, "Body required"),
    promoCode: z.string().optional(),
  });

  app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const parsed = createCampaignSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
      const { name, segment, subject, body, promoCode } = parsed.data;
      const recipients = await storage.getCustomersBySegment(segment);
      const campaign = await storage.createCampaign({ name, segment, subject, body, promoCode: promoCode || null, recipientCount: recipients.length, status: "DRAFT" });
      await logAudit("campaign", campaign.id, "create", `Created campaign: ${name} targeting ${segment} (${recipients.length} recipients)`);
      res.json(campaign);
    } catch (err) {
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateCampaign(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Campaign not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.post("/api/admin/campaigns/:id/send", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getCampaignById(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      const recipients = await storage.getCustomersBySegment(campaign.segment);
      await storage.updateCampaign(campaign.id, { status: "SENT", sentAt: new Date() } as any);
      await logAudit("campaign", campaign.id, "send", `Sent campaign to ${recipients.length} recipients in segment: ${campaign.segment}`);
      res.json({ ok: true, recipientCount: recipients.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // ── Automations ──
  app.get("/api/admin/automations", requireAdmin, async (_req, res) => {
    try {
      const templates = await storage.getAutomationTemplates();
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch automations" });
    }
  });

  const createAutomationSchema = z.object({
    name: z.string().min(1, "Name required"),
    triggerType: z.enum(["POST_PURCHASE", "REVIEW_REQUEST", "RESTOCK_ALERT", "ABANDON_CART"]),
    delayHours: z.number().int().min(0).optional().default(0),
    subject: z.string().min(1, "Subject required"),
    body: z.string().min(1, "Body required"),
    active: z.boolean().optional().default(true),
    upsellProductId: z.string().optional(),
  });

  app.post("/api/admin/automations", requireAdmin, async (req, res) => {
    try {
      const parsed = createAutomationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
      const { name, triggerType, delayHours, subject, body, active, upsellProductId } = parsed.data;
      const template = await storage.createAutomationTemplate({
        name, triggerType, delayHours: delayHours || 0, subject, body,
        active: active !== false, upsellProductId: upsellProductId || null,
      });
      await logAudit("automation", template.id, "create", `Created automation: ${name}`);
      res.json(template);
    } catch (err) {
      res.status(500).json({ error: "Failed to create automation" });
    }
  });

  app.patch("/api/admin/automations/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateAutomationTemplate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Automation not found" });
      await logAudit("automation", updated.id, "update", `Updated automation: ${updated.name}`);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update automation" });
    }
  });

  app.delete("/api/admin/automations/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAutomationTemplate(req.params.id);
      await logAudit("automation", req.params.id, "delete", "Deleted automation template");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete automation" });
    }
  });

  app.get("/api/admin/automations/sends", requireAdmin, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.templateId) filters.templateId = req.query.templateId;
      if (req.query.status) filters.status = req.query.status;
      const sends = await storage.getAutomationSends(filters);
      res.json(sends);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch automation sends" });
    }
  });

  // ── Reviews ──
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.productId) filters.productId = req.query.productId;
      if (req.query.approved !== undefined) filters.approved = req.query.approved === "true";
      const reviews = await storage.getReviews(filters);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.patch("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { approved } = req.body;
      const updated = await storage.updateReview(req.params.id, { approved });
      if (!updated) return res.status(404).json({ error: "Review not found" });
      await logAudit("review", updated.id, "update", `${approved ? "Approved" : "Rejected"} review`);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteReview(req.params.id);
      await logAudit("review", req.params.id, "delete", "Deleted review");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  app.get("/api/products/:slug/reviews", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const reviews = await storage.getProductReviews(product.id);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:slug/reviews", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const { customerEmail, customerName, rating, title, body, orderId } = req.body;
      if (!customerEmail || !customerName || !rating) return res.status(400).json({ error: "Email, name, and rating required" });

      let verified = false;
      let customerId: string | undefined;
      if (orderId) {
        const order = await storage.getOrderById(orderId);
        if (order && order.email.toLowerCase() === customerEmail.toLowerCase()) verified = true;
      }
      const customer = await storage.getCustomerByEmail(customerEmail);
      if (customer) customerId = customer.id;

      let incentiveCouponCode: string | null = null;
      if (verified) {
        const code = "REVIEW" + Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
          await storage.createPromotion({
            code,
            description: "Review thank-you coupon",
            discountType: "PERCENTAGE",
            discountValue: 10,
            maxUsageCount: 1,
            customerEmail,
            active: true,
          });
          incentiveCouponCode = code;
        } catch (e) {}
      }

      const review = await storage.createReview({
        productId: product.id,
        customerId: customerId || null,
        customerEmail,
        customerName,
        rating: Math.min(5, Math.max(1, rating)),
        title: title || null,
        body: body || null,
        verified,
        approved: false,
        incentiveCouponCode,
        orderId: orderId || null,
      });

      res.json({ review, couponCode: incentiveCouponCode });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // ── Waitlist / Drops ──
  app.get("/api/admin/waitlist", requireAdmin, async (req, res) => {
    try {
      const productId = req.query.productId as string | undefined;
      const entries = await storage.getWaitlistEntries(productId);
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch waitlist" });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const { productId, email } = req.body;
      if (!productId || !email) return res.status(400).json({ error: "Product ID and email required" });
      const product = await storage.getProductById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const entry = await storage.createWaitlistEntry({ productId, email, notified: false });
      res.json(entry);
    } catch (err) {
      res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  app.post("/api/admin/waitlist/:id/notify", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateWaitlistEntry(req.params.id, { notified: true } as any);
      if (!updated) return res.status(404).json({ error: "Entry not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to mark notified" });
    }
  });

  // ── Promo Performance ──
  app.get("/api/admin/promo-performance", requireAdmin, async (_req, res) => {
    try {
      const performance = await storage.getPromoPerformance();
      const promotions = await storage.getPromotions();
      const enriched = performance.map(p => {
        const promo = promotions.find(pr => pr.code === p.promoCode);
        return { ...p, promoId: promo?.id, discountType: promo?.discountType, discountValue: promo?.discountValue, active: promo?.active };
      });
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch promo performance" });
    }
  });

  app.post("/api/admin/promotions/:id/auto-stop", requireAdmin, async (req, res) => {
    try {
      const promo = await storage.getPromotionByCode("");
      const promoById = await storage.getPromotions();
      const target = promoById.find(p => p.id === req.params.id);
      if (!target) return res.status(404).json({ error: "Promotion not found" });
      if (target.appliesToProductId) {
        const variants = await storage.getVariantsByProductId(target.appliesToProductId);
        const totalStock = variants.reduce((sum, v) => sum + v.stockOnHand, 0);
        if (totalStock <= 0) {
          await storage.updatePromotion(target.id, { active: false });
          await logAudit("promotion", target.id, "auto_stop", `Promo ${target.code} auto-stopped: linked product out of stock`);
          return res.json({ ok: true, stopped: true, reason: "out_of_stock" });
        }
      }
      res.json({ ok: true, stopped: false });
    } catch (err) {
      res.status(500).json({ error: "Failed to check auto-stop" });
    }
  });

  return httpServer;
}
