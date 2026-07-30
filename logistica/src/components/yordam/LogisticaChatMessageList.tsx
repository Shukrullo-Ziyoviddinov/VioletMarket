import type { RefObject } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { resolveMediaUrl } from '@/config/env';
import { localeForLanguage } from '@/i18n';
import type { LogisticaChatMessage } from '@/types/logistica-chat';

type LogisticaChatMessageListProps = {
  messages: LogisticaChatMessage[];
  listRef?: RefObject<ScrollView | null>;
};

export function LogisticaChatMessageList({
  messages,
  listRef,
}: LogisticaChatMessageListProps) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.language);

  const formatTime = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!messages.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t('help.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('help.emptyText')}</Text>
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
      }}
    >
      {messages.map((message) => {
        const mine = message.sender === 'logistica';
        return (
          <View
            key={message.id}
            style={[styles.bubbleRow, mine ? styles.mineRow : styles.adminRow]}
          >
            <View
              style={[
                styles.bubble,
                mine ? styles.mineBubble : styles.adminBubble,
              ]}
            >
              {message.type === 'image' ? (
                <Image
                  source={{ uri: resolveMediaUrl(message.content) }}
                  style={styles.image}
                />
              ) : (
                <Text
                  style={[
                    styles.text,
                    mine ? styles.mineText : styles.adminText,
                  ]}
                >
                  {message.content}
                </Text>
              )}
              <View style={[styles.meta, mine && styles.mineMeta]}>
                <Text
                  style={[
                    styles.time,
                    mine ? styles.mineTime : styles.adminTime,
                  ]}
                >
                  {formatTime(message.createdAt)}
                </Text>
                {mine ? (
                  <Text
                    style={[
                      styles.readMark,
                      message.readByAdmin && styles.readMarkDone,
                    ]}
                  >
                    {message.readByAdmin ? '✓✓' : '✓'}
                  </Text>
                ) : null}
              </View>
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
    backgroundColor: '#6d32c5',
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
    fontSize: 11,
  },
  meta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  mineMeta: {
    justifyContent: 'flex-end',
  },
  mineTime: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right',
  },
  adminTime: {
    color: '#9CA3AF',
  },
  readMark: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -2,
  },
  readMarkDone: {
    color: '#BFDBFE',
  },
});
