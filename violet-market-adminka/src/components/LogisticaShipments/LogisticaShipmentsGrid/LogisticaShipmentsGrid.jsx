import React from 'react';
import { Empty, Spin } from 'antd';
import LogisticaShipmentCard from '../LogisticaShipmentCard/LogisticaShipmentCard';
import './LogisticaShipmentsGrid.css';

export default function LogisticaShipmentsGrid({
  shipments = [],
  loading = false,
  onOpen,
}) {
  if (loading) {
    return (
      <div className="logistica-shipments-grid__state">
        <Spin />
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <div className="logistica-shipments-grid__state">
        <Empty description="Bu davlat bo‘yicha yuklar yo‘q" />
      </div>
    );
  }

  return (
    <div className="logistica-shipments-grid">
      {shipments.map((shipment) => (
        <LogisticaShipmentCard
          key={shipment.id}
          shipment={shipment}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
