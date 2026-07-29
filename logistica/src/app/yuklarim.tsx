import { useCallback } from 'react';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { fetchAcceptedShipments } from '@/services/logistica-shipments';

export default function YuklarimScreen() {
  const loadShipments = useCallback(
    (token: string) => fetchAcceptedShipments(token),
    [],
  );

  return (
    <ScreenShell title="Yuklarim">
      <ShipmentsListPanel
        loadShipments={loadShipments}
        hrefBase="/ish-stoli/[id]"
        emptyIcon="cube-outline"
        emptyTitle="Qabul qilingan yuk yo‘q"
        emptyText="Asosiydan qabul qilingan so‘rovlar shu yerda chiqadi."
      />
    </ScreenShell>
  );
}
