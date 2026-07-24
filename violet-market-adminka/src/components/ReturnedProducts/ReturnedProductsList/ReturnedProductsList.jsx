import React from 'react';
import ReturnedProductsCard from '../ReturnedProductsCard/ReturnedProductsCard';
import './ReturnedProductsList.css';

export default function ReturnedProductsList({ orders = [], loading = false }) {
  if (loading) {
    return (
      <div className="returned-products-list returned-products-list--empty">
        Yuklanmoqda...
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="returned-products-list returned-products-list--empty">
        Qaytarilgan mahsulotlar yo‘q
      </div>
    );
  }

  return (
    <div className="returned-products-list">
      {orders.map((order) => (
        <ReturnedProductsCard key={order.id} order={order} />
      ))}
    </div>
  );
}
