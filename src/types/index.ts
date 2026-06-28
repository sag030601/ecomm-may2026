export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  addresses: Address[];
  avatar?: string;
  emailVerified?: boolean;
  oauthAccounts?: Array<{ provider: string; email: string; linkedAt: string }>;
}

export interface AuthSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
}

export interface Address {
  _id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  isActive: boolean;
}

export interface SizeVariant {
  size: string;
  stock: number;
  sku?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: Category | string;
  subcategory?: Category | string;
  images: string[];
  colors: string[];
  sizes: SizeVariant[];
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isSpecialCombo: boolean;
  isCrazyDeal: boolean;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color?: string;
  quantity: number;
  maxStock: number;
}

export interface Review {
  _id: string;
  product: string;
  user: User | string;
  rating: number;
  title?: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color?: string;
  quantity: number;
}

export interface Order {
  _id: string;
  user: User | string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  coupon?: { code: string };
  stripePaymentIntentId?: string;
  notes?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  position: number;
  isActive: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingReviews: number;
}
