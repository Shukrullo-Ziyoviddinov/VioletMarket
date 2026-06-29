import { useEffect } from 'react';

/** Chat ro'yxati balandligi o'zgarganda (o'chirish animatsiyasi) scroll sakrashini oldini oladi. */
export function useMessageChatListScrollLock(listRef, isLocked) {
  useEffect(() => {
    if (!isLocked || !listRef.current) return undefined;

    const list = listRef.current;
    const pinnedScrollTop = list.scrollTop;

    const pinScroll = () => {
      if (list.scrollTop !== pinnedScrollTop) {
        list.scrollTop = pinnedScrollTop;
      }
    };

    const resizeObserver = new ResizeObserver(pinScroll);
    resizeObserver.observe(list);
    list.addEventListener('scroll', pinScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      list.removeEventListener('scroll', pinScroll);
    };
  }, [isLocked, listRef]);
}
