"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  vessel: string;
  sizeOz: number;
  wickType: "COTTON" | "WOOD";
  priceCents: number;
};

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

export default function AddToCart({
  productName,
  variants,
}: {
  productName: string;
  variants: Variant[];
}) {
  const options = useMemo(
    () =>
      variants.map((v) => ({
        ...v,
        label: `${v.vessel} • ${v.sizeOz}oz • ${v.wickType} • ${money(v.priceCents)}`,
      })),
    [variants]
  );

  const [variantId, setVariantId] = useState(options[0]?.id ?? "");
  const [qty, setQty] = useState(1);

  const selected = options.find((o) => o.id === variantId);

  function add() {
    if (!selected) return;

    const item: CartItem = {
      variantId: selected.id,
      productName,
      variantLabel: `${selected.vessel} / ${selected.sizeOz}oz / ${selected.wickType}`,
      unitPriceCents: selected.priceCents,
      quantity: qty,
    };

    const raw = localStorage.getItem("cart");
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];

    const idx = cart.findIndex((c) => c.variantId === item.variantId);
    if (idx >= 0) cart[idx].quantity += item.quantity;
    else cart.push(item);

    localStorage.setItem("cart", JSON.stringify(cart));
    window.location.href = "/cart";
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <select
        className="rounded border p-2"
        value={variantId}
        onChange={(e) => setVariantId(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <label className="text-sm">Qty</label>
        <input
          className="w-20 rounded border p-2"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
        />
      </div>

      <button className="rounded bg-black px-4 py-2 text-white" onClick={add}>
        Add to cart
      </button>
    </div>
  );
}
