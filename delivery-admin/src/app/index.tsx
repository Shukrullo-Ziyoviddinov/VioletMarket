import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

const BOX_SIZE = 330;
const LOGO_SIZE = 240;
const SCOOTER_SIZE = 170;

export default function SplashScreen() {
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  const { delivery, isLoading } = useAuth();
  const [animationFinished, setAnimationFinished] = useState(false);
  const boxY = useRef(new Animated.Value(-height)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const scooterX = useRef(new Animated.Value(-width)).current;
  const scooterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    boxY.setValue(-height);
    logoOpacity.setValue(0);
    logoScale.setValue(0.6);
    scooterX.setValue(-width);
    scooterOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(boxY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(650),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            tension: 70,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(scooterX, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scooterOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => setAnimationFinished(true));
  }, [
    boxY,
    height,
    logoOpacity,
    logoScale,
    scooterOpacity,
    scooterX,
    width,
  ]);

  useEffect(() => {
    if (!animationFinished || isLoading) return;
    router.replace(delivery ? '/profile' : '/auth');
  }, [animationFinished, delivery, isLoading, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.boxContainer, { transform: [{ translateY: boxY }] }]}>
          <Image
            source={require('../../assets/images/blue-delivery-cardboard-box.png')}
            style={styles.boxImage}
            resizeMode="contain"
          />
          <Animated.Image
            source={require('../../assets/images/brand-logo.png')}
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Image
          source={require('../../assets/images/delivery-scooter.png')}
          style={[
            styles.scooter,
            {
              opacity: scooterOpacity,
              transform: [{ translateX: scooterX }],
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F25A8',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxContainer: {
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  boxImage: {
    width: BOX_SIZE,
    height: BOX_SIZE,
  },
  logo: {
    position: 'absolute',
    top: 45,
    left: 45,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  scooter: {
    width: SCOOTER_SIZE,
    height: SCOOTER_SIZE,
    marginTop: -150,
  },
});
