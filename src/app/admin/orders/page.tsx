import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link href="/admin" className="underline">
          Back
        </Link>
      </header>

      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">{o.id}</div>
              <div className="text-sm">{o.status} • {money(o.totalCents)}</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {o.name} • {o.email} • {o.city}, {o.state}
            </div>
            <div className="mt-3 text-sm">
              {o.items.map((i) => (
                <div key={i.id}>
                  {i.quantity}× {i.productName} ({i.variantLabel})
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
