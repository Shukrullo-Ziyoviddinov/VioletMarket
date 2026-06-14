import React, { useState } from 'react';
import { Layout } from 'antd';
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
    // Hozircha faqat Navbar category va Video banner bo'limlari real ishlaydi
    if (section?.key !== 'navbar-category' && section?.key !== 'video-banner') {
      setActiveSection(null);
      setIsModalOpen(false);
      return;
    }
    setActiveSection(section);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <>
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
            <div className="admin-layout__placeholder">
              <h2>Bo'limni tanlang</h2>
              <p>Hozircha Navbar category va Video banner bo'limlarida modal va to'ldirish ishlaydi.</p>
            </div>
          </Content>
        </Layout>
      </Layout>
      <GlobalSectionModal open={isModalOpen} section={activeSection} onClose={closeModal} />
    </>
  );
}
