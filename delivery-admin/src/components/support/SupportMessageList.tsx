import type { RefObject } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveMediaUrl } from '@/config/env';
import type { SupportChatMessage } from '@/types/support-chat';

type SupportMessageListProps = {
  messages: SupportChatMessage[];
  listRef?: RefObject<ScrollView | null>;
};

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportMessageList({
  messages,
  listRef,
}: SupportMessageListProps) {
  if (!messages.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Yordam xizmati</Text>
        <Text style={styles.emptyText}>
          Savolingizni yozing — admin tez orada javob beradi.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={listRef}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => {
        listRef?.current?.scrollToEnd({ animated: true });
      }}>
      {messages.map((message) => {
        const mine = message.sender === 'courier';
        return (
          <View
            key={message.id}
            style={[styles.bubbleRow, mine ? styles.mineRow : styles.adminRow]}>
            <View
              style={[styles.bubble, mine ? styles.mineBubble : styles.adminBubble]}>
              {message.type === 'image' ? (
                <Image
                  source={{ uri: resolveMediaUrl(message.content) }}
                  style={styles.image}
                />
              ) : (
                <Text
                  style={[styles.text, mine ? styles.mineText : styles.adminText]}>
                  {message.content}
                </Text>
              )}
              <Text
                style={[styles.time, mine ? styles.mineTime : styles.adminTime]}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
  },
  bubbleRow: {
    width: '100%',
  },
  mineRow: {
    alignItems: 'flex-end',
  },
  adminRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mineBubble: {
    backgroundColor: '#6D28D9',
    borderBottomRightRadius: 6,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  mineText: {
    color: '#FFFFFF',
  },
  adminText: {
    color: '#111827',
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  time: {
    marginTop: 6,
    fontSize: 11,
  },
  mineTime: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  adminTime: {
    color: '#9CA3AF',
  },
});
