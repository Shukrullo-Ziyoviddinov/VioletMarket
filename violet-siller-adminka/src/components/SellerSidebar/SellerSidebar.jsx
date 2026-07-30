import React, { useMemo } from 'react';
import { Menu } from 'antd';
import {
  AppstoreOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DollarOutlined,
  HistoryOutlined,
  LineChartOutlined,
  MessageOutlined,
  PauseCircleOutlined,
  PlusCircleOutlined,
  RollbackOutlined,
  ShoppingOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useSellerMessageThreadsUnread } from '../../hooks/useSellerMessageThreadsUnread';
import { useSellerSupportChatUnread } from '../../hooks/useSellerSupportChatUnread';
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
  { key: 'orders', icon: <ShoppingOutlined />, labelKey: 'sidebar.orders', route: '/orders' },
  {
    key: 'returned-orders',
    icon: <RollbackOutlined />,
    labelKey: 'sidebar.returnedOrders',
    route: '/orders/returned',
  },
  { key: 'sales-statistics', icon: <LineChartOutlined />, labelKey: 'sidebar.salesStatistics', route: '/sales/statistics' },
  { key: 'sales-earnings', icon: <DollarOutlined />, labelKey: 'sidebar.salesEarnings', route: '/sales/earnings' },
  { key: 'sales-withdrawals', icon: <HistoryOutlined />, labelKey: 'sidebar.salesWithdrawals', route: '/sales/withdrawals' },
  { key: 'messages', icon: <MessageOutlined />, labelKey: 'messages.title', route: '/messages' },
  { key: 'support', icon: <CustomerServiceOutlined />, label: 'Yordam' },
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
  if (pathname === '/orders/returned') return 'returned-orders';
  if (pathname === '/orders') return 'orders';
  if (pathname === '/messages') return 'messages';
  if (pathname === '/sales/statistics') return 'sales-statistics';
  if (pathname === '/sales/earnings') return 'sales-earnings';
  if (pathname === '/sales/withdrawals') return 'sales-withdrawals';
  if (pathname === '/products' || /^\/products\/\d+\/edit$/.test(pathname)) return 'my-products';
  if (pathname === '/') return 'home';
  return 'home';
}

export default function SellerSidebar({
  collapsed = false,
  onOpenMarketInfo,
  onOpenSupport,
  supportOpen = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated } = useSellerAuth();
  const totalUnread = useSellerMessageThreadsUnread(token, isAuthenticated);
  const { unreadCount: supportUnread } = useSellerSupportChatUnread();
  const selectedKey = supportOpen
    ? 'support'
    : getSelectedKeyFromPath(location.pathname);

  const sidebarMenuItems = useMemo(
    () =>
      menuItems.map((item) => {
        const { key, icon, labelKey, label, route } = item;
        const resolvedLabel = labelKey ? t(labelKey) : label;

        if (key === 'messages') {
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
        }

        if (key === 'support') {
          return {
            key,
            icon: (
              <span className="seller-sidebar__icon-wrap">
                {icon}
                {collapsed ? (
                  <SidebarUnreadBadge count={supportUnread} collapsed />
                ) : null}
              </span>
            ),
            label: (
              <span className="seller-sidebar__menu-label">
                <span>{resolvedLabel}</span>
                {!collapsed ? <SidebarUnreadBadge count={supportUnread} /> : null}
              </span>
            ),
          };
        }

        return { key, icon, label: resolvedLabel, route };
      }),
    [t, totalUnread, supportUnread, collapsed],
  );

  const handleMenuClick = ({ key }) => {
    const selectedItem = menuItems.find((item) => item.key === key);
    if (!selectedItem) return;

    if (key === 'support') {
      onOpenSupport?.();
      return;
    }

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
