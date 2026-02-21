import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddToCart from "./ui/AddToCart";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: {
        where: { active: true },
        orderBy: [{ sizeOz: "asc" }, { priceCents: "asc" }],
      },
    },
  });

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p>Not found.</p>
        <Link href="/shop" className="underline">
          Back to shop
        </Link>
      </main>
    );
  }

  const fromPrice = product.variants.length
    ? Math.min(...product.variants.map((v) => v.priceCents))
    : null;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <Link href="/shop" className="underline">
          ← Shop
        </Link>
        <Link href="/cart" className="rounded border px-3 py-2">
          Cart
        </Link>
      </header>

      <h1 className="mt-4 text-2xl font-bold">{product.name}</h1>
      {product.description ? (
        <p className="mt-2 text-slate-600">{product.description}</p>
      ) : null}

      {fromPrice !== null ? (
        <p className="mt-2 text-sm text-slate-600">From {money(fromPrice)}</p>
      ) : null}

      <div className="mt-6 rounded border p-4">
        <h2 className="font-semibold">Choose a variant</h2>
        {product.variants.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No variants configured.</p>
        ) : (
          <AddToCart productName={product.name} variants={product.variants} />
        )}
      </div>
    </main>
  );
}
