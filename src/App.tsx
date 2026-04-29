import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { CartProvider } from './store/CartContext';
import { WishlistProvider } from './store/WishlistContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGate from './components/AdminGate';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/Product';
import Cart from './pages/Cart';
import About from './pages/About';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Account from './pages/Account';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderSuccess from './pages/OrderSuccess';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminVideos from './pages/admin/AdminVideos';
import Wishlist from './pages/Wishlist';
import Videos from './pages/Videos';

function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <Routes>
            {/* Admin — no navbar/footer, dark sidebar layout */}
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminLayout />
                </AdminGate>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:id" element={<AdminProductForm />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="settings" element={<AdminSiteSettings />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="videos" element={<AdminVideos />} />
            </Route>

            {/* Shop — with navbar/footer */}
            <Route
              path="*"
              element={
                <ShopLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                    <Route path="/order/:id/success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </ShopLayout>
              }
            />
          </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
