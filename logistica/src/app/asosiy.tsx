import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { fetchPendingShipments } from '@/services/logistica-shipments';

export default function AsosiyScreen() {
  const { t } = useTranslation();
  const loadShipments = useCallback(
    (token: string) => fetchPendingShipments(token),
    [],
  );

  return (
    <ScreenShell title={t('navigation.home')}>
      <ShipmentsListPanel
        loadShipments={loadShipments}
        hrefBase="/shipment/[id]"
        emptyIcon="file-tray-full-outline"
        emptyTitle={t('shipments.empty.pendingTitle')}
        emptyText={t('shipments.empty.pendingText')}
      />
    </ScreenShell>
  );
}
