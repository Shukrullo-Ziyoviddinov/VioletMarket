import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminDashboardOverview from './components/AdminDashboardOverview/AdminDashboardOverview';
import CustomerStatisticPage from './pages/CustomerStatisticPage/CustomerStatisticPage';
import FlashPage from './pages/FlashPage/FlashPage';
import ProductPage from './pages/ProductPage/ProductPage';
import SellersPage from './pages/SellersPage/SellersPage';
import CouriersPage from './pages/CouriersPage/CouriersPage';
import LogisticaPage from './pages/LogisticaPage/LogisticaPage';
import LogisticaShipmentsPage from './pages/LogisticaShipmentsPage/LogisticaShipmentsPage';
import CargoFeePaymentsPage from './pages/CargoFeePaymentsPage/CargoFeePaymentsPage';
import CourierChatsPage from './pages/CourierChatsPage/CourierChatsPage';
import LogisticaChatsPage from './pages/LogisticaChatsPage/LogisticaChatsPage';
import SalesStatisticsPage from './pages/SalesStatisticsPage/SalesStatisticsPage';
import PaymentRequestsPage from './pages/PaymentRequestsPage/PaymentRequestsPage';
import WithdrawalPage from './pages/WithdrawalPage/WithdrawalPage';
import OrdersPage from './pages/OrdersPage/OrdersPage';
import ForeignOrdersPage from './pages/ForeignOrdersPage/ForeignOrdersPage';
import ReturnRequestsPage from './pages/ReturnRequestsPage/ReturnRequestsPage';
import ReturnedProductsPage from './pages/ReturnedProductsPage/ReturnedProductsPage';
import CustomerRefundRequestsPage from './pages/CustomerRefundRequestsPage/CustomerRefundRequestsPage';

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
          <Route path="orders" element={<OrdersPage />} />
          <Route path="foreign-orders" element={<ForeignOrdersPage />} />
          <Route path="return-requests" element={<ReturnRequestsPage />} />
          <Route path="returned-products" element={<ReturnedProductsPage />} />
          <Route path="customer-refunds" element={<CustomerRefundRequestsPage />} />
          <Route path="couriers" element={<CouriersPage />} />
          <Route path="logistica" element={<LogisticaPage />} />
          <Route path="logistica-shipments" element={<LogisticaShipmentsPage />} />
          <Route path="cargo-fee-payments" element={<CargoFeePaymentsPage />} />
          <Route path="courier-chats" element={<CourierChatsPage />} />
          <Route path="logistica-chats" element={<LogisticaChatsPage />} />
          <Route path="payment-requests" element={<PaymentRequestsPage />} />
          <Route path="withdrawals" element={<WithdrawalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
