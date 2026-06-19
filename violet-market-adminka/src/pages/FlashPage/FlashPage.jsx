import React from 'react';
import FlashCategoryManager from '../../components/FlashCategoryManager/FlashCategoryManager';
import './FlashPage.css';

export default function FlashPage() {
  return (
    <section className="flash-page">
      <header className="flash-page__header">
        <h1 className="flash-page__title">Katta chegirma mahsulotlari</h1>
        <p className="flash-page__subtitle">
          Mahsulotlarni asosiy bo‘limda qoldirib, katta chegirma bo‘limiga biriktiring.
        </p>
      </header>

      <FlashCategoryManager />
    </section>
  );
}
