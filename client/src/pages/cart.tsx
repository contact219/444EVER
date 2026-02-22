import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCart,
  saveCart,
  removeFromCart,
  getCartTotal,
  formatMoney,
  type CartItem,
} from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
    const handler = () => setCart(getCart());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  function updateQty(variantId: string, delta: number) {
    const updated = cart.map((item) =>
      item.variantId === variantId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    saveCart(updated);
    setCart(updated);
  }

  function remove(variantId: string) {
    removeFromCart(variantId);
    setCart(getCart());
  }

  function clearAll() {
    saveCart([]);
    setCart([]);
  }

  const subtotal = getCartTotal(cart);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-cart">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Your Cart</h1>
          <Link href="/shop">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground cursor-pointer" data-testid="link-continue-shopping">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </span>
          </Link>
        </div>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any candles yet.</p>
            <Link href="/shop">
              <Button data-testid="button-start-shopping">
                Start Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.variantId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-4" data-testid={`cart-item-${item.variantId}`}>
                      <div className="flex gap-4">
                        {item.imageUrl && (
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold truncate" data-testid="text-cart-product-name">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">{item.variantLabel}</p>
                          <p className="mt-1 font-medium">{formatMoney(item.unitPriceCents)}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(item.variantId)}
                            data-testid={`button-remove-${item.variantId}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQty(item.variantId, -1)}
                              data-testid={`button-decrease-${item.variantId}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium" data-testid={`text-qty-${item.variantId}`}>
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQty(item.variantId, 1)}
                              data-testid={`button-increase-${item.variantId}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Card className="mt-8 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold font-heading" data-testid="text-subtotal">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Shipping calculated at checkout
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={clearAll} className="flex-1" data-testid="button-clear-cart">
                  Clear Cart
                </Button>
                <Link href="/checkout" className="flex-1">
                  <Button className="w-full" size="lg" data-testid="button-checkout">
                    Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
