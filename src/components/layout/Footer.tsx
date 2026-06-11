import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <h3 className="font-semibold text-xl mb-4">LUXE</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Premium fashion and lifestyle products curated for the modern shopper.
              Quality you can trust, style you&apos;ll love.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:support@luxe.com" className="text-muted-foreground hover:text-foreground" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-foreground transition-colors">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-foreground transition-colors">Featured</Link></li>
              <li><Link to="/products?bestSeller=true" className="hover:text-foreground transition-colors">Best Sellers</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link to="/products?crazyDeal=true" className="hover:text-foreground transition-colors">Flash Deals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
              <li><Link to="/profile" className="hover:text-foreground transition-colors">My Profile</Link></li>
              <li><Link to="/profile?tab=orders" className="hover:text-foreground transition-colors">Order History</Link></li>
              <li><Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Free shipping on orders $100+</li>
              <li>30-day hassle-free returns</li>
              <li>Secure Stripe checkout</li>
              <li>24/7 customer support</li>
              <li className="pt-2">
                <a href="mailto:support@luxe.com" className="hover:text-foreground transition-colors">
                  support@luxe.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LUXE. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Shipping Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
