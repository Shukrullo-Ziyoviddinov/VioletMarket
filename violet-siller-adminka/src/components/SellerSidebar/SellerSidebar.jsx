import React from 'react';
import { Menu } from 'antd';
import { AppstoreOutlined, DashboardOutlined, PlusCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import './SellerSidebar.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/${encodeURIComponent('vio_preview_rev_1 (1).png')}`;

const menuItems = [
  { key: 'home', icon: <DashboardOutlined />, label: 'Bosh sahifa', route: '/' },
  { key: 'my-products', icon: <AppstoreOutlined />, label: 'Mening mahsulotlarim', route: '/products' },
  { key: 'add-products', icon: <PlusCircleOutlined />, label: "Mahsulot qo'shish", route: '/products/add' },
  { key: 'market-info', icon: <ShopOutlined />, label: 'Market haqida' },
];

function getSelectedKeyFromPath(pathname) {
  if (pathname === '/products/add') return 'add-products';
  if (pathname === '/products' || /^\/products\/\d+\/edit$/.test(pathname)) return 'my-products';
  if (pathname === '/') return 'home';
  return 'home';
}

export default function SellerSidebar({ collapsed = false, onOpenMarketInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  const handleMenuClick = ({ key }) => {
    const selectedItem = menuItems.find((item) => item.key === key);
    if (!selectedItem) return;

    if (selectedItem.route) {
      navigate(selectedItem.route);
      return;
    }

    if (key === 'market-info' && typeof onOpenMarketInfo === 'function') {
      onOpenMarketInfo();
    }
  };

  return (
    <aside className={`seller-sidebar${collapsed ? ' seller-sidebar--collapsed' : ''}`}>
      <div className="seller-sidebar__logo">
        <img
          src={LOGO_SRC}
          alt="Violet Market"
          className={`seller-sidebar__logo-img${
            collapsed ? ' seller-sidebar__logo-img--collapsed' : ''
          }`}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        className="seller-sidebar__menu"
        selectedKeys={[selectedKey]}
        items={menuItems.map(({ key, icon, label }) => ({ key, icon, label }))}
        onClick={handleMenuClick}
      />
    </aside>
  );
}
