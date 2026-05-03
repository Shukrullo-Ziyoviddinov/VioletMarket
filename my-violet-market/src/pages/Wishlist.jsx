import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../contexts/WishlistContext';
import ProductCard from '../components/ProductCard';
import TavsiyaEtamiz from '../components/TavsiyaEtamiz';
import './Wishlist.css';

const Wishlist = () => {
  const { i18n } = useTranslation();
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="empty-wishlist">
          <img src="/img/wishlist1_preview_rev_1.png" alt="Empty wishlist" />
          <h2>{i18n.t('wishlist.emptyTitle')}</h2>
          <Link to="/">
            <button>{i18n.t('wishlist.emptyButton')}</button>
          </Link>
        </div>
        <div className="container">
          <TavsiyaEtamiz useScrollable={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="products-grid">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <TavsiyaEtamiz useScrollable={true} />
      </div>
    </div>
  );
};

export default Wishlist;

