import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import AuthCallbackPage from '@/pages/store/AuthCallbackPage';

import HomePage from '@/pages/store/HomePage';
import ProductsPage from '@/pages/store/ProductsPage';
import ProductDetailPage from '@/pages/store/ProductDetailPage';
import CartPage from '@/pages/store/CartPage';
import CheckoutPage from '@/pages/store/CheckoutPage';
import LoginPage from '@/pages/store/LoginPage';
import RegisterPage from '@/pages/store/RegisterPage';
import ProfilePage from '@/pages/store/ProfilePage';
import OrderDetailPage from '@/pages/store/OrderDetailPage';

import AdminDashboardPage from '@/pages/admin/DashboardPage';
import AdminProductsPage from '@/pages/admin/ProductsPage';
import AdminInventoryPage from '@/pages/admin/InventoryPage';
import AdminOrdersPage from '@/pages/admin/OrdersPage';
import AdminCustomersPage from '@/pages/admin/CustomersPage';
import AdminCategoriesPage from '@/pages/admin/CategoriesPage';
import AdminCouponsPage from '@/pages/admin/CouponsPage';
import AdminAnalyticsPage from '@/pages/admin/AnalyticsPage';
import AdminBannersPage from '@/pages/admin/BannersPage';
import AdminReviewsPage from '@/pages/admin/ReviewsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={
              <ProtectedRoute><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
            <Route path="profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="orders/:id" element={
              <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
            } />
          </Route>

          <Route path="admin" element={
            <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
