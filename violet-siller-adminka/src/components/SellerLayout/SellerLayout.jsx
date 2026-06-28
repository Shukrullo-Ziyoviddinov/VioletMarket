import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import GlobalModal from '../GlobalModal/GlobalModal';
import MarketInfo from '../MarketInfo/MarketInfo';
import MiniGlobalModal from '../MiniGlobalModal/MiniGlobalModal';
import SellerHeader from '../SellerHeader/SellerHeader';
import SellerSidebar from '../SellerSidebar/SellerSidebar';
import { useSellerCabinetSession } from '../../hooks/useSellerCabinetSession';
import './SellerLayout.css';

const { Sider, Content } = Layout;

export default function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMarketInfoOpen, setIsMarketInfoOpen] = useState(false);
  const { isPausedNoticeOpen, closePausedNotice } = useSellerCabinetSession();

  return (
    <Layout
      className="seller-layout"
      style={{ '--seller-sider-width': collapsed ? '80px' : '240px' }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        width={240}
        className="seller-layout__sider"
        trigger={null}
      >
        <SellerSidebar
          collapsed={collapsed}
          onOpenMarketInfo={() => setIsMarketInfoOpen(true)}
        />
      </Sider>
      <Layout>
        <SellerHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <Content className="seller-layout__content">
          <Outlet />
        </Content>
      </Layout>

      <GlobalModal
        open={isMarketInfoOpen}
        title="Market haqida"
        onClose={() => setIsMarketInfoOpen(false)}
      >
        <MarketInfo />
      </GlobalModal>

      <MiniGlobalModal
        open={isPausedNoticeOpen}
        variant="seller-paused"
        onClose={closePausedNotice}
      />
    </Layout>
  );
}
