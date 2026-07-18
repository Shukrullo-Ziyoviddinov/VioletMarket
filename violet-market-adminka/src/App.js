import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminDashboardOverview from './components/AdminDashboardOverview/AdminDashboardOverview';
import CustomerStatisticPage from './pages/CustomerStatisticPage/CustomerStatisticPage';
import FlashPage from './pages/FlashPage/FlashPage';
import ProductPage from './pages/ProductPage/ProductPage';
import SellersPage from './pages/SellersPage/SellersPage';
import CouriersPage from './pages/CouriersPage/CouriersPage';
import SalesStatisticsPage from './pages/SalesStatisticsPage/SalesStatisticsPage';
import PaymentRequestsPage from './pages/PaymentRequestsPage/PaymentRequestsPage';
import WithdrawalPage from './pages/WithdrawalPage/WithdrawalPage';

function AllProductsPage() {
  return <ProductPage mode="all" />;
}

function PausedProductsPage() {
  return <ProductPage mode="paused" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboardOverview />} />
          <Route path="customers/statistics" element={<CustomerStatisticPage />} />
          <Route path="sales/statistics" element={<SalesStatisticsPage />} />
          <Route path="products/paused" element={<PausedProductsPage />} />
          <Route path="products" element={<AllProductsPage />} />
          <Route path="flash-products" element={<FlashPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="couriers" element={<CouriersPage />} />
          <Route path="payment-requests" element={<PaymentRequestsPage />} />
          <Route path="withdrawals" element={<WithdrawalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
