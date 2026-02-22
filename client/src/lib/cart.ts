export type CartItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string;
};

const CART_KEY = "444ever_cart";

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.variantId === item.variantId);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function removeFromCart(variantId: string) {
  const cart = getCart().filter((c) => c.variantId !== variantId);
  saveCart(cart);
}

export function updateQuantity(variantId: string, quantity: number) {
  const cart = getCart();
  const idx = cart.findIndex((c) => c.variantId === variantId);
  if (idx >= 0) {
    cart[idx].quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
