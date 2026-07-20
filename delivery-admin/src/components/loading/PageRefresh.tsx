import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandLoader } from '@/components/loading/BrandLoader';

const BRAND = '#6d32c5';
const MIN_REFRESH_MS = 800;

type RefreshHandler = () => void | Promise<void>;

type PageRefreshContextValue = {
  setRefreshHandler: (handler: RefreshHandler | null) => void;
  triggerRefresh: () => Promise<void>;
};

const PageRefreshContext = createContext<PageRefreshContextValue | null>(null);

async function withMinDuration(task: () => void | Promise<void>, minMs: number) {
  const started = Date.now();
  try {
    await task();
  } finally {
    const left = minMs - (Date.now() - started);
    if (left > 0) {
      await new Promise((resolve) => setTimeout(resolve, left));
    }
  }
}

export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<RefreshHandler | null>(null);

  const setRefreshHandler = useCallback((handler: RefreshHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const triggerRefresh = useCallback(async () => {
    const fn = handlerRef.current;
    if (!fn) return;
    await fn();
  }, []);

  return (
    <PageRefreshContext.Provider value={{ setRefreshHandler, triggerRefresh }}>
      {children}
    </PageRefreshContext.Provider>
  );
}

/** Faqat fokusdagi sahifa navbar refresh oladi */
export function usePageRefresh(handler: RefreshHandler, enabled = true) {
  const ctx = useContext(PageRefreshContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useFocusEffect(
    useCallback(() => {
      if (!ctx || !enabled) return;
      ctx.setRefreshHandler(() => handlerRef.current());
      return () => ctx.setRefreshHandler(null);
    }, [ctx, enabled]),
  );
}

export function usePageRefreshTrigger() {
  const ctx = useContext(PageRefreshContext);
  return ctx?.triggerRefresh ?? (async () => undefined);
}

export { BrandLoader };

export function useRefreshState(load: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const busyRef = useRef(false);
  const loadRef = useRef(load);
  loadRef.current = load;

  const onRefresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRefreshing(true);
    try {
      await withMinDuration(() => loadRef.current(), MIN_REFRESH_MS);
    } finally {
      setRefreshing(false);
      busyRef.current = false;
    }
  }, []);

  return { refreshing, onRefresh };
}

type PullRefreshFlatListProps<T> = Omit<
  FlatListProps<T>,
  'refreshControl'
> & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  loading?: boolean;
  listStyle?: StyleProp<ViewStyle>;
};

/**
 * Native pull-to-refresh — ishonchli ishlaydi.
 * Navbar bosilganda ham shu loader chiqadi.
 */
export function PullRefreshFlatList<T>({
  refreshing,
  onRefresh,
  loading = false,
  listStyle,
  ...flatListProps
}: PullRefreshFlatListProps<T>) {
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <BrandLoader fullScreen />
      </View>
    );
  }

  return (
    <View style={[styles.listWrap, listStyle]}>
      <FlatList
        {...flatListProps}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor={BRAND}
            colors={[BRAND]}
            progressBackgroundColor="#FFFFFF"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    flex: 1,
  },
});
