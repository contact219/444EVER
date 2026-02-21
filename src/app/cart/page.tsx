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

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setCart(raw ? JSON.parse(raw) : []);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [cart]
  );

  function clear() {
    localStorage.removeItem("cart");
    setCart([]);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Cart</h1>
        <Link href="/shop" className="underline">
          Continue shopping
        </Link>
      </header>

      {cart.length === 0 ? (
        <p className="mt-6">Your cart is empty.</p>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {cart.map((i) => (
              <div key={i.variantId} className="rounded border p-3">
                <div className="font-semibold">{i.productName}</div>
                <div className="text-sm text-slate-600">{i.variantLabel}</div>
                <div className="mt-2 text-sm">
                  {i.quantity} × {money(i.unitPriceCents)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="font-semibold">Subtotal: {money(subtotal)}</div>
            <div className="flex gap-3">
              <button className="rounded border px-3 py-2" onClick={clear}>
                Clear
              </button>
              <Link className="rounded bg-black px-4 py-2 text-white" href="/checkout">
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
