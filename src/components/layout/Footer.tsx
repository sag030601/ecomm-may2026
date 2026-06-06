import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">LUXE</h3>
            <p className="text-sm text-muted-foreground">
              Premium fashion and lifestyle products. Quality you can trust.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link to="/products?bestSeller=true" className="hover:text-foreground">Best Sellers</Link></li>
              <li><Link to="/products?specialCombo=true" className="hover:text-foreground">Special Combos</Link></li>
              <li><Link to="/products?crazyDeal=true" className="hover:text-foreground">Crazy Deals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
              <li><Link to="/profile" className="hover:text-foreground">My Profile</Link></li>
              <li><Link to="/cart" className="hover:text-foreground">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Free shipping on orders $100+</li>
              <li>30-day returns</li>
              <li>Secure checkout</li>
              <li>24/7 customer support</li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LUXE. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
