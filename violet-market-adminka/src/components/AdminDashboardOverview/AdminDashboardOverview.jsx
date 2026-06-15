import React from 'react';
import { BarChartOutlined, InboxOutlined } from '@ant-design/icons';
import AdminStatCard from '../AdminStatCard/AdminStatCard';
import './AdminDashboardOverview.css';

export default function AdminDashboardOverview() {
  return (
    <section className="admin-dashboard-overview">
      <div className="admin-dashboard-overview__grid">
        <AdminStatCard
          icon={<BarChartOutlined />}
          iconTone="purple"
          title="Sotuvlar"
          value="$15,200"
          badgeText="this month"
          footerText="Oylik o'sish: +12%"
          showChart
        />
        <AdminStatCard
          icon={<InboxOutlined />}
          iconTone="blue"
          title="Mahsulotlar"
          value="1,450"
          footerText="Yangi bugun: +8"
        />
      </div>
    </section>
  );
}
