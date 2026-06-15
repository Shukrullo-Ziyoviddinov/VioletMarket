import React, { useCallback, useMemo, useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminModalContext from '../../context/AdminModalContext';
import AdminHeader from '../AdminHeader/AdminHeader';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import GlobalSectionModal from '../GlobalSectionModal/GlobalSectionModal';
import './AdminLayout.css';

const { Sider, Content } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSectionSelect = (section) => {
    // Hozircha faqat ayrim bo'limlarda modal ichida to'liq CRUD ishlaydi
    if (
      section?.key !== 'brand-country-filter-values' &&
      section?.key !== 'brand-country-categories' &&
      section?.key !== 'master-categories' &&
      section?.key !== 'banner' &&
      section?.key !== 'navbar-category' &&
      section?.key !== 'product-policy' &&
      section?.key !== 'video-banner' &&
      section?.key !== 'country-seller-banner' &&
      section?.key !== 'shipping-country' &&
      section?.key !== 'product-uzb-warehouse-info' &&
      section?.key !== 'logistics-info' &&
      section?.key !== 'footer' &&
      section?.key !== 'flash-sale-rules'
    ) {
      setActiveSection(null);
      setIsModalOpen(false);
      return;
    }
    setActiveSection(section);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const openAdminModal = useCallback((section) => {
    setActiveSection(section);
    setIsModalOpen(true);
  }, []);

  const modalContextValue = useMemo(
    () => ({
      openAdminModal,
      closeAdminModal: closeModal,
    }),
    [openAdminModal, closeModal],
  );

  return (
    <AdminModalContext.Provider value={modalContextValue}>
      <Layout className="admin-layout">
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          className="admin-layout__sider"
          trigger={null}
        >
          <AdminSidebar collapsed={collapsed} onSelectSection={handleSectionSelect} />
        </Sider>
        <Layout>
          <AdminHeader collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
          <Content className="admin-layout__content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
      <GlobalSectionModal open={isModalOpen} section={activeSection} onClose={closeModal} />
    </AdminModalContext.Provider>
  );
}
