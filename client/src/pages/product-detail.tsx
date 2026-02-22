import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShoppingCart, Sparkles, Minus, Plus, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProductWithVariants, Variant } from "@shared/schema";
import { addToCart, formatMoney } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";

function variantLabel(v: Variant): string {
  return `${v.vessel} - ${v.sizeOz}oz - ${v.wickType === "WOOD" ? "Wood Wick" : "Cotton Wick"}`;
}

export default function ProductDetailPage() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery<ProductWithVariants>({
    queryKey: ["/api/products", slug],
    enabled: !!slug,
  });

  const activeVariants = product?.variants.filter((v) => v.active) || [];
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  function handleAdd() {
    if (!selectedVariant || !product) return;

    addToCart({
      variantId: selectedVariant.id,
      productName: product.name,
      variantLabel: variantLabel(selectedVariant),
      unitPriceCents: selectedVariant.priceCents,
      quantity: qty,
      imageUrl: product.imageUrl || undefined,
    });

    setAdded(true);
    toast({
      title: "Added to cart",
      description: `${product.name} - ${variantLabel(selectedVariant)}`,
    });
    setTimeout(() => setAdded(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 text-center">
        <h1 className="font-heading text-3xl font-bold mb-4">Product Not Found</h1>
        <Link href="/shop">
          <Button variant="outline" data-testid="button-back-to-shop">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-product-detail">
      <div className="max-w-5xl mx-auto">
        <Link href="/shop">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground cursor-pointer mb-6" data-testid="link-back-shop">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-square rounded-md overflow-hidden bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="img-product"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold" data-testid="text-product-name">
              {product.name}
            </h1>

            {product.description && (
              <p className="mt-4 text-muted-foreground leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            )}

            {selectedVariant && (
              <p className="mt-4 text-2xl font-bold font-heading" data-testid="text-product-price">
                {formatMoney(selectedVariant.priceCents)}
              </p>
            )}

            {activeVariants.length > 0 && (
              <Card className="mt-6 p-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Variant</label>
                    <Select
                      value={selectedVariant?.id || ""}
                      onValueChange={(val) => setSelectedVariantId(val)}
                    >
                      <SelectTrigger data-testid="select-variant">
                        <SelectValue placeholder="Choose a variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeVariants.map((v) => (
                          <SelectItem key={v.id} value={v.id} data-testid={`option-variant-${v.id}`}>
                            {variantLabel(v)} - {formatMoney(v.priceCents)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        data-testid="button-qty-minus"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-12 text-center font-medium text-lg" data-testid="text-quantity">
                        {qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQty(qty + 1)}
                        data-testid="button-qty-plus"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div key={added ? "added" : "add"}>
                      <Button
                        className="w-full mt-2"
                        size="lg"
                        onClick={handleAdd}
                        disabled={added}
                        data-testid="button-add-to-cart"
                      >
                        {added ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Card>
            )}

            {activeVariants.length === 0 && (
              <Card className="mt-6 p-5 text-center">
                <p className="text-muted-foreground">No variants available for this product.</p>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
