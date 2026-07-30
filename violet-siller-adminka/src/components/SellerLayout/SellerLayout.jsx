import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import GlobalModal from '../GlobalModal/GlobalModal';
import MarketInfo from '../MarketInfo/MarketInfo';
import MiniGlobalModal from '../MiniGlobalModal/MiniGlobalModal';
import SellerHeader from '../SellerHeader/SellerHeader';
import SellerSidebar from '../SellerSidebar/SellerSidebar';
import SellerSupportChatModal from '../SellerSupportChatModal/SellerSupportChatModal';
import MessageChatSocketBridge from '../MessageChatSocketBridge/MessageChatSocketBridge';
import { useSellerCabinetSession } from '../../hooks/useSellerCabinetSession';
import { OPEN_SELLER_SUPPORT_CHAT_EVENT } from '../../constants/sellerSupportChatEvents';
import './SellerLayout.css';

const { Sider, Content } = Layout;

export default function SellerLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMarketInfoOpen, setIsMarketInfoOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { isPausedNoticeOpen, closePausedNotice } = useSellerCabinetSession();

  useEffect(() => {
    const onOpenSupport = () => setIsSupportOpen(true);
    window.addEventListener(OPEN_SELLER_SUPPORT_CHAT_EVENT, onOpenSupport);
    return () => window.removeEventListener(OPEN_SELLER_SUPPORT_CHAT_EVENT, onOpenSupport);
  }, []);

  return (
    <Layout
      className="seller-layout"
      style={{ '--seller-sider-width': collapsed ? '80px' : '240px' }}
    >
      <MessageChatSocketBridge />
      <Sider
        collapsible
        collapsed={collapsed}
        width={240}
        className="seller-layout__sider"
        trigger={null}
      >
        <SellerSidebar
          collapsed={collapsed}
          supportOpen={isSupportOpen}
          onOpenMarketInfo={() => setIsMarketInfoOpen(true)}
          onOpenSupport={() => setIsSupportOpen(true)}
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
        title={t('marketInfo.title')}
        onClose={() => setIsMarketInfoOpen(false)}
      >
        <MarketInfo />
      </GlobalModal>

      <SellerSupportChatModal
        open={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <MiniGlobalModal
        open={isPausedNoticeOpen}
        variant="seller-paused"
        onClose={closePausedNotice}
      />
    </Layout>
  );
}
