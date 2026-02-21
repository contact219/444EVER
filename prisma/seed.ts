import { PrismaClient, WickType } from "@prisma/client";

const prisma = new PrismaClient();
const cents = (n: number) => Math.round(n * 100);

async function main() {
  await prisma.setting.upsert({
    where: { key: "shippingFlatCents" },
    update: { value: String(cents(8)) },
    create: { key: "shippingFlatCents", value: String(cents(8)) },
  });

  const p = await prisma.product.upsert({
    where: { slug: "whipped-strawberry-sundae" },
    update: {
      name: "Whipped Strawberry Sundae",
      description: "Whipped-top dessert candle with a sweet, bakery vibe.",
      featured: true,
      active: true,
    },
    create: {
      name: "Whipped Strawberry Sundae",
      slug: "whipped-strawberry-sundae",
      description: "Whipped-top dessert candle with a sweet, bakery vibe.",
      featured: true,
      active: true,
    },
  });

  await prisma.variant.deleteMany({ where: { productId: p.id } });
  await prisma.variant.createMany({
    data: [
      {
        productId: p.id,
        vessel: "Glass Jar",
        sizeOz: 8,
        wickType: WickType.COTTON,
        priceCents: cents(18),
        sku: "wss-glassjar-8oz-cotton",
        active: true,
      },
      {
        productId: p.id,
        vessel: "Glass Jar",
        sizeOz: 8,
        wickType: WickType.WOOD,
        priceCents: cents(20),
        sku: "wss-glassjar-8oz-wood",
        active: true,
      },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
