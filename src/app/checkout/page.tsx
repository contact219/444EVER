"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setCart(raw ? JSON.parse(raw) : []);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [cart]
  );

  async function submit(formData: FormData) {
    setLoading(true);
    setMsg(null);

    const payload = {
      email: String(formData.get("email") || ""),
      name: String(formData.get("name") || ""),
      address1: String(formData.get("address1") || ""),
      address2: String(formData.get("address2") || ""),
      city: String(formData.get("city") || ""),
      state: String(formData.get("state") || ""),
      postalCode: String(formData.get("postalCode") || ""),
      items: cart,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed");
      localStorage.removeItem("cart");
      setMsg(`Order created: ${data.orderId}`);
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-4">Your cart is empty.</p>
        <Link href="/shop" className="underline">
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link href="/cart" className="underline">
          Back to cart
        </Link>
      </header>

      <p className="mt-2 text-slate-600">
        Subtotal: {money(subtotal)} (shipping added when the order is created)
      </p>

      <form className="mt-6 grid grid-cols-1 gap-3" action={(fd) => submit(fd)}>
        <input className="rounded border p-2" name="email" placeholder="Email" required />
        <input className="rounded border p-2" name="name" placeholder="Full name" required />
        <input className="rounded border p-2" name="address1" placeholder="Address" required />
        <input className="rounded border p-2" name="address2" placeholder="Apt / Suite (optional)" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="rounded border p-2" name="city" placeholder="City" required />
          <input className="rounded border p-2" name="state" placeholder="State" required />
          <input className="rounded border p-2" name="postalCode" placeholder="ZIP" required />
        </div>

        <button disabled={loading} className="rounded bg-black px-4 py-2 text-white">
          {loading ? "Placing order…" : "Place order"}
        </button>

        {msg ? <p className="text-sm text-slate-700">{msg}</p> : null}
      </form>
    </main>
  );
}
