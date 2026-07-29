import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchLogisticaChatThreads } from '../../api/logisticaChatAdminApi';
import LogisticaChatModal from '../../components/LogisticaChatModal/LogisticaChatModal';
import LogisticaChatThreadsGrid from '../../components/LogisticaChatThreadsGrid/LogisticaChatThreadsGrid';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  connectLogisticaChatSocket,
  disconnectLogisticaChatSocket,
  onLogisticaChatThreadsUpdated,
} from '../../socket/logisticaChatSocketClient';
import './LogisticaChatsPage.css';

export default function LogisticaChatsPage() {
  const { showToast } = useAdminToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLogistica, setActiveLogistica] = useState(null);

  const loadThreads = useCallback(async () => {
    try {
      const nextThreads = await fetchLogisticaChatThreads();
      setThreads(nextThreads);
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Chatlar yuklanmadi',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setLoading(true);
    loadThreads();
    connectLogisticaChatSocket();
    const unsubscribe = onLogisticaChatThreadsUpdated(() => {
      loadThreads();
    });

    return () => {
      unsubscribe();
      disconnectLogisticaChatSocket();
    };
  }, [loadThreads]);

  return (
    <div className="logistica-chats-page">
      {loading ? (
        <div className="logistica-chats-page__loading">
          <Spin size="large" />
        </div>
      ) : (
        <LogisticaChatThreadsGrid
          threads={threads}
          loading={loading}
          onOpenThread={setActiveLogistica}
        />
      )}

      <LogisticaChatModal
        open={Boolean(activeLogistica)}
        logistica={activeLogistica}
        onClose={() => setActiveLogistica(null)}
        onThreadsChanged={loadThreads}
      />
    </div>
  );
}
