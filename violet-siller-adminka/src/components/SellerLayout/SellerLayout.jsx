import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import SellerHeader from '../SellerHeader/SellerHeader';
import SellerSidebar from '../SellerSidebar/SellerSidebar';
import './SellerLayout.css';

const { Sider, Content } = Layout;

export default function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="seller-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        width={240}
        className="seller-layout__sider"
        trigger={null}
      >
        <SellerSidebar collapsed={collapsed} />
      </Sider>
      <Layout>
        <SellerHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <Content className="seller-layout__content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
