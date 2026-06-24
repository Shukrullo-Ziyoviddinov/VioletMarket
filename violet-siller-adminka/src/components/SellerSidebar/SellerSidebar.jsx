import React from 'react';
import { Menu } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import './SellerSidebar.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/${encodeURIComponent('vio_preview_rev_1 (1).png')}`;

const menuItems = [
  { key: 'home', icon: <DashboardOutlined />, label: 'Bosh sahifa', route: '/' },
];

function getSelectedKeyFromPath(pathname) {
  if (pathname === '/') return 'home';
  return 'home';
}

export default function SellerSidebar({ collapsed = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  const handleMenuClick = ({ key }) => {
    const selectedItem = menuItems.find((item) => item.key === key);
    if (selectedItem?.route) {
      navigate(selectedItem.route);
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
