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
import { fetchSalesDashboardStats } from '../../api/salesStatisticsAdminApi';
import { useGlobalLoaderOnInitialLoad } from '../../hooks/useGlobalLoaderOnInitialLoad';
import { formatRevenue, formatStatNumber, formatTodayHighlight } from '../../utils/productDisplay';
import AdminStatCard from '../AdminStatCard/AdminStatCard';
import './AdminDashboardOverview.css';

function getSalesGrowthFooterLabel(tone) {
  if (tone === 'positive') return "Oylik o'sish: ";
  if (tone === 'negative') return 'Oylik pasayish: ';
  return 'Oylik tekis: ';
}

export default function AdminDashboardOverview() {
  const navigate = useNavigate();
  const [productStats, setProductStats] = useState({ total: 0, addedToday: 0 });
  const [customerStats, setCustomerStats] = useState({ monthlyVisitors: 0, todayVisitors: 0 });
  const [salesStats, setSalesStats] = useState({
    monthlyRevenue: 0,
    monthlyGrowthFormatted: '0%',
    monthlyGrowthTone: 'neutral',
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [customerStatsLoading, setCustomerStatsLoading] = useState(true);
  const [salesStatsLoading, setSalesStatsLoading] = useState(true);

  useGlobalLoaderOnInitialLoad(statsLoading || customerStatsLoading || salesStatsLoading);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardStats() {
      setStatsLoading(true);
      setCustomerStatsLoading(true);
      setSalesStatsLoading(true);

      const [productResult, customerResult, salesResult] = await Promise.allSettled([
        fetchProductStats(),
        fetchCustomerDashboardStats(),
        fetchSalesDashboardStats(),
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

        if (salesResult.status === 'fulfilled') {
          setSalesStats(salesResult.value);
        } else {
          setSalesStats({
            monthlyRevenue: 0,
            monthlyGrowthFormatted: '0%',
            monthlyGrowthTone: 'neutral',
          });
        }

        setStatsLoading(false);
        setCustomerStatsLoading(false);
        setSalesStatsLoading(false);
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
          value={salesStatsLoading ? '...' : formatRevenue(salesStats.monthlyRevenue)}
          badgeText="shu oy"
          footerLabel={
            salesStatsLoading ? "Oylik o'sish: " : getSalesGrowthFooterLabel(salesStats.monthlyGrowthTone)
          }
          footerHighlight={salesStatsLoading ? '...' : salesStats.monthlyGrowthFormatted}
          footerHighlightTone={salesStats.monthlyGrowthTone}
          showChart
          clickable
          onClick={() => navigate('/sales/statistics')}
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
