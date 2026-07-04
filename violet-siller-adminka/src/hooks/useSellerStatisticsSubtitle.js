import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatSellerStatisticsScopeLabel } from '../utils/sellerStatisticsScopeLabel';

export function useSellerStatisticsSubtitle(period, pageFilters, statsNamespace) {
  const { t, i18n } = useTranslation();

  const displayPeriodLabel = t(`${statsNamespace}.periodLabel.${period}`);
  const scopeLabel = useMemo(
    () => formatSellerStatisticsScopeLabel(period, pageFilters, i18n.language),
    [period, pageFilters, i18n.language],
  );

  return { displayPeriodLabel, scopeLabel };
}
