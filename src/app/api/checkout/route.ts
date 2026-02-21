import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CartItem = z.object({
  variantId: z.string(),
  productName: z.string(),
  variantLabel: z.string(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

const Body = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  items: z.array(CartItem).min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const shippingSetting = await prisma.setting.findUnique({
      where: { key: "shippingFlatCents" },
    });
    const shippingCents = shippingSetting ? Number(shippingSetting.value) : 800;

    const subtotalCents = body.items.reduce(
      (sum, i) => sum + i.unitPriceCents * i.quantity,
      0
    );
    const totalCents = subtotalCents + shippingCents;

    const order = await prisma.order.create({
      data: {
        email: body.email,
        name: body.name,
        address1: body.address1,
        address2: body.address2 || null,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        subtotalCents,
        shippingCents,
        totalCents,
        items: {
          create: body.items.map((i) => ({
            productName: i.productName,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            lineTotalCents: i.unitPriceCents * i.quantity,
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}
