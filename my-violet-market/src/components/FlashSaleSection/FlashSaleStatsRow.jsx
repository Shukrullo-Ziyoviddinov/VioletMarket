import React from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';

const FlashSaleStatsRow = ({ flashCount }) => {
  const { i18n } = useTranslation();
  const items = [
    {
      icon: 'bx bx-bolt-circle',
      content: (
        <span>
          {i18n.t('home.flashSaleStatsLeft')}{' '}
          <strong>{i18n.t('home.flashSaleProductCount', { count: flashCount })}</strong>
        </span>
      ),
    },
    {
      icon: 'bx bx-show-alt',
      content: <span>{i18n.t('home.flashSaleWatching')}</span>,
    },
    {
      icon: 'bx bxs-crown',
      content: <span>{i18n.t('home.flashSaleTopSelling')}</span>,
    },
  ];

  return (
    <Scrollable type="product" className="flash-sale-stats-scrollable">
      {items.map((item, index) => (
        <div key={`flash-sale-stat-${index}`} className="flash-sale-stats-row__item">
          <i className={item.icon} />
          {item.content}
        </div>
      ))}
    </Scrollable>
  );
};

export default FlashSaleStatsRow;
