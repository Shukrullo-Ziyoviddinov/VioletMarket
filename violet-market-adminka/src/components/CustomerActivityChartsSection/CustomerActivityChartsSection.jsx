import React from 'react';
import CustomerActivityChart from '../CustomerActivityChart/CustomerActivityChart';
import './CustomerActivityChartsSection.css';

export default function CustomerActivityChartsSection({ registeredData = [], unregisteredData = [] }) {
  return (
    <div className="customer-activity-charts-section">
      <CustomerActivityChart
        chartId="registered"
        title="Ro'yxatdan o'tgan mijozlar faolligi"
        data={registeredData}
      />
      <CustomerActivityChart
        chartId="unregistered"
        title="Ro'yxatdan o'tmagan mijozlar statistikasi"
        data={unregisteredData}
      />
    </div>
  );
}
