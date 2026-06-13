import React from 'react';
import { Avatar, Button, Layout, Space, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import './AdminHeader.css';

const { Header } = Layout;
const { Text } = Typography;

export default function AdminHeader({ collapsed, onToggle }) {
  return (
    <Header className="admin-header">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        className="admin-header__trigger"
      />
      <div className="admin-header__right">
        <Space className="admin-header__user">
          <Avatar size="small" icon={<UserOutlined />} className="admin-header__avatar" />
          <Text>Admin</Text>
        </Space>
      </div>
    </Header>
  );
}
