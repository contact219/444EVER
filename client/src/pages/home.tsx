import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Leaf, Truck, Sparkles, HandMetal } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductWithVariants } from "@shared/schema";
import { formatMoney } from "@/lib/cart";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const testimonials = [
  {
    quote: "Absolutely love these candles! The scents are delicious and the colors brighten my home.",
    name: "Jamie R.",
  },
  {
    quote: "Fast shipping and beautiful packaging. Will definitely order again!",
    name: "Taylor M.",
  },
  {
    quote: "The dessert-inspired scents are so fun and unique. Highly recommend!",
    name: "Morgan K.",
  },
];

const valueProps = [
  { icon: HandMetal, title: "Handmade", desc: "Each candle is hand-poured with care and attention to detail." },
  { icon: Leaf, title: "Eco-Friendly", desc: "Sustainable ingredients and eco-conscious packaging." },
  { icon: Sparkles, title: "Dessert-Inspired", desc: "Playful, sweet scents for every mood and moment." },
  { icon: Truck, title: "Fast Shipping", desc: "Quick, reliable delivery straight to your door." },
];

export default function HomePage() {
  const { data: featured, isLoading } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src="/images/hero-candles.png"
            alt="444 EVER Candles"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            Spark Joy,{" "}
            <span className="text-amber-300">Elevate</span>{" "}
            Your Space
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed"
          >
            Handmade dessert-inspired candles crafted with love. Premium ingredients, playful scents, and vibrant colors for every mood.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/shop">
              <Button size="lg" className="text-base px-8" data-testid="button-shop-now">
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="text-base px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white" data-testid="button-our-story">
                Our Story
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4" data-testid="section-featured">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Featured Collection</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Our most loved scents, handpicked for you
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="aspect-square rounded-md mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured?.map((product, i) => {
                const minPrice = product.variants.length
                  ? Math.min(...product.variants.map((v) => v.priceCents))
                  : null;

                return (
                  <motion.div
                    key={product.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUp}
                  >
                    <Link href={`/products/${product.slug}`}>
                      <Card className="group cursor-pointer hover-elevate p-0" data-testid={`card-product-${product.slug}`}>
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
                        <div className="p-4">
                          <h3 className="font-heading text-lg font-semibold">{product.name}</h3>
                          {product.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                          )}
                          {minPrice !== null && (
                            <p className="mt-2 text-sm font-medium text-accent-foreground">
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
          )}

          <div className="text-center mt-10">
            <Link href="/shop">
              <Button variant="outline" size="lg" data-testid="button-view-all">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card" data-testid="section-about-preview">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-[4/3] rounded-md overflow-hidden">
              <img
                src="/images/lifestyle-cozy.png"
                alt="Cozy candle lifestyle"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              444 EVER Candle Company crafts vibrant, dessert-inspired candles to spark joy and elevate your space. Each candle is hand-poured with love, using premium ingredients and playful scents.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our mission: to bring warmth, color, and a little magic to your everyday moments.
            </p>
            <Link href="/about">
              <Button variant="outline" data-testid="button-learn-more">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4" data-testid="section-values">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Why 444 EVER?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, i) => (
              <motion.div
                key={prop.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Card className="p-6 text-center h-full">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <prop.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">{prop.title}</h3>
                  <p className="text-sm text-muted-foreground">{prop.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card" data-testid="section-testimonials">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">What Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Card className="p-6 h-full flex flex-col justify-between">
                  <p className="text-muted-foreground leading-relaxed italic mb-4">
                    "{t.quote}"
                  </p>
                  <p className="font-heading font-semibold text-sm">-- {t.name}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4" data-testid="section-newsletter">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Stay in the Glow</h2>
          <p className="text-muted-foreground mb-8">
            Sign up for exclusive offers, new scents, and more!
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-md border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-newsletter-email"
              required
            />
            <Button type="submit" className="px-8" data-testid="button-newsletter-signup">
              Sign Up
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
