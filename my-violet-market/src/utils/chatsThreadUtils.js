export function buildPreferencesMapFromThreads(threads) {
  const map = {};
  (Array.isArray(threads) ? threads : []).forEach((thread) => {
    map[String(thread.sellerId)] = {
      pinned: Boolean(thread.pinned),
      pinnedAt: thread.pinnedAt || null,
      archived: Boolean(thread.archived),
      archivedAt: thread.archivedAt || null,
      muted: Boolean(thread.muted),
    };
  });
  return map;
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
