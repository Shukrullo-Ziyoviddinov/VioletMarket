import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminDashboardOverview from './components/AdminDashboardOverview/AdminDashboardOverview';
import ProductPage from './pages/ProductPage/ProductPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboardOverview />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
