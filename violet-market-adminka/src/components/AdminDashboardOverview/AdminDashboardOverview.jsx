import React from 'react';
import {
  BarChartOutlined,
  InboxOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
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
          footerLabel="Oylik o'sish: "
          footerHighlight="+12%"
          showChart
        />
        <AdminStatCard
          icon={<InboxOutlined />}
          iconTone="blue"
          title="Mahsulotlar"
          value="1,450"
          footerLabel="Yangi bugun: "
          footerHighlight="+8"
        />
        <AdminStatCard
          icon={<TeamOutlined />}
          iconTone="blue"
          title="Yangi Mijozlar"
          value="210"
          footerLabel="Yangi bugun: "
          footerHighlight="+15"
        />
        <AdminStatCard
          icon={<ProfileOutlined />}
          iconTone="purple"
          title="Buyurtmalar"
          value="85"
          footerLabel="Jarayonda: "
          footerHighlight="12"
        />
      </div>
    </section>
  );
}
