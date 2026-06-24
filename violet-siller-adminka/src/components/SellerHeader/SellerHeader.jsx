import React from 'react';
import { Avatar, Button, Layout, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useSellerAuth } from '../../context/SellerAuthContext';
import './SellerHeader.css';

const { Header } = Layout;
const { Text } = Typography;

export default function SellerHeader({ collapsed, onToggle }) {
  const { seller } = useSellerAuth();
  const brandName = seller?.shopDisplayName || 'Violet';
  const profileName = seller?.firstName || 'Admin';

  return (
    <Header className="seller-header">
      <div className="seller-header__left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="seller-header__trigger"
          aria-label={collapsed ? 'Sidebarni ochish' : 'Sidebarni yopish'}
        />
        <Text className="seller-header__title">
          <span className="seller-header__brand">{brandName}</span> Admin dashboard
        </Text>
      </div>
      <div className="seller-header__right">
        <div className="seller-header__profile">
          <Avatar size="small" icon={<UserOutlined />} className="seller-header__avatar" />
          <Text className="seller-header__profile-name">{profileName}</Text>
        </div>
      </div>
    </Header>
  );
}
