import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Heart, Flame, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4" data-testid="page-about">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Our Story</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Born from a love of sweet scents and vibrant energy, 444 EVER Candle Company brings warmth and magic to your everyday moments.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="aspect-[4/3] rounded-md overflow-hidden">
              <img
                src="/images/lifestyle-cozy.png"
                alt="Candle making process"
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
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Crafted with Love
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Every 444 EVER candle is hand-poured in small batches using premium soy wax blends and carefully curated fragrance oils. We believe that the simple act of lighting a candle can transform your space and uplift your spirit.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our dessert-inspired collection draws from our favorite treats -- from whipped strawberry sundaes to rich chocolate truffles. Each scent is designed to evoke joy, comfort, and a touch of indulgence.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                <Heart className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                To bring warmth, color, and a little magic to your everyday moments through beautifully crafted candles.
              </p>
            </Card>
            <Card className="p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                <Flame className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Our Process</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Small-batch, hand-poured candles using premium soy wax, wooden and cotton wicks, and carefully curated scents.
              </p>
            </Card>
            <Card className="p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                <Leaf className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Our Promise</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Eco-friendly ingredients, sustainable packaging, and a commitment to quality in every candle we create.
              </p>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center"
        >
          <h2 className="font-heading text-3xl font-bold mb-4">Ready to Find Your Scent?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Browse our collection and discover the perfect candle for every mood.
          </p>
          <Link href="/shop">
            <Button size="lg" data-testid="button-browse-collection">
              Browse Collection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
