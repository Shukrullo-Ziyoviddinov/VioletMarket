import React, { useCallback, useEffect, useState } from 'react';
import { Spin } from 'antd';
import { fetchSellerSupportChatThreads } from '../../api/sellerSupportChatAdminApi';
import SellerSupportChatModal from '../../components/SellerSupportChatModal/SellerSupportChatModal';
import SellerSupportChatThreadsGrid from '../../components/SellerSupportChatThreadsGrid/SellerSupportChatThreadsGrid';
import { useAdminToast } from '../../context/AdminToastContext';
import {
  connectSellerSupportChatSocket,
  onSellerSupportChatThreadsUpdated,
} from '../../socket/sellerSupportChatSocketClient';
import './SillerChatsPage.css';

export default function SillerChatsPage() {
  const { showToast } = useAdminToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSeller, setActiveSeller] = useState(null);

  const loadThreads = useCallback(async () => {
    try {
      const nextThreads = await fetchSellerSupportChatThreads();
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
    connectSellerSupportChatSocket();
    const unsubscribe = onSellerSupportChatThreadsUpdated(() => {
      loadThreads();
    });

    return () => {
      unsubscribe();
    };
  }, [loadThreads]);

  return (
    <div className="siller-chats-page">
      {loading ? (
        <div className="siller-chats-page__loading">
          <Spin size="large" />
        </div>
      ) : (
        <SellerSupportChatThreadsGrid
          threads={threads}
          loading={loading}
          onOpenThread={setActiveSeller}
        />
      )}

      <SellerSupportChatModal
        open={Boolean(activeSeller)}
        seller={activeSeller}
        onClose={() => setActiveSeller(null)}
        onThreadsChanged={loadThreads}
      />
    </div>
  );
}
