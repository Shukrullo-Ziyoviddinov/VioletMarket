import { useCallback } from 'react';

import { ShipmentsListPanel } from '@/components/home/ShipmentsListPanel';
import { ScreenShell } from '@/components/ScreenShell';
import { fetchPendingShipments } from '@/services/logistica-shipments';

export default function AsosiyScreen() {
  const loadShipments = useCallback(
    (token: string) => fetchPendingShipments(token),
    [],
  );

  return (
    <ScreenShell title="Asosiy">
      <ShipmentsListPanel
        loadShipments={loadShipments}
        hrefBase="/shipment/[id]"
        emptyIcon="file-tray-full-outline"
        emptyTitle="Hozircha so‘rov yo‘q"
        emptyText="Xorij sillerlari cargoga yuborgan yuklar shu yerda chiqadi."
      />
    </ScreenShell>
  );
}
