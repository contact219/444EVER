import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [products, orders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded border p-4">Products: <b>{products}</b></div>
        <div className="rounded border p-4">Orders: <b>{orders}</b></div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link className="rounded border px-4 py-2" href="/admin/orders">
          View orders
        </Link>
        <Link className="rounded border px-4 py-2" href="/shop">
          View storefront
        </Link>
      </div>
    </main>
  );
}
