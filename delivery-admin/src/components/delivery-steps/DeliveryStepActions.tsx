import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  canShowReturnActions,
  getPrimaryAction,
  type DeliveryAdvanceAction,
  type DeliveryPrimaryActionKind,
} from '@/utils/deliveryOrderSteps';
import type { DeliveryAcceptedOrder } from '@/types/delivery-order';

type DeliveryStepActionsProps = {
  order: DeliveryAcceptedOrder;
  loading?: boolean;
  /** compact = card ichida bitta asosiy tugma; footer = yonma-yon */
  layout?: 'card' | 'footer';
  showReturn?: boolean;
  onAdvance?: (action: DeliveryAdvanceAction) => void;
  onPickUp?: () => void;
  onDeliver?: () => void;
  onReturn?: () => void;
  onConfirmReturnReason?: () => void;
  onCompleteReturn?: () => void;
};

function actionIcon(kind: DeliveryPrimaryActionKind): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case 'go_to_seller':
    case 'go_to_customer':
    case 'go_return_to_seller':
      return 'navigate-outline';
    case 'arrive_seller':
    case 'arrive_customer':
    case 'arrive_return_seller':
      return 'location-outline';
    case 'pick_up':
      return 'checkmark-circle-outline';
    case 'deliver':
    case 'complete_return':
      return 'cube-outline';
    case 'waiting_admin':
      return 'time-outline';
    case 'confirm_return_reason':
      return 'return-down-back-outline';
    default:
      return 'ellipse-outline';
  }
}

export function DeliveryStepActions({
  order,
  loading = false,
  layout = 'card',
  showReturn = true,
  onAdvance,
  onPickUp,
  onDeliver,
  onReturn,
  onConfirmReturnReason,
  onCompleteReturn,
}: DeliveryStepActionsProps) {
  const primary = getPrimaryAction(order);
  const showAjdaniya =
    showReturn &&
    canShowReturnActions(order) &&
    primary.kind === 'deliver';

  if (primary.kind === 'none') return null;

  const handlePrimary = () => {
    if (loading) return;
    if (primary.kind === 'waiting_admin') return;
    if (
      primary.kind === 'go_to_seller' ||
      primary.kind === 'arrive_seller' ||
      primary.kind === 'go_to_customer' ||
      primary.kind === 'arrive_customer' ||
      primary.kind === 'go_return_to_seller' ||
      primary.kind === 'arrive_return_seller'
    ) {
      onAdvance?.(primary.kind);
      return;
    }
    if (primary.kind === 'pick_up') {
      onPickUp?.();
      return;
    }
    if (primary.kind === 'deliver') {
      onDeliver?.();
      return;
    }
    if (primary.kind === 'confirm_return_reason') {
      onConfirmReturnReason?.();
      return;
    }
    if (primary.kind === 'complete_return') {
      onCompleteReturn?.();
    }
  };

  const isWaiting = primary.kind === 'waiting_admin';
  const isGreen =
    primary.kind === 'deliver' ||
    primary.kind === 'pick_up' ||
    primary.kind === 'complete_return';

  if (layout === 'footer') {
    return (
      <View style={styles.footerRow}>
        {showAjdaniya ? (
          <Pressable
            style={({ pressed }) => [
              styles.footerBtn,
              styles.ajdaniyaBtn,
              pressed && styles.pressed,
            ]}
            onPress={onReturn}>
            <Text style={styles.ajdaniyaText}>Ajdaniya</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={loading || isWaiting}
          style={({ pressed }) => [
            styles.footerBtn,
            styles.primaryFooterBtn,
            isWaiting ? styles.waitingBtn : isGreen ? styles.primaryGreen : styles.primaryPurple,
            pressed && !isWaiting && styles.pressed,
            (loading || isWaiting) && styles.disabled,
            showAjdaniya ? styles.footerBtnFlex : styles.footerBtnFull,
          ]}
          onPress={handlePrimary}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.primaryFooterText,
                isWaiting && styles.waitingText,
              ]}>
              {primary.label}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cardWrap}>
      {showAjdaniya ? (
        <Pressable
          style={({ pressed }) => [
            styles.ajdaniyaCardBtn,
            pressed && styles.pressed,
          ]}
          onPress={onReturn}>
          <Text style={styles.ajdaniyaText}>Ajdaniya</Text>
        </Pressable>
      ) : null}
      <Pressable
        disabled={loading || isWaiting}
        style={({ pressed }) => [
          styles.primaryCardBtn,
          isWaiting ? styles.waitingBtn : isGreen ? styles.primaryGreen : styles.primaryPurple,
          pressed && !isWaiting && styles.pressed,
          (loading || isWaiting) && styles.disabled,
        ]}
        onPress={handlePrimary}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name={actionIcon(primary.kind)}
              size={18}
              color={isWaiting ? '#92400E' : '#FFFFFF'}
            />
            <Text
              style={[
                styles.primaryCardText,
                isWaiting && styles.waitingText,
              ]}>
              {primary.label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    gap: 10,
  },
  primaryCardBtn: {
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryCardText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  ajdaniyaCardBtn: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  footerBtn: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  footerBtnFlex: {
    flex: 1.2,
  },
  footerBtnFull: {
    flex: 1,
  },
  primaryFooterBtn: {
    flexDirection: 'row',
  },
  primaryFooterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  ajdaniyaBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  ajdaniyaText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryPurple: {
    backgroundColor: '#6d32c5',
  },
  primaryGreen: {
    backgroundColor: '#15803D',
  },
  waitingBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  waitingText: {
    color: '#92400E',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
});
