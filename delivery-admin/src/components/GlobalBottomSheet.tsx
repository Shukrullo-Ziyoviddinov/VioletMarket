import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>;

const HIDDEN_OFFSET = 900;

export function GlobalBottomSheet({
  visible,
  title,
  onClose,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(HIDDEN_OFFSET);
  const sheetHeight = useSharedValue(HIDDEN_OFFSET);

  useEffect(() => {
    if (!visible) return;
    translateY.value = HIDDEN_OFFSET;
    translateY.value = withSpring(0, {
      damping: 24,
      stiffness: 230,
      mass: 0.9,
    });
  }, [translateY, visible]);

  function closeAnimated() {
    translateY.value = withTiming(
      HIDDEN_OFFSET,
      { duration: 220 },
      (finished) => {
        if (finished) runOnJS(onClose)();
      },
    );
  }

  const dragGesture = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-30, 30])
    .onBegin(() => {
      cancelAnimation(translateY);
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const closeThreshold = sheetHeight.value * 0.3;
      if (event.translationY >= closeThreshold) {
        translateY.value = withTiming(
          HIDDEN_OFFSET,
          { duration: 220 },
          (finished) => {
            if (finished) runOnJS(onClose)();
          },
        );
        return;
      }
      translateY.value = withTiming(0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeAnimated}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeAnimated} />
          <KeyboardAvoidingView
            pointerEvents="box-none"
            style={styles.keyboardArea}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <GestureDetector gesture={dragGesture}>
              <Animated.View
                onLayout={(event) => {
                  sheetHeight.value = event.nativeEvent.layout.height;
                }}
                style={[
                  styles.sheet,
                  { paddingBottom: Math.max(insets.bottom, 20) },
                  animatedSheetStyle,
                ]}>
                <View style={styles.dragArea}>
                  <View style={styles.dragHandle} />
                  <Text style={styles.title}>{title}</Text>
                </View>
                <View style={styles.contentContainer}>{children}</View>
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '96%',
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 18,
  },
  contentContainer: {
    paddingTop: 2,
    flexShrink: 1,
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 11,
    paddingBottom: 18,
  },
  dragHandle: {
    width: 46,
    height: 5,
    marginBottom: 17,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  title: {
    alignSelf: 'flex-start',
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
  },
});
