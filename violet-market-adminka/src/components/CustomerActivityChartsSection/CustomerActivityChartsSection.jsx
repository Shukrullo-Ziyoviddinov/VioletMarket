import React from 'react';
import CustomerActivityChart from '../CustomerActivityChart/CustomerActivityChart';
import { CUSTOMER_UNREGISTERED_ACTIVITY_MOCK_DATA } from '../CustomerActivityChart/customerActivityMock';
import './CustomerActivityChartsSection.css';

export default function CustomerActivityChartsSection() {
  return (
    <div className="customer-activity-charts-section">
      <CustomerActivityChart
        chartId="registered"
        title="Ro'yxatdan o'tgan mijozlar faolligi"
      />
      <CustomerActivityChart
        chartId="unregistered"
        title="Ro'yxatdan o'tmagan mijozlar statistikasi"
        data={CUSTOMER_UNREGISTERED_ACTIVITY_MOCK_DATA}
      />
    </div>
  );
}
