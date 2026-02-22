import { storage } from "./storage";
import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const cents = (n: number) => Math.round(n * 100);

export async function seedDatabase() {
  const existing = await db.select().from(products).where(eq(products.slug, "whipped-strawberry-sundae"));
  if (existing.length > 0) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  console.log("Seeding database...");

  await storage.setSetting("shippingFlatCents", String(cents(8)));

  const p1 = await storage.createProduct({
    name: "Whipped Strawberry Sundae",
    slug: "whipped-strawberry-sundae",
    description: "A luscious whipped-top dessert candle with a sweet, bakery vibe. Notes of fresh strawberries, vanilla cream, and a hint of sugar cone.",
    imageUrl: "/images/candle-strawberry.png",
    active: true,
    featured: true,
  });

  await storage.createVariant({
    productId: p1.id,
    vessel: "Glass Jar",
    sizeOz: 8,
    wickType: "COTTON",
    priceCents: cents(18),
    sku: "wss-glassjar-8oz-cotton",
    active: true,
  });

  await storage.createVariant({
    productId: p1.id,
    vessel: "Glass Jar",
    sizeOz: 8,
    wickType: "WOOD",
    priceCents: cents(20),
    sku: "wss-glassjar-8oz-wood",
    active: true,
  });

  await storage.createVariant({
    productId: p1.id,
    vessel: "Ceramic Bowl",
    sizeOz: 12,
    wickType: "WOOD",
    priceCents: cents(28),
    sku: "wss-ceramic-12oz-wood",
    active: true,
  });

  const p2 = await storage.createProduct({
    name: "Vanilla Caramel Drizzle",
    slug: "vanilla-caramel-drizzle",
    description: "Rich, warm vanilla bean swirled with buttery caramel and a touch of sea salt. The ultimate cozy evening companion.",
    imageUrl: "/images/candle-vanilla.png",
    active: true,
    featured: true,
  });

  await storage.createVariant({
    productId: p2.id,
    vessel: "Amber Jar",
    sizeOz: 8,
    wickType: "COTTON",
    priceCents: cents(18),
    sku: "vcd-amber-8oz-cotton",
    active: true,
  });

  await storage.createVariant({
    productId: p2.id,
    vessel: "Amber Jar",
    sizeOz: 8,
    wickType: "WOOD",
    priceCents: cents(20),
    sku: "vcd-amber-8oz-wood",
    active: true,
  });

  const p3 = await storage.createProduct({
    name: "Lavender Fields Forever",
    slug: "lavender-fields-forever",
    description: "A calming blend of French lavender, chamomile, and soft musk. Drift away into tranquility with every light.",
    imageUrl: "/images/candle-lavender.png",
    active: true,
    featured: true,
  });

  await storage.createVariant({
    productId: p3.id,
    vessel: "Glass Jar",
    sizeOz: 8,
    wickType: "COTTON",
    priceCents: cents(18),
    sku: "lff-glass-8oz-cotton",
    active: true,
  });

  await storage.createVariant({
    productId: p3.id,
    vessel: "Glass Jar",
    sizeOz: 12,
    wickType: "WOOD",
    priceCents: cents(26),
    sku: "lff-glass-12oz-wood",
    active: true,
  });

  const p4 = await storage.createProduct({
    name: "Chocolate Truffle Bliss",
    slug: "chocolate-truffle-bliss",
    description: "Decadent dark chocolate fused with hazelnut praline and espresso undertones. A dessert candle for the true indulgent.",
    imageUrl: "/images/candle-chocolate.png",
    active: true,
    featured: true,
  });

  await storage.createVariant({
    productId: p4.id,
    vessel: "Ceramic Bowl",
    sizeOz: 10,
    wickType: "WOOD",
    priceCents: cents(24),
    sku: "ctb-ceramic-10oz-wood",
    active: true,
  });

  await storage.createVariant({
    productId: p4.id,
    vessel: "Glass Jar",
    sizeOz: 8,
    wickType: "COTTON",
    priceCents: cents(18),
    sku: "ctb-glass-8oz-cotton",
    active: true,
  });

  console.log("Seed complete!");
}
