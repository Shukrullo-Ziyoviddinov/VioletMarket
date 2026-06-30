import { getMessagePreviewText } from './messageChatReplyUtils';

export function filterChatThreadsByQuery(threads, query, getSellerName) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return [];

  return (Array.isArray(threads) ? threads : []).filter((thread) => {
    const sellerName = String(getSellerName(thread) || '').toLowerCase();
    const preview = getMessagePreviewText(thread.lastMessage).toLowerCase();
    return sellerName.includes(normalizedQuery) || preview.includes(normalizedQuery);
  });
}
