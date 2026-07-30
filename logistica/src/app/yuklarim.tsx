import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { fetchAcceptedShipments } from '@/services/logistica-shipments';

export default function YuklarimScreen() {
  const { t } = useTranslation();
  const loadShipments = useCallback(
    (token: string) => fetchAcceptedShipments(token),
    [],
  );

  return (
    <ScreenShell title={t('navigation.shipments')}>
      <ShipmentsListPanel
        loadShipments={loadShipments}
        hrefBase="/ish-stoli/[id]"
        emptyIcon="cube-outline"
        emptyTitle={t('shipments.empty.acceptedTitle')}
        emptyText={t('shipments.empty.acceptedText')}
      />
    </ScreenShell>
  );
}
