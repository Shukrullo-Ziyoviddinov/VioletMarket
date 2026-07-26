import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

const BG = '#7c3aed';
const TRUCK_WIDTH_RATIO = 0.92;
const SPLASH_HOLD_MS = 400;

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, token, profile } = useAuth();
  const { width } = useWindowDimensions();
  const truckWidth = Math.min(width * TRUCK_WIDTH_RATIO, 420);
  const truckHeight = truckWidth * (369 / 677);
  const navigated = useRef(false);

  const truckX = useRef(new Animated.Value(-width)).current;
  const truckOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    truckX.setValue(-width);
    truckOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(truckX, {
        toValue: 0,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(truckOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [truckOpacity, truckX, width]);

  useEffect(() => {
    if (isLoading || navigated.current) return;

    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;

      if (token && profile) {
        router.replace('/asosiy');
        return;
      }
      router.replace('/register');
    }, 1800 + SPLASH_HOLD_MS);

    return () => clearTimeout(timer);
  }, [isLoading, profile, router, token]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.truckWrap,
          {
            opacity: truckOpacity,
            transform: [{ translateX: truckX }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/furalogistika1_preview_rev_1.png')}
          style={{ width: truckWidth, height: truckHeight }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
