import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const featured = await prisma.product.findMany({
    where: { featured: true, active: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return (
    <main className="bg-creamyIvory text-charcoalBlack font-body">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] w-full overflow-hidden bg-hero-gradient rounded-b-xl shadow-card">
        {/* Replace with supplied candle image */}
        <Image src="/images/candle-hero.jpg" alt="Candles" fill className="object-cover opacity-70" priority />
        <div className="relative z-10 flex flex-col items-center justify-center py-24 px-4 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-deepPlum drop-shadow-lg">444 EVER Candle Company</h1>
          <p className="mt-4 text-lg md:text-2xl text-creamyIvory font-medium">Handmade dessert-inspired candles for every mood.</p>
          <Link href="/shop" className="mt-8 inline-block rounded-xl bg-candleGold px-8 py-3 font-heading text-lg font-bold text-charcoalBlack shadow-card hover:bg-glowPeach transition">Shop Now</Link>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="mt-12 px-4">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-deepPlum mb-6">Featured Collection</h2>
        {featured.length === 0 ? (
          <p className="text-slate-600">No featured products yet. Run the seed.</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="min-w-[260px] max-w-xs bg-white rounded-xl shadow-card p-4 flex-shrink-0 snap-center hover:scale-105 transition"
              >
                {/* Replace with product image if available */}
                <div className="h-40 w-full bg-blushPink rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <Image src="/images/candle-featured.jpg" alt={p.name} width={120} height={120} className="object-contain" />
                </div>
                <div className="font-heading text-lg font-bold text-deepPlum">{p.name}</div>
                {p.description ? (
                  <div className="mt-1 text-sm text-charcoalBlack line-clamp-2">{p.description}</div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="mt-16 flex flex-col md:flex-row items-center gap-8 px-4">
        <div className="flex-1">
          {/* Replace with lifestyle image */}
          <div className="w-full h-56 md:h-72 bg-sageGreen rounded-xl overflow-hidden mb-4 md:mb-0">
            <Image src="/images/lifestyle-placeholder.jpg" alt="Lifestyle" fill className="object-cover" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-xl md:text-2xl font-bold text-deepPlum mb-2">Our Story</h3>
          <p className="text-charcoalBlack text-base md:text-lg">
            444 EVER Candle Company crafts vibrant, dessert-inspired candles to spark joy and elevate your space. Each candle is hand-poured with love, using premium ingredients and playful scents. Our mission: to bring warmth, color, and a little magic to your everyday moments.
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="mt-16 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Example value props, replace icons as needed */}
        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-card">
          <span className="text-candleGold text-4xl mb-2">🕯️</span>
          <div className="font-heading font-bold text-deepPlum">Handmade</div>
          <div className="text-charcoalBlack text-sm">Each candle is hand-poured with care.</div>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-card">
          <span className="text-sageGreen text-4xl mb-2">🌱</span>
          <div className="font-heading font-bold text-deepPlum">Eco-Friendly</div>
          <div className="text-charcoalBlack text-sm">Sustainable ingredients & packaging.</div>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-card">
          <span className="text-glowPeach text-4xl mb-2">🍰</span>
          <div className="font-heading font-bold text-deepPlum">Dessert-Inspired</div>
          <div className="text-charcoalBlack text-sm">Playful scents for every mood.</div>
        </div>
        <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-card">
          <span className="text-blushPink text-4xl mb-2">🚚</span>
          <div className="font-heading font-bold text-deepPlum">Fast Shipping</div>
          <div className="text-charcoalBlack text-sm">Quick, reliable delivery to your door.</div>
        </div>
      </section>

      {/* Shop by Mood Carousel */}
      <section className="mt-16 px-4">
        <h3 className="font-heading text-xl md:text-2xl font-bold text-deepPlum mb-6">Shop by Mood</h3>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {/* Example moods, replace with real data */}
          {["Cozy", "Energized", "Romantic", "Playful", "Relaxed"].map((mood) => (
            <div key={mood} className="min-w-[180px] max-w-xs bg-blushPink rounded-xl shadow-card p-6 flex flex-col items-center snap-center">
              <span className="text-4xl mb-2">🕯️</span>
              <div className="font-heading font-bold text-deepPlum">{mood}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-16 px-4">
        <h3 className="font-heading text-xl md:text-2xl font-bold text-deepPlum mb-6">What Our Customers Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Example testimonials, replace with real data */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-glowPeach text-2xl mb-2">“</div>
            <div className="text-charcoalBlack text-base mb-2">Absolutely love these candles! The scents are delicious and the colors brighten my home.</div>
            <div className="font-heading font-bold text-deepPlum">– Jamie</div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-glowPeach text-2xl mb-2">“</div>
            <div className="text-charcoalBlack text-base mb-2">Fast shipping and beautiful packaging. Will definitely order again!</div>
            <div className="font-heading font-bold text-deepPlum">– Taylor</div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-glowPeach text-2xl mb-2">“</div>
            <div className="text-charcoalBlack text-base mb-2">The dessert-inspired scents are so fun and unique. Highly recommend!</div>
            <div className="font-heading font-bold text-deepPlum">– Morgan</div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="mt-16 px-4 flex flex-col items-center">
        <h3 className="font-heading text-xl md:text-2xl font-bold text-deepPlum mb-2">Stay in the Glow</h3>
        <p className="text-charcoalBlack mb-4">Sign up for exclusive offers, new scents, and more!</p>
        <form className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <input type="email" placeholder="Your email" className="flex-1 rounded-xl border border-blushPink px-4 py-3 focus:outline-none focus:ring-2 focus:ring-candleGold" required />
          <button type="submit" className="rounded-xl bg-candleGold px-6 py-3 font-heading font-bold text-charcoalBlack hover:bg-glowPeach transition">Sign Up</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-10 px-4 bg-footer-gradient text-creamyIvory rounded-t-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* Replace with logo image */}
            <Image src="/images/logo-placeholder.png" alt="444 EVER Logo" width={48} height={48} />
            <span className="font-heading text-xl font-bold">444 EVER</span>
          </div>
          <nav className="flex gap-6 font-heading text-lg">
            <Link href="/shop">Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <div className="flex gap-4">
            {/* Social icons as placeholders */}
            <a href="#" aria-label="Instagram" className="hover:text-candleGold transition">📸</a>
            <a href="#" aria-label="TikTok" className="hover:text-candleGold transition">🎵</a>
            <a href="#" aria-label="Email" className="hover:text-candleGold transition">✉️</a>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-creamyIvory/80">© {new Date().getFullYear()} 444 EVER Candle Company. All rights reserved.</div>
      </footer>
    </main>
  );
}
