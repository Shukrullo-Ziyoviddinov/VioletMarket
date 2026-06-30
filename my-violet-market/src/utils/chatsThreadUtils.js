export function getChatThreadPreferences() {
  try {
    const raw = localStorage.getItem('messageChatThreadPreferences');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChatThreadPreferences(next) {
  localStorage.setItem('messageChatThreadPreferences', JSON.stringify(next));
}

export function getThreadPreference(sellerId, preferences) {
  return preferences?.[String(sellerId)] || {};
}

export function getThreadActivityTime(thread) {
  return new Date(thread?.lastMessage?.createdAt || 0).getTime();
}

export function sortChatThreadsByPinAndActivity(threads, preferences) {
  return [...threads].sort((a, b) => {
    const prefA = getThreadPreference(a.sellerId, preferences);
    const prefB = getThreadPreference(b.sellerId, preferences);
    const pinnedA = Boolean(prefA.pinned);
    const pinnedB = Boolean(prefB.pinned);

    if (pinnedA !== pinnedB) {
      return pinnedA ? -1 : 1;
    }

    return getThreadActivityTime(b) - getThreadActivityTime(a);
  });
}

export function filterAndSortChatThreads(threads, filter, preferences) {
  const list = Array.isArray(threads) ? [...threads] : [];

  const filtered = list.filter((thread) => {
    const pref = getThreadPreference(thread.sellerId, preferences);
    const archived = Boolean(pref.archived);

    if (filter === 'archived') return archived;
    if (archived) return false;
    if (filter === 'unread') return Number(thread.unreadCount) > 0;
    if (filter === 'pinned') return Boolean(pref.pinned);
    return true;
  });

  return sortChatThreadsByPinAndActivity(filtered, preferences);
}

export function countUnreadChatThreads(threads, preferences) {
  return (Array.isArray(threads) ? threads : []).filter((thread) => {
    const pref = getThreadPreference(thread.sellerId, preferences);
    if (pref.archived) return false;
    return Number(thread.unreadCount) > 0;
  }).length;
}
