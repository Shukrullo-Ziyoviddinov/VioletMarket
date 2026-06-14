import React, { useState } from 'react';
import { Menu } from 'antd';
import {
  ControlOutlined,
  DashboardOutlined,
  FireOutlined,
  FileProtectOutlined,
  LayoutOutlined,
  LogoutOutlined,
  MenuOutlined,
  PictureOutlined,
  ShopOutlined,
  TeamOutlined,
  TrademarkOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import ScrollArea from '../ScrollArea/ScrollArea';
import './AdminSidebar.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/vlll_preview_rev_1.png`;

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Bosh sahifa' },
  { key: 'brand-country-categories', icon: <TrademarkOutlined />, label: 'BrandCategories&CountryCategories' },
  { key: 'banner', icon: <PictureOutlined />, label: 'Banner' },
  { key: 'video-banner', icon: <VideoCameraOutlined />, label: 'Video banner' },
  { key: 'country-seller-banner', icon: <ShopOutlined />, label: 'Davlat seller banner' },
  { key: 'navbar-category', icon: <MenuOutlined />, label: 'Navbar category' },
  { key: 'product-policy', icon: <FileProtectOutlined />, label: 'Product policy' },
  { key: 'sellers', icon: <TeamOutlined />, label: 'Sotuvchilar' },
  { key: 'flash-sale', icon: <FireOutlined />, label: 'Flash Sale' },
  { key: 'flash-sale-rules', icon: <ControlOutlined />, label: 'Flash sale rules' },
  { key: 'footer', icon: <LayoutOutlined />, label: 'Footer' },
];

export default function AdminSidebar({ collapsed, onSelectSection }) {
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    const selectedSection = menuItems.find((item) => item.key === key);
    if (selectedSection && typeof onSelectSection === 'function') {
      onSelectSection(selectedSection);
    }
  };

  return (
    <aside className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}`}>
      <div className="admin-sidebar__logo">
        <img
          src={LOGO_SRC}
          alt="Violet Market"
          className={`admin-sidebar__logo-img${
            collapsed ? ' admin-sidebar__logo-img--collapsed' : ''
          }`}
        />
      </div>

      <ScrollArea className="admin-sidebar__scroll">
        <Menu
          theme="dark"
          mode="inline"
          className="admin-sidebar__menu"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </ScrollArea>

      <div className="admin-sidebar__account">
        <button type="button" className="admin-sidebar__logout" title="Chiqish">
          <LogoutOutlined className="admin-sidebar__logout-icon" />
          {!collapsed ? <span className="admin-sidebar__logout-text">Chiqish</span> : null}
        </button>
      </div>
    </aside>
  );
}
