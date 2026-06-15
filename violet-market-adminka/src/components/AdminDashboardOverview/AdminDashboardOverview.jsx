import React, { useEffect, useState } from 'react';
import {
  BarChartOutlined,
  InboxOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { fetchProductStats } from '../../api/productsAdminApi';
import { formatStatNumber, formatTodayHighlight } from '../../utils/productDisplay';
import AdminStatCard from '../AdminStatCard/AdminStatCard';
import './AdminDashboardOverview.css';

export default function AdminDashboardOverview() {
  const [productStats, setProductStats] = useState({ total: 0, addedToday: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProductStats() {
      setStatsLoading(true);

      try {
        const stats = await fetchProductStats();
        if (!cancelled) setProductStats(stats);
      } catch (_error) {
        if (!cancelled) setProductStats({ total: 0, addedToday: 0 });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadProductStats();

    return () => {
      cancelled = true;
    };
  }, []);

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
          value={statsLoading ? '...' : formatStatNumber(productStats.total)}
          footerLabel="Yangi bugun: "
          footerHighlight={statsLoading ? '...' : formatTodayHighlight(productStats.addedToday)}
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
