import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Shop</h1>
        <div className="flex gap-2">
          <Link href="/" className="rounded border px-3 py-2">
            Home
          </Link>
          <Link href="/cart" className="rounded border px-3 py-2">
            Cart
          </Link>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="rounded border p-4 hover:bg-slate-50"
          >
            <div className="font-semibold">{p.name}</div>
            {p.description ? (
              <div className="mt-1 text-sm text-slate-600 line-clamp-2">{p.description}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  );
}
