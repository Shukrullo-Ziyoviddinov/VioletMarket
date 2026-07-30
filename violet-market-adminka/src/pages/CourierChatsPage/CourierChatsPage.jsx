import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchCourierChatThreads } from '../../api/courierChatAdminApi';
import CourierChatModal from '../../components/CourierChatModal/CourierChatModal';
import CourierChatThreadsGrid from '../../components/CourierChatThreadsGrid/CourierChatThreadsGrid';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  connectCourierChatSocket,
  onCourierChatThreadsUpdated,
} from '../../socket/courierChatSocketClient';
import './CourierChatsPage.css';

export default function CourierChatsPage() {
  const { showToast } = useAdminToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourier, setActiveCourier] = useState(null);

  const loadThreads = useCallback(async () => {
    try {
      const nextThreads = await fetchCourierChatThreads();
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
    connectCourierChatSocket();
    const unsubscribe = onCourierChatThreadsUpdated(() => {
      loadThreads();
    });

    return () => {
      unsubscribe();
    };
  }, [loadThreads]);

  return (
    <div className="courier-chats-page">
      {loading ? (
        <div className="courier-chats-page__loading">
          <Spin size="large" />
        </div>
      ) : (
        <CourierChatThreadsGrid
          threads={threads}
          loading={loading}
          onOpenThread={setActiveCourier}
        />
      )}

      <CourierChatModal
        open={Boolean(activeCourier)}
        courier={activeCourier}
        onClose={() => setActiveCourier(null)}
        onThreadsChanged={loadThreads}
      />
    </div>
  );
}
