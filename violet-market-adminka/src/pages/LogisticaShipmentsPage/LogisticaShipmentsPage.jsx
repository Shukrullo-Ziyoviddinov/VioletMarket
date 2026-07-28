import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  fetchAdminCargoShipmentCountries,
  fetchAdminCargoShipments,
} from '../../api/adminCargoShipmentsApi';
import LogisticaShipmentsCountryFilter from '../../components/LogisticaShipments/LogisticaShipmentsCountryFilter/LogisticaShipmentsCountryFilter';
import LogisticaShipmentsGrid from '../../components/LogisticaShipments/LogisticaShipmentsGrid/LogisticaShipmentsGrid';
import LogisticaShipmentDetailModal from '../../components/LogisticaShipments/LogisticaShipmentDetailModal/LogisticaShipmentDetailModal';
import './LogisticaShipmentsPage.css';

export default function LogisticaShipmentsPage() {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const loadCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const rows = await fetchAdminCargoShipmentCountries();
      setCountries(rows);
      setCountry((prev) => {
        if (prev && rows.some((row) => row.code === prev)) return prev;
        return rows[0]?.code || '';
      });
    } catch (error) {
      setCountries([]);
      message.error(error?.message || 'Davlatlarni yuklab bo‘lmadi');
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  const loadShipments = useCallback(async (sellerCountry) => {
    if (!sellerCountry) {
      setShipments([]);
      return;
    }
    setLoadingList(true);
    try {
      const data = await fetchAdminCargoShipments({
        sellerCountry,
        page: 1,
        limit: 100,
      });
      setShipments(data.shipments);
    } catch (error) {
      setShipments([]);
      message.error(error?.message || 'Yuklarni yuklab bo‘lmadi');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    loadShipments(country);
  }, [country, loadShipments]);

  const handleUpdated = async () => {
    await Promise.all([loadCountries(), loadShipments(country)]);
  };

  return (
    <section className="logistica-shipments-page">
      <div className="logistica-shipments-page__header">
        <h1 className="logistica-shipments-page__title">Logistica</h1>
        <p className="logistica-shipments-page__subtitle">
          Qabul qilingan cargo yuklari — davlat bo‘yicha filter, jarayon holati va
          kerak bo‘lsa holatni o‘zgartirish (logistica ilovasi bilan sinxron).
        </p>
      </div>

      <LogisticaShipmentsCountryFilter
        countries={countries}
        value={country}
        onChange={setCountry}
      />

      <LogisticaShipmentsGrid
        shipments={shipments}
        loading={loadingCountries || loadingList}
        onOpen={(row) => setActiveId(row.id)}
      />

      <LogisticaShipmentDetailModal
        open={Boolean(activeId)}
        shipmentId={activeId}
        onClose={() => setActiveId(null)}
        onUpdated={handleUpdated}
      />
    </section>
  );
}
