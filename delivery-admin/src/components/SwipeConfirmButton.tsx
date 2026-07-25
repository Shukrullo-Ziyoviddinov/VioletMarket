import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const THUMB_SIZE = 44;
const TRACK_PAD = 4;
const CONFIRM_RATIO = 0.82;

export type SwipeConfirmButtonProps = {
  label: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Surilganda / thumb fon (asosiy rang) */
  color?: string;
  /** Hali surilmagan track fon */
  trackColor?: string;
  /** Tasdiqlanganda matn */
  textColor?: string;
  /** Tasdiqlanmagan matn (qoramtir och) */
  idleTextColor?: string;
  thumbIconColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function SwipeConfirmButton({
  label,
  onConfirm,
  loading = false,
  disabled = false,
  color = '#6d32c5',
  trackColor,
  textColor = '#FFFFFF',
  idleTextColor = '#4B5563',
  thumbIconColor = '#FFFFFF',
  height = 52,
  style,
}: SwipeConfirmButtonProps) {
  const trackBg = trackColor || softenColor(color);
  const translateX = useSharedValue(0);
  const maxX = useSharedValue(0);
  const confirmed = useSharedValue(false);
  const locked = useSharedValue(disabled || loading);

  useEffect(() => {
    locked.value = disabled || loading;
  }, [disabled, loading, locked]);

  useEffect(() => {
    if (loading) {
      translateX.value = withTiming(maxX.value, { duration: 160 });
      return;
    }
    if (!disabled) {
      confirmed.value = false;
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    }
  }, [loading, disabled, translateX, maxX, confirmed]);

  const handleConfirm = () => {
    if (disabled || loading) return;
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && !loading)
    .activeOffsetX(8)
    .failOffsetY([-18, 18])
    .onBegin(() => {
      if (locked.value || confirmed.value) return;
    })
    .onUpdate((event) => {
      if (locked.value || confirmed.value || maxX.value <= 0) return;
      const next = Math.min(Math.max(0, event.translationX), maxX.value);
      translateX.value = next;
    })
    .onEnd(() => {
      if (locked.value || confirmed.value || maxX.value <= 0) return;
      if (translateX.value >= maxX.value * CONFIRM_RATIO) {
        confirmed.value = true;
        translateX.value = withTiming(maxX.value, { duration: 140 }, (finished) => {
          if (finished) runOnJS(handleConfirm)();
        });
        return;
      }
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE + TRACK_PAD,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    const progress =
      maxX.value > 0
        ? interpolate(
            translateX.value,
            [0, maxX.value],
            [0, 1],
            Extrapolation.CLAMP,
          )
        : 0;
    return {
      color: interpolateColor(
        progress,
        [0, 0.35, 0.75, 1],
        [idleTextColor, idleTextColor, textColor, textColor],
      ),
    };
  });

  return (
    <View
      style={[
        styles.wrap,
        {
          height,
          backgroundColor: trackBg,
          opacity: disabled ? 0.65 : 1,
        },
        style,
      ]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        maxX.value = Math.max(0, width - THUMB_SIZE - TRACK_PAD * 2);
      }}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color }, fillStyle]}
      />

      <View style={styles.labelWrap} pointerEvents="none">
        <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: color,
              height: THUMB_SIZE,
              width: THUMB_SIZE,
              top: Math.max(TRACK_PAD, (height - THUMB_SIZE) / 2),
            },
            thumbStyle,
          ]}>
          {loading ? (
            <ActivityIndicator color={thumbIconColor} size="small" />
          ) : (
            <View style={styles.chevronRow}>
              <View style={styles.chevronStack}>
                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color={thumbIconColor}
                />
                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color={thumbIconColor}
                  style={styles.chevronBold}
                />
              </View>
              <View style={[styles.chevronStack, styles.chevronTrail]}>
                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color={thumbIconColor}
                />
                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color={thumbIconColor}
                  style={styles.chevronBold}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Ochroq track — matn qoramtir, oq emas. */
function softenColor(hex: string): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return '#D9CCEF';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel * 0.28 + 255 * 0.72);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE + 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  thumb: {
    position: 'absolute',
    left: TRACK_PAD,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -4,
  },
  chevronStack: {
    width: 16,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronTrail: {
    marginLeft: -10,
  },
  chevronBold: {
    position: 'absolute',
    left: 1.2,
  },
});
