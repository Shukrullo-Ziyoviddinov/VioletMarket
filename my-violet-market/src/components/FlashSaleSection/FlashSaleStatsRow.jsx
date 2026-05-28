import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Scrollable from '../Scrollable';
import { apiUrl } from '../../config/api';

const FlashSaleStatsRow = ({ flashCount }) => {
  const { i18n } = useTranslation();
  const [watchingCount, setWatchingCount] = useState(342);
  const hasFlashProducts = Number(flashCount) > 0;

  useEffect(() => {
    if (!hasFlashProducts) return undefined;

    let cancelled = false;
    let timerId = null;

    const scheduleNext = (delayMs) => {
      timerId = window.setTimeout(loadOnce, Math.max(500, Number(delayMs) || 1000));
    };

    const loadOnce = async () => {
      try {
        const res = await fetch(apiUrl('/api/flash-sale/live-stats'));
        if (!res.ok) throw new Error('live-stats fetch failed');
        const payload = await res.json();
        if (cancelled) return;
        const count = Number(payload?.data?.viewersNow);
        if (Number.isFinite(count)) {
          setWatchingCount(Math.max(0, Math.floor(count)));
        }
        scheduleNext(payload?.data?.updateEveryMs);
      } catch {
        if (!cancelled) scheduleNext(1500);
      }
    };

    loadOnce();

    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [hasFlashProducts]);

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
    ...(hasFlashProducts
      ? [
          {
            icon: 'bx bx-show-alt',
            content: (
              <span>
                {i18n.t('home.flashSaleWatching', { count: watchingCount })}
              </span>
            ),
          },
        ]
      : []),
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
