import React from 'react';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ControlOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FireOutlined,
  GlobalOutlined,
  InboxOutlined,
  LayoutOutlined,
  LogoutOutlined,
  MenuOutlined,
  PauseCircleOutlined,
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
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Bosh sahifa', route: '/' },
  {
    key: 'customers-statistics',
    icon: <TeamOutlined />,
    label: 'Mijozlar va statistika',
    route: '/customers/statistics',
  },
  { key: 'products', icon: <InboxOutlined />, label: 'Mahsulotlar ma\'lumoti', route: '/products' },
  {
    key: 'flash-products',
    icon: <FireOutlined />,
    label: 'Katta chegirma mahsulotlar',
    route: '/flash-products',
  },
  {
    key: 'products-paused',
    icon: <PauseCircleOutlined />,
    label: "Vaqtincha to'xtatilgan",
    title: "Vaqtincha to'xtatilgan mahsulotlar",
    route: '/products/paused',
  },
  { key: 'brand-country-filter-values', icon: <TrademarkOutlined />, label: 'BrandCategories&CountryCategories' },
  { key: 'brand-country-categories', icon: <TeamOutlined />, label: 'Brend va davlat categoriya' },
  { key: 'master-categories', icon: <MenuOutlined />, label: 'Master categoriya' },
  { key: 'product-types', icon: <InboxOutlined />, label: 'Mahsulot turlari categoriyasi' },
  { key: 'banner', icon: <PictureOutlined />, label: 'Banner' },
  { key: 'video-banner', icon: <VideoCameraOutlined />, label: 'Video banner' },
  { key: 'country-seller-banner', icon: <ShopOutlined />, label: 'Davlat seller banner' },
  { key: 'navbar-category', icon: <MenuOutlined />, label: 'Navbar category' },
  { key: 'product-policy', icon: <FileProtectOutlined />, label: 'Product policy' },
  { key: 'sellers', icon: <TeamOutlined />, label: 'Sotuvchilar', route: '/sellers' },
  { key: 'shipping-country', icon: <GlobalOutlined />, label: "Mahsulot hududi" },
  { key: 'product-uzb-warehouse-info', icon: <InboxOutlined />, label: "Mahsulot UZB omborida" },
  { key: 'logistics-info', icon: <ControlOutlined />, label: "Logistika ma'lumoti" },
  { key: 'flash-sale-rules', icon: <ControlOutlined />, label: 'Flash sale rules' },
  { key: 'footer', icon: <LayoutOutlined />, label: 'Footer' },
];

function getSelectedKeyFromPath(pathname) {
  if (pathname === '/customers/statistics') return 'customers-statistics';
  if (pathname === '/products/paused') return 'products-paused';
  if (pathname === '/flash-products') return 'flash-products';
  if (pathname === '/products') return 'products';
  if (pathname === '/sellers') return 'sellers';
  return 'dashboard';
}

export default function AdminSidebar({ collapsed, onSelectSection }) {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  const handleMenuClick = ({ key }) => {
    const selectedSection = menuItems.find((item) => item.key === key);
    if (!selectedSection) return;

    if (selectedSection.route) {
      navigate(selectedSection.route);
      if (typeof onSelectSection === 'function') {
        onSelectSection(null);
      }
      return;
    }

    if (typeof onSelectSection === 'function') {
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
          items={menuItems.map(({ key, icon, label, title }) => ({
            key,
            icon,
            label,
            title,
          }))}
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
