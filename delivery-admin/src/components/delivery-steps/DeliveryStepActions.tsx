import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SwipeConfirmButton } from '@/components/SwipeConfirmButton';
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
  onStartReturnToSeller?: () => void;
  onCompleteReturn?: () => void;
};

function primaryColors(kind: DeliveryPrimaryActionKind): {
  color: string;
  trackColor: string;
} {
  if (kind === 'deliver') {
    return { color: '#15803D', trackColor: '#C6E6D0' };
  }
  if (kind === 'complete_return') {
    return { color: '#DC2626', trackColor: '#F5C4C4' };
  }
  return { color: '#6d32c5', trackColor: '#D9CCEF' };
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
  onStartReturnToSeller,
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
    if (primary.kind === 'start_return_to_seller') {
      onStartReturnToSeller?.();
      return;
    }
    if (primary.kind === 'complete_return') {
      onCompleteReturn?.();
    }
  };

  const isWaiting = primary.kind === 'waiting_admin';
  const useClassicPress =
    primary.kind === 'pick_up' ||
    primary.kind === 'deliver' ||
    primary.kind === 'complete_return';
  const colors = primaryColors(primary.kind);

  const classicPrimaryBtn = (
    <Pressable
      disabled={loading || isWaiting}
      style={({ pressed }) => [
        layout === 'footer' ? styles.footerBtn : styles.primaryCardBtn,
        isWaiting
          ? styles.waitingBtn
          : primary.kind === 'complete_return'
            ? styles.returnStartBtn
            : useClassicPress
              ? styles.primaryGreen
              : styles.primaryPurple,
        pressed && !isWaiting && styles.pressed,
        (loading || isWaiting) && styles.disabled,
        layout === 'footer'
          ? showAjdaniya
            ? styles.footerBtnFlex
            : styles.footerBtnFull
          : null,
      ]}
      onPress={handlePrimary}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {layout === 'card' && !isWaiting ? (
            <Ionicons
              name={
                primary.kind === 'deliver' || primary.kind === 'complete_return'
                  ? 'cube-outline'
                  : 'checkmark-circle-outline'
              }
              size={18}
              color="#FFFFFF"
            />
          ) : null}
          <Text
            style={[
              layout === 'footer'
                ? styles.primaryFooterText
                : styles.primaryCardText,
              isWaiting && styles.waitingText,
            ]}>
            {primary.label}
          </Text>
        </>
      )}
    </Pressable>
  );

  const primaryControl = isWaiting ? (
    layout === 'footer' ? (
      <View
        style={[
          styles.footerBtn,
          styles.waitingBtn,
          showAjdaniya ? styles.footerBtnFlex : styles.footerBtnFull,
        ]}>
        <Text style={styles.waitingText}>{primary.label}</Text>
      </View>
    ) : (
      <View style={[styles.waitingCardBtn, styles.waitingBtn]}>
        <Text style={styles.waitingText}>{primary.label}</Text>
      </View>
    )
  ) : useClassicPress ? (
    classicPrimaryBtn
  ) : (
    <SwipeConfirmButton
      label={primary.label}
      onConfirm={handlePrimary}
      loading={loading}
      color={colors.color}
      trackColor={colors.trackColor}
      height={layout === 'footer' ? 48 : 52}
      style={
        layout === 'footer'
          ? showAjdaniya
            ? styles.footerSwipeFlex
            : styles.footerSwipeFull
          : undefined
      }
    />
  );

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
        {primaryControl}
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
      {primaryControl}
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
  waitingCardBtn: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  footerBtn: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  footerBtnFlex: {
    flex: 1.2,
  },
  footerBtnFull: {
    flex: 1,
  },
  footerSwipeFlex: {
    flex: 1.2,
  },
  footerSwipeFull: {
    flex: 1,
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
  primaryGreen: {
    backgroundColor: '#15803D',
  },
  primaryPurple: {
    backgroundColor: '#6d32c5',
  },
  returnStartBtn: {
    backgroundColor: '#DC2626',
  },
  waitingBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  waitingText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.7,
  },
});
