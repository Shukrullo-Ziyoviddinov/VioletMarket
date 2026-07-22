import React from 'react';
import { Empty, Spin } from 'antd';
import ReturnRequestCard from '../ReturnRequestCard/ReturnRequestCard';
import './ReturnRequestsList.css';

export default function ReturnRequestsList({
  items,
  loading,
  onApprove,
  onReject,
}) {
  if (loading && (!items || items.length === 0)) {
    return (
      <div className="return-requests-list__loading">
        <Spin />
      </div>
    );
  }

  if (!items?.length) {
    return <Empty description="So‘rovlar yo‘q" />;
  }

  return (
    <div className="return-requests-list">
      {items.map((item) => (
        <ReturnRequestCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
