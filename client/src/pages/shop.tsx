import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductWithVariants } from "@shared/schema";
import { formatMoney } from "@/lib/cart";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function ShopPage() {
  const { data: products, isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-shop">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Our Candles</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Browse our full collection of handmade dessert-inspired candles
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="aspect-square rounded-md mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, i) => {
              const minPrice = product.variants.length
                ? Math.min(...product.variants.map((v) => v.priceCents))
                : null;

              return (
                <motion.div
                  key={product.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  variants={fadeUp}
                >
                  <Link href={`/products/${product.slug}`}>
                    <Card className="group cursor-pointer hover-elevate p-0 h-full" data-testid={`card-product-${product.slug}`}>
                      <div className="aspect-square overflow-hidden rounded-t-md bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-heading text-xl font-semibold">{product.name}</h3>
                        {product.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        )}
                        {minPrice !== null && (
                          <p className="mt-3 text-base font-semibold">
                            From {formatMoney(minPrice)}
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">No Products Yet</h3>
            <p className="text-muted-foreground">Check back soon for our latest creations!</p>
          </div>
        )}
      </div>
    </div>
  );
}
