import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminDashboardOverview from './components/AdminDashboardOverview/AdminDashboardOverview';
import ProductPage from './pages/ProductPage/ProductPage';

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
          <Route path="products" element={<AllProductsPage />} />
          <Route path="products/paused" element={<PausedProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
