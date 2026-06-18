import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  InboxOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { fetchCustomerDashboardStats } from '../../api/customerStatisticsAdminApi';
import { fetchProductStats } from '../../api/productsAdminApi';
import { formatStatNumber, formatTodayHighlight } from '../../utils/productDisplay';
import AdminStatCard from '../AdminStatCard/AdminStatCard';
import './AdminDashboardOverview.css';

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const [productStats, setProductStats] = useState({ total: 0, addedToday: 0 });
  const [customerStats, setCustomerStats] = useState({ monthlyVisitors: 0, todayVisitors: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [customerStatsLoading, setCustomerStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardStats() {
      setStatsLoading(true);
      setCustomerStatsLoading(true);

      const [productResult, customerResult] = await Promise.allSettled([
        fetchProductStats(),
        fetchCustomerDashboardStats(),
      ]);

      if (!cancelled) {
        if (productResult.status === 'fulfilled') {
          setProductStats(productResult.value);
        } else {
          setProductStats({ total: 0, addedToday: 0 });
        }

        if (customerResult.status === 'fulfilled') {
          setCustomerStats(customerResult.value);
        } else {
          setCustomerStats({ monthlyVisitors: 0, todayVisitors: 0 });
        }

        setStatsLoading(false);
        setCustomerStatsLoading(false);
      }
    }

    loadDashboardStats();

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
          value={customerStatsLoading ? '...' : formatStatNumber(customerStats.monthlyVisitors)}
          footerLabel="Bugun saytda: "
          footerHighlight={
            customerStatsLoading ? '...' : formatStatNumber(customerStats.todayVisitors)
          }
          clickable
          onClick={() => navigate('/customers/statistics')}
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
