import React, { useMemo } from 'react';
import { Menu } from 'antd';
import { AppstoreOutlined, DashboardOutlined, MessageOutlined, PauseCircleOutlined, PlusCircleOutlined, ShopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useSellerMessageThreadsUnread } from '../../hooks/useSellerMessageThreadsUnread';
import './SellerSidebar.css';

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/${encodeURIComponent('vio_preview_rev_1 (1).png')}`;

const menuItems = [
  { key: 'home', icon: <DashboardOutlined />, labelKey: 'sidebar.home', route: '/' },
  { key: 'my-products', icon: <AppstoreOutlined />, labelKey: 'myProducts.title', route: '/products' },
  {
    key: 'discontinued-products',
    icon: <PauseCircleOutlined />,
    labelKey: 'discontinuedProducts.title',
    route: '/products/discontinued',
  },
  { key: 'add-products', icon: <PlusCircleOutlined />, labelKey: 'myProducts.addProduct', route: '/products/add' },
  { key: 'messages', icon: <MessageOutlined />, labelKey: 'messages.title', route: '/messages' },
  { key: 'market-info', icon: <ShopOutlined />, labelKey: 'marketInfo.title' },
];

function formatUnreadCount(count) {
  return count > 99 ? '99+' : String(count);
}

function SidebarUnreadBadge({ count, collapsed = false }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={`seller-sidebar__unread-badge${
        collapsed ? ' seller-sidebar__unread-badge--icon' : ''
      }`}
      aria-label={`${count} ta o'qilmagan xabar`}
    >
      {formatUnreadCount(count)}
    </span>
  );
}

function getSelectedKeyFromPath(pathname) {
  if (pathname === '/products/add') return 'add-products';
  if (pathname === '/products/discontinued') return 'discontinued-products';
  if (pathname === '/messages') return 'messages';
  if (pathname === '/products' || /^\/products\/\d+\/edit$/.test(pathname)) return 'my-products';
  if (pathname === '/') return 'home';
  return 'home';
}

export default function SellerSidebar({ collapsed = false, onOpenMarketInfo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated } = useSellerAuth();
  const totalUnread = useSellerMessageThreadsUnread(token, isAuthenticated);
  const selectedKey = getSelectedKeyFromPath(location.pathname);

  const sidebarMenuItems = useMemo(
    () =>
      menuItems.map(({ key, icon, labelKey, route }) => {
        const resolvedLabel = t(labelKey);

        if (key !== 'messages') {
          return { key, icon, label: resolvedLabel, route };
        }

        return {
          key,
          icon: (
            <span className="seller-sidebar__icon-wrap">
              {icon}
              {collapsed ? <SidebarUnreadBadge count={totalUnread} collapsed /> : null}
            </span>
          ),
          label: (
            <span className="seller-sidebar__menu-label">
              <span>{resolvedLabel}</span>
              {!collapsed ? <SidebarUnreadBadge count={totalUnread} /> : null}
            </span>
          ),
          route,
        };
      }),
    [t, totalUnread, collapsed],
  );

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
        items={sidebarMenuItems}
        onClick={handleMenuClick}
      />
    </aside>
  );
}
