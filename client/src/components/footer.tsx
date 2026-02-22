import { Link } from "wouter";
import { Flame } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-6 h-6 text-accent" />
              <span className="font-heading text-2xl font-bold">444 EVER</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              Handmade dessert-inspired candles crafted with love to spark joy and elevate your space.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/shop">
                <span className="text-primary-foreground/80 text-sm cursor-pointer transition-colors" data-testid="footer-link-shop">Shop</span>
              </Link>
              <Link href="/about">
                <span className="text-primary-foreground/80 text-sm cursor-pointer transition-colors" data-testid="footer-link-about">About</span>
              </Link>
              <Link href="/cart">
                <span className="text-primary-foreground/80 text-sm cursor-pointer transition-colors" data-testid="footer-link-cart">Cart</span>
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" aria-label="Instagram" className="text-primary-foreground/80 transition-colors" data-testid="link-instagram">
                <SiInstagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="TikTok" className="text-primary-foreground/80 transition-colors" data-testid="link-tiktok">
                <SiTiktok className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Email" className="text-primary-foreground/80 transition-colors" data-testid="link-email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/60 text-sm">
            &copy; {new Date().getFullYear()} 444 EVER Candle Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
