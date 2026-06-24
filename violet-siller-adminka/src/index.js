import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import App from './App';
import { violetTheme } from './config/theme';
import { SellerAuthProvider } from './context/SellerAuthContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider theme={violetTheme} locale={uzUZ}>
      <SellerAuthProvider>
        <App />
      </SellerAuthProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
