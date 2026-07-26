import { type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavbar } from '@/components/BottomNavbar';

const ACCENT = '#7c3aed';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={64} color="#C4B5FD" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

type ScreenShellProps = {
  title: string;
  children?: ReactNode;
  empty?: EmptyStateProps;
};

export function ScreenShell({ title, children, empty }: ScreenShellProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerBodyHeight = height * 0.05;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: insets.top + headerBodyHeight,
          },
        ]}
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.content}>
        {empty ? <EmptyState {...empty} /> : children}
      </View>

      <BottomNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: ACCENT,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});
