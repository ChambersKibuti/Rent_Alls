import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Admin from './pages/AdminBackend';
import SellerRegister from './pages/SellerRegister';
import SellerDashboard from './pages/SellerDashboard';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerRegister from './pages/BuyerRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Showroom from './pages/Showroom';
import ShowroomRoom from './pages/ShowroomRoom';

const AuthenticatedApp = () => {
  // Auth state is checked in the background (see AuthContext) and consumed
  // individually by components that need it (Header, AdminBackend, etc).
  // Routing itself must never block on it -- a stale/expired token should
  // never prevent public pages like Home from rendering as the landing page.

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/buyer" element={<BuyerRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin-backend" element={<Admin />} />
      <Route path="/seller-register" element={<SellerRegister />} />
      <Route path="/seller-dashboard" element={<SellerDashboard />} />
      <Route path="/showroom" element={<Showroom />} />
      <Route path="/showroom/:id" element={<ShowroomRoom />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App