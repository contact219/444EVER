import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { getCart, getCartTotal, clearCart, formatMoney, type CartItem } from "@/lib/cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setCart(getCart());
  }, []);

  const subtotal = useMemo(() => getCartTotal(cart), [cart]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
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
      const data = await apiRequest("POST", "/api/checkout", payload);
      const result = await data.json();
      clearCart();
      setCart([]);
      setOrderComplete(result.orderId);
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-order-complete">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-20"
        >
          <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 mb-6" />
          <h1 className="font-heading text-3xl font-bold mb-3">Order Placed!</h1>
          <p className="text-muted-foreground mb-2">
            Thank you for your order. Your order ID is:
          </p>
          <p className="font-mono text-sm bg-muted rounded-md px-4 py-2 inline-block mb-6" data-testid="text-order-id">
            {orderComplete}
          </p>
          <div>
            <Link href="/shop">
              <Button data-testid="button-continue-shopping">Continue Shopping</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 text-center">
        <div className="max-w-lg mx-auto py-20">
          <h1 className="font-heading text-3xl font-bold mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-6">Your cart is empty.</p>
          <Link href="/shop">
            <Button data-testid="button-back-to-shop">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-checkout">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold">Checkout</h1>
          <Link href="/cart">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground cursor-pointer" data-testid="link-back-to-cart">
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="p-6">
              <h2 className="font-heading text-xl font-semibold mb-6">Shipping Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-checkout">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="your@email.com" required data-testid="input-email" />
                </div>

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required data-testid="input-name" />
                </div>

                <div>
                  <Label htmlFor="address1">Address</Label>
                  <Input id="address1" name="address1" placeholder="123 Main St" required data-testid="input-address1" />
                </div>

                <div>
                  <Label htmlFor="address2">Apt / Suite (optional)</Label>
                  <Input id="address2" name="address2" placeholder="Apt 4B" data-testid="input-address2" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="New York" required data-testid="input-city" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" placeholder="NY" required data-testid="input-state" />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">ZIP Code</Label>
                    <Input id="postalCode" name="postalCode" placeholder="10001" required data-testid="input-zip" />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4" size="lg" disabled={loading} data-testid="button-place-order">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </form>
            </Card>
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="font-heading text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium flex-shrink-0">
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Flat rate $8.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border" data-testid="text-checkout-total">
                  <span>Total</span>
                  <span>{formatMoney(subtotal + 800)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
