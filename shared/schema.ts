import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const wickTypeEnum = pgEnum("wick_type", ["COTTON", "WOOD"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]);
export const productStatusEnum = pgEnum("product_status", ["DRAFT", "ACTIVE", "ARCHIVED"]);
export const adminRoleEnum = pgEnum("admin_role", ["OWNER", "ADMIN", "STAFF", "READONLY"]);
export const discountTypeEnum = pgEnum("discount_type", ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]);
export const inventoryReasonEnum = pgEnum("inventory_reason", ["RESTOCK", "SALE", "DAMAGE", "CORRECTION", "RETURN", "INITIAL"]);

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("ACTIVE"),
  scentNotes: text("scent_notes"),
  waxType: text("wax_type"),
  burnTime: text("burn_time"),
  tags: text("tags"),
  categoryId: varchar("category_id"),
  collectionId: varchar("collection_id"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  costCents: integer("cost_cents"),
  compareAtPriceCents: integer("compare_at_price_cents"),
  scheduledAt: timestamp("scheduled_at"),
  isLimitedEdition: boolean("is_limited_edition").notNull().default(false),
  scentLine: text("scent_line"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const variants = pgTable("variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  vessel: text("vessel").notNull(),
  sizeOz: real("size_oz").notNull(),
  wickType: wickTypeEnum("wick_type").notNull(),
  priceCents: integer("price_cents").notNull(),
  costCents: integer("cost_cents"),
  compareAtPriceCents: integer("compare_at_price_cents"),
  sku: text("sku").unique(),
  active: boolean("active").notNull().default(true),
  stockOnHand: integer("stock_on_hand").notNull().default(0),
  stockReserved: integer("stock_reserved").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(5),
  quantityCap: integer("quantity_cap"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  email: text("email").notNull(),
  name: text("name").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  refundedCents: integer("refunded_cents").notNull().default(0),
  customerId: varchar("customer_id"),
  promoCode: text("promo_code"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  stripeChargeId: text("stripe_charge_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
});

export const orderNotes = pgTable("order_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderEvents = pgTable("order_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  eventType: text("event_type").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  tags: text("tags"),
  notes: text("notes"),
  totalOrderCount: integer("total_order_count").notNull().default(0),
  totalSpentCents: integer("total_spent_cents").notNull().default(0),
  lastOrderAt: timestamp("last_order_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  variantId: varchar("variant_id").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  previousOnHand: integer("previous_on_hand").notNull(),
  newOnHand: integer("new_on_hand").notNull(),
  authorName: text("author_name").notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  minSpendCents: integer("min_spend_cents"),
  maxUsageCount: integer("max_usage_count"),
  usedCount: integer("used_count").notNull().default(0),
  appliesToProductId: varchar("applies_to_product_id"),
  appliesToCollectionId: varchar("applies_to_collection_id"),
  customerEmail: text("customer_email"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(),
  authorName: text("author_name").notNull().default("Admin"),
  beforeData: text("before_data"),
  afterData: text("after_data"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("ADMIN"),
  active: boolean("active").notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const automationTemplates = pgTable("automation_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(),
  delayHours: integer("delay_hours").notNull().default(0),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  active: boolean("active").notNull().default(true),
  upsellProductId: varchar("upsell_product_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const automationSends = pgTable("automation_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  orderId: varchar("order_id"),
  customerId: varchar("customer_id"),
  customerEmail: text("customer_email").notNull(),
  status: text("status").notNull().default("PENDING"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  customerId: varchar("customer_id"),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  verified: boolean("verified").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  incentiveCouponCode: text("incentive_coupon_code"),
  orderId: varchar("order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  email: text("email").notNull(),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  segment: text("segment").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  promoCode: text("promo_code"),
  recipientCount: integer("recipient_count").notNull().default(0),
  status: text("status").notNull().default("DRAFT"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVariantSchema = createInsertSchema(variants).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertOrderNoteSchema = createInsertSchema(orderNotes).omit({ id: true, createdAt: true });
export const insertOrderEventSchema = createInsertSchema(orderEvents).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true });
export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settings);
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutomationTemplateSchema = createInsertSchema(automationTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAutomationSendSchema = createInsertSchema(automationSends).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Variant = typeof variants.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderNote = typeof orderNotes.$inferSelect;
export type InsertOrderNote = z.infer<typeof insertOrderNoteSchema>;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type InsertOrderEvent = z.infer<typeof insertOrderEventSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;
export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AutomationTemplate = typeof automationTemplates.$inferSelect;
export type InsertAutomationTemplate = z.infer<typeof insertAutomationTemplateSchema>;
export type AutomationSend = typeof automationSends.$inferSelect;
export type InsertAutomationSend = z.infer<typeof insertAutomationSendSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type ProductWithVariants = Product & { variants: Variant[] };
