import {
  products, variants, orders, orderItems, settings,
  orderNotes, orderEvents, customers, categories, collections,
  inventoryAdjustments, promotions, auditLogs, users,
  adminUsers, automationTemplates, automationSends, reviews,
  waitlistEntries, campaigns,
  type Product, type InsertProduct,
  type Variant, type InsertVariant,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderNote, type InsertOrderNote,
  type OrderEvent, type InsertOrderEvent,
  type Customer, type InsertCustomer,
  type Category, type InsertCategory,
  type Collection, type InsertCollection,
  type InventoryAdjustment, type InsertInventoryAdjustment,
  type Promotion, type InsertPromotion,
  type AuditLog, type InsertAuditLog,
  type Setting, type InsertSetting,
  type ProductWithVariants,
  type User, type InsertUser,
  type AdminUser, type InsertAdminUser,
  type AutomationTemplate, type InsertAutomationTemplate,
  type AutomationSend, type InsertAutomationSend,
  type Review, type InsertReview,
  type WaitlistEntry, type InsertWaitlistEntry,
  type Campaign, type InsertCampaign,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, count, sum, like, or, gt, isNull } from "drizzle-orm";

export interface IStorage {
  getProducts(activeOnly?: boolean): Promise<ProductWithVariants[]>;
  getFeaturedProducts(): Promise<ProductWithVariants[]>;
  getProductBySlug(slug: string): Promise<ProductWithVariants | undefined>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getVariantsByProductId(productId: string): Promise<Variant[]>;
  getVariantById(id: string): Promise<Variant | undefined>;
  getProductByVariantId(productId: string): Promise<Product | undefined>;
  createVariant(variant: InsertVariant): Promise<Variant>;
  updateVariant(id: string, data: Partial<InsertVariant>): Promise<Variant | undefined>;
  deleteVariant(id: string): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrders(filters?: { status?: string; dateFrom?: Date; dateTo?: Date }): Promise<(Order & { items: OrderItem[] })[]>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderNotes(orderId: string): Promise<OrderNote[]>;
  createOrderNote(note: InsertOrderNote): Promise<OrderNote>;
  getOrderEvents(orderId: string): Promise<OrderEvent[]>;
  createOrderEvent(event: InsertOrderEvent): Promise<OrderEvent>;
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  getCollections(): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, data: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  getInventoryAdjustments(variantId?: string): Promise<InventoryAdjustment[]>;
  createInventoryAdjustment(adj: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
  updateVariantStock(variantId: string, quantityChange: number): Promise<Variant | undefined>;
  getLowStockVariants(threshold?: number): Promise<(Variant & { productName: string })[]>;
  getPromotions(): Promise<Promotion[]>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(promo: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, data: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: string): Promise<boolean>;
  getAuditLogs(filters?: { entityType?: string; entityId?: string; limit?: number }): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  getKPIs(days: number): Promise<{
    revenue: number; orderCount: number; avgOrderValue: number;
    refundedAmount: number; lowStockCount: number;
  }>;
  getRevenueByDay(days: number): Promise<{ date: string; revenue: number; orders: number }[]>;
  getTopProducts(days: number, limit: number): Promise<{ productName: string; revenue: number; quantity: number }[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUserById(id: string): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: string): Promise<boolean>;
  getAdminUserByResetToken(token: string): Promise<AdminUser | undefined>;
  getAutomationTemplates(): Promise<AutomationTemplate[]>;
  getAutomationTemplateById(id: string): Promise<AutomationTemplate | undefined>;
  createAutomationTemplate(t: InsertAutomationTemplate): Promise<AutomationTemplate>;
  updateAutomationTemplate(id: string, data: Partial<InsertAutomationTemplate>): Promise<AutomationTemplate | undefined>;
  deleteAutomationTemplate(id: string): Promise<boolean>;
  getAutomationSends(filters?: { templateId?: string; orderId?: string; status?: string }): Promise<AutomationSend[]>;
  createAutomationSend(send: InsertAutomationSend): Promise<AutomationSend>;
  updateAutomationSend(id: string, data: Partial<AutomationSend>): Promise<AutomationSend | undefined>;
  getAutomationSendsByOrder(orderId: string): Promise<AutomationSend[]>;
  getReviews(filters?: { productId?: string; approved?: boolean }): Promise<Review[]>;
  getReviewById(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, data: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;
  getProductReviews(productId: string): Promise<Review[]>;
  getWaitlistEntries(productId?: string): Promise<WaitlistEntry[]>;
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  updateWaitlistEntry(id: string, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined>;
  getWaitlistByProductId(productId: string): Promise<WaitlistEntry[]>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  getCustomersBySegment(segment: string): Promise<Customer[]>;
  getPromoPerformance(): Promise<{ promoCode: string; usageCount: number; totalRevenue: number; totalDiscount: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(activeOnly = true): Promise<ProductWithVariants[]> {
    const where = activeOnly ? eq(products.active, true) : undefined;
    const allProducts = await db.select().from(products).where(where).orderBy(desc(products.createdAt));
    const result: ProductWithVariants[] = [];
    for (const p of allProducts) {
      const v = await db.select().from(variants).where(
        activeOnly
          ? and(eq(variants.productId, p.id), eq(variants.active, true))
          : eq(variants.productId, p.id)
      );
      result.push({ ...p, variants: v });
    }
    return result;
  }

  async getFeaturedProducts(): Promise<ProductWithVariants[]> {
    const featured = await db.select().from(products)
      .where(and(eq(products.active, true), eq(products.featured, true)));
    const result: ProductWithVariants[] = [];
    for (const p of featured) {
      const v = await db.select().from(variants)
        .where(and(eq(variants.productId, p.id), eq(variants.active, true)));
      result.push({ ...p, variants: v });
    }
    return result;
  }

  async getProductBySlug(slug: string): Promise<ProductWithVariants | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    if (!product) return undefined;
    const v = await db.select().from(variants)
      .where(and(eq(variants.productId, product.id), eq(variants.active, true)));
    return { ...product, variants: v };
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getVariantsByProductId(productId: string): Promise<Variant[]> {
    return db.select().from(variants).where(eq(variants.productId, productId));
  }

  async getVariantById(id: string): Promise<Variant | undefined> {
    const [v] = await db.select().from(variants).where(eq(variants.id, id));
    return v;
  }

  async getProductByVariantId(productId: string): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, productId));
    return p;
  }

  async createVariant(variant: InsertVariant): Promise<Variant> {
    const [created] = await db.insert(variants).values(variant).returning();
    return created;
  }

  async updateVariant(id: string, data: Partial<InsertVariant>): Promise<Variant | undefined> {
    const [updated] = await db.update(variants).set(data).where(eq(variants.id, id)).returning();
    return updated;
  }

  async deleteVariant(id: string): Promise<boolean> {
    await db.delete(variants).where(eq(variants.id, id));
    return true;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [o] = await db.select().from(orders).where(eq(orders.id, id));
    return o;
  }

  async getOrders(filters?: { status?: string; dateFrom?: Date; dateTo?: Date }): Promise<(Order & { items: OrderItem[] })[]> {
    let query = db.select().from(orders);
    const conditions: any[] = [];
    if (filters?.status) conditions.push(eq(orders.status, filters.status as any));
    if (filters?.dateFrom) conditions.push(gte(orders.createdAt, filters.dateFrom));
    if (filters?.dateTo) conditions.push(lte(orders.createdAt, filters.dateTo));

    const allOrders = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(orders.createdAt))
      : await query.orderBy(desc(orders.createdAt));

    const result = [];
    for (const o of allOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
      result.push({ ...o, items });
    }
    return result;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }

  async getOrderNotes(orderId: string): Promise<OrderNote[]> {
    return db.select().from(orderNotes).where(eq(orderNotes.orderId, orderId)).orderBy(desc(orderNotes.createdAt));
  }

  async createOrderNote(note: InsertOrderNote): Promise<OrderNote> {
    const [created] = await db.insert(orderNotes).values(note).returning();
    return created;
  }

  async getOrderEvents(orderId: string): Promise<OrderEvent[]> {
    return db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(desc(orderEvents.createdAt));
  }

  async createOrderEvent(event: InsertOrderEvent): Promise<OrderEvent> {
    const [created] = await db.insert(orderEvents).values(event).returning();
    return created;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.email, email));
    return c;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return updated;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getCollections(): Promise<Collection[]> {
    return db.select().from(collections).orderBy(desc(collections.createdAt));
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [created] = await db.insert(collections).values(collection).returning();
    return created;
  }

  async updateCollection(id: string, data: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [updated] = await db.update(collections).set(data).where(eq(collections.id, id)).returning();
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    await db.delete(collections).where(eq(collections.id, id));
    return true;
  }

  async getInventoryAdjustments(variantId?: string): Promise<InventoryAdjustment[]> {
    if (variantId) {
      return db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.variantId, variantId)).orderBy(desc(inventoryAdjustments.createdAt));
    }
    return db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.createdAt)).limit(100);
  }

  async createInventoryAdjustment(adj: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [created] = await db.insert(inventoryAdjustments).values(adj).returning();
    return created;
  }

  async updateVariantStock(variantId: string, quantityChange: number): Promise<Variant | undefined> {
    const [updated] = await db.update(variants)
      .set({ stockOnHand: sql`stock_on_hand + ${quantityChange}` })
      .where(eq(variants.id, variantId))
      .returning();
    return updated;
  }

  async getLowStockVariants(threshold?: number): Promise<(Variant & { productName: string })[]> {
    const allVariants = await db.select().from(variants).where(eq(variants.active, true));
    const result: (Variant & { productName: string })[] = [];
    for (const v of allVariants) {
      if (v.stockOnHand <= (threshold ?? v.reorderPoint)) {
        const [p] = await db.select().from(products).where(eq(products.id, v.productId));
        result.push({ ...v, productName: p?.name || "Unknown" });
      }
    }
    return result;
  }

  async getPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [p] = await db.select().from(promotions).where(eq(promotions.code, code.toUpperCase()));
    return p;
  }

  async createPromotion(promo: InsertPromotion): Promise<Promotion> {
    const [created] = await db.insert(promotions).values({ ...promo, code: promo.code.toUpperCase() }).returning();
    return created;
  }

  async updatePromotion(id: string, data: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const updateData: any = { ...data };
    if (data.code) updateData.code = data.code.toUpperCase();
    const [updated] = await db.update(promotions).set(updateData).where(eq(promotions.id, id)).returning();
    return updated;
  }

  async deletePromotion(id: string): Promise<boolean> {
    await db.delete(promotions).where(eq(promotions.id, id));
    return true;
  }

  async getAuditLogs(filters?: { entityType?: string; entityId?: string; limit?: number }): Promise<AuditLog[]> {
    const conditions: any[] = [];
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters?.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));

    let query = db.select().from(auditLogs);
    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(filters?.limit || 200);
    }
    return query.orderBy(desc(auditLogs.createdAt)).limit(filters?.limit || 200);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const [s] = await db.select().from(settings).where(eq(settings.key, key));
    return s?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing !== undefined) {
      await db.update(settings).set({ value }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }

  async getKPIs(days: number): Promise<{
    revenue: number; orderCount: number; avgOrderValue: number;
    refundedAmount: number; lowStockCount: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [stats] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
        orderCount: sql<number>`COUNT(*)`,
        refundedAmount: sql<number>`COALESCE(SUM(${orders.refundedCents}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, since));

    const revenue = Number(stats?.revenue || 0);
    const orderCount = Number(stats?.orderCount || 0);
    const avgOrderValue = orderCount > 0 ? Math.round(revenue / orderCount) : 0;
    const refundedAmount = Number(stats?.refundedAmount || 0);

    const lowStock = await this.getLowStockVariants();
    return {
      revenue,
      orderCount,
      avgOrderValue,
      refundedAmount,
      lowStockCount: lowStock.length,
    };
  }

  async getRevenueByDay(days: number): Promise<{ date: string; revenue: number; orders: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
        orders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, since))
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    return rows.map(r => ({
      date: String(r.date),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
  }

  async getTopProducts(days: number, limit: number): Promise<{ productName: string; revenue: number; quantity: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await db
      .select({
        productName: orderItems.productName,
        revenue: sql<number>`COALESCE(SUM(${orderItems.lineTotalCents}), 0)`,
        quantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, since))
      .groupBy(orderItems.productName)
      .orderBy(sql`SUM(${orderItems.lineTotalCents}) DESC`)
      .limit(limit);

    return rows.map(r => ({
      productName: r.productName,
      revenue: Number(r.revenue),
      quantity: Number(r.quantity),
    }));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }

  async getAdminUserById(id: string): Promise<AdminUser | undefined> {
    const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return u;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [u] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return u;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(user).returning();
    return created;
  }

  async updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | undefined> {
    const [updated] = await db.update(adminUsers).set({ ...data, updatedAt: new Date() }).where(eq(adminUsers.id, id)).returning();
    return updated;
  }

  async deleteAdminUser(id: string): Promise<boolean> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    return true;
  }

  async getAdminUserByResetToken(token: string): Promise<AdminUser | undefined> {
    const [u] = await db.select().from(adminUsers).where(
      and(eq(adminUsers.resetToken, token), gt(adminUsers.resetTokenExpiresAt, new Date()))
    );
    return u;
  }

  async getAutomationTemplates(): Promise<AutomationTemplate[]> {
    return db.select().from(automationTemplates).orderBy(desc(automationTemplates.createdAt));
  }

  async getAutomationTemplateById(id: string): Promise<AutomationTemplate | undefined> {
    const [t] = await db.select().from(automationTemplates).where(eq(automationTemplates.id, id));
    return t;
  }

  async createAutomationTemplate(t: InsertAutomationTemplate): Promise<AutomationTemplate> {
    const [created] = await db.insert(automationTemplates).values(t).returning();
    return created;
  }

  async updateAutomationTemplate(id: string, data: Partial<InsertAutomationTemplate>): Promise<AutomationTemplate | undefined> {
    const [updated] = await db.update(automationTemplates).set({ ...data, updatedAt: new Date() }).where(eq(automationTemplates.id, id)).returning();
    return updated;
  }

  async deleteAutomationTemplate(id: string): Promise<boolean> {
    await db.delete(automationTemplates).where(eq(automationTemplates.id, id));
    return true;
  }

  async getAutomationSends(filters?: { templateId?: string; orderId?: string; status?: string }): Promise<AutomationSend[]> {
    const conditions: any[] = [];
    if (filters?.templateId) conditions.push(eq(automationSends.templateId, filters.templateId));
    if (filters?.orderId) conditions.push(eq(automationSends.orderId, filters.orderId));
    if (filters?.status) conditions.push(eq(automationSends.status, filters.status));

    if (conditions.length > 0) {
      return db.select().from(automationSends).where(and(...conditions)).orderBy(desc(automationSends.createdAt)).limit(200);
    }
    return db.select().from(automationSends).orderBy(desc(automationSends.createdAt)).limit(200);
  }

  async createAutomationSend(send: InsertAutomationSend): Promise<AutomationSend> {
    const [created] = await db.insert(automationSends).values(send).returning();
    return created;
  }

  async updateAutomationSend(id: string, data: Partial<AutomationSend>): Promise<AutomationSend | undefined> {
    const [updated] = await db.update(automationSends).set(data).where(eq(automationSends.id, id)).returning();
    return updated;
  }

  async getAutomationSendsByOrder(orderId: string): Promise<AutomationSend[]> {
    return db.select().from(automationSends).where(eq(automationSends.orderId, orderId)).orderBy(desc(automationSends.createdAt));
  }

  async getReviews(filters?: { productId?: string; approved?: boolean }): Promise<Review[]> {
    const conditions: any[] = [];
    if (filters?.productId) conditions.push(eq(reviews.productId, filters.productId));
    if (filters?.approved !== undefined) conditions.push(eq(reviews.approved, filters.approved));

    if (conditions.length > 0) {
      return db.select().from(reviews).where(and(...conditions)).orderBy(desc(reviews.createdAt)).limit(200);
    }
    return db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(200);
  }

  async getReviewById(id: string): Promise<Review | undefined> {
    const [r] = await db.select().from(reviews).where(eq(reviews.id, id));
    return r;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async updateReview(id: string, data: Partial<Review>): Promise<Review | undefined> {
    const [updated] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
    return updated;
  }

  async deleteReview(id: string): Promise<boolean> {
    await db.delete(reviews).where(eq(reviews.id, id));
    return true;
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return db.select().from(reviews).where(
      and(eq(reviews.productId, productId), eq(reviews.approved, true))
    ).orderBy(desc(reviews.createdAt));
  }

  async getWaitlistEntries(productId?: string): Promise<WaitlistEntry[]> {
    if (productId) {
      return db.select().from(waitlistEntries).where(eq(waitlistEntries.productId, productId)).orderBy(desc(waitlistEntries.createdAt));
    }
    return db.select().from(waitlistEntries).orderBy(desc(waitlistEntries.createdAt));
  }

  async createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const [created] = await db.insert(waitlistEntries).values(entry).returning();
    return created;
  }

  async updateWaitlistEntry(id: string, data: Partial<WaitlistEntry>): Promise<WaitlistEntry | undefined> {
    const [updated] = await db.update(waitlistEntries).set(data).where(eq(waitlistEntries.id, id)).returning();
    return updated;
  }

  async getWaitlistByProductId(productId: string): Promise<WaitlistEntry[]> {
    return db.select().from(waitlistEntries).where(eq(waitlistEntries.productId, productId)).orderBy(waitlistEntries.createdAt);
  }

  async getCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return c;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }

  async updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
    return true;
  }

  async getCustomersBySegment(segment: string): Promise<Customer[]> {
    switch (segment) {
      case "vip":
        return db.select().from(customers).where(gte(customers.totalSpentCents, 10000)).orderBy(desc(customers.totalSpentCents));
      case "first_time":
        return db.select().from(customers).where(eq(customers.totalOrderCount, 1)).orderBy(desc(customers.createdAt));
      case "inactive": {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return db.select().from(customers).where(
          or(isNull(customers.lastOrderAt), lte(customers.lastOrderAt, sixtyDaysAgo))
        ).orderBy(desc(customers.createdAt));
      }
      case "repeat":
        return db.select().from(customers).where(gte(customers.totalOrderCount, 2)).orderBy(desc(customers.totalSpentCents));
      case "all":
      default:
        return db.select().from(customers).orderBy(desc(customers.createdAt));
    }
  }

  async getPromoPerformance(): Promise<{ promoCode: string; usageCount: number; totalRevenue: number; totalDiscount: number }[]> {
    const rows = await db
      .select({
        promoCode: orders.promoCode,
        usageCount: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
        totalDiscount: sql<number>`COALESCE(SUM(${orders.discountCents}), 0)`,
      })
      .from(orders)
      .where(sql`${orders.promoCode} IS NOT NULL AND ${orders.promoCode} != ''`)
      .groupBy(orders.promoCode)
      .orderBy(sql`COUNT(*) DESC`);

    return rows.map(r => ({
      promoCode: r.promoCode!,
      usageCount: Number(r.usageCount),
      totalRevenue: Number(r.totalRevenue),
      totalDiscount: Number(r.totalDiscount),
    }));
  }
}

export const storage = new DatabaseStorage();
