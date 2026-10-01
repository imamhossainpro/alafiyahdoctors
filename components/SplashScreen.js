// components/SplashScreen.js
// ==================================================
// ✨ Animated Splash Screen — Premium & Smooth (Fixed)
// ==================================================
// ✅ Larger logo (160px)
// ✅ High-quality image rendering
// ==================================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ✅ Larger logo size for better quality
const LOGO_SIZE = Math.min(180, SCREEN_WIDTH * 0.45);

export default function SplashScreen({ onFinish }) {
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    const animationTimers = [];

    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const logoTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;
        Animated.loop(
          Animated.sequence([
            Animated.timing(breatheScale, {
              toValue: 1.03,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(breatheScale, {
              toValue: 1.0,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 200);
    animationTimers.push(logoTimer);

    const textTimer = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 500);
    animationTimers.push(textTimer);

    const dotsTimer = setTimeout(() => {
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 700);
    animationTimers.push(dotsTimer);

    const createDotAnimation = (dotValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotValue, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotValue, {
            toValue: 0.3,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const dot1Anim = createDotAnimation(dot1, 0);
    const dot2Anim = createDotAnimation(dot2, 200);
    const dot3Anim = createDotAnimation(dot3, 400);

    const dotsStartTimer = setTimeout(() => {
      if (isMounted) {
        dot1Anim.start();
        dot2Anim.start();
        dot3Anim.start();
      }
    }, 900);
    animationTimers.push(dotsStartTimer);

    return () => {
      isMounted = false;
      animationTimers.forEach((t) => clearTimeout(t));
      dot1Anim.stop();
      dot2Anim.stop();
      dot3Anim.stop();
    };
  }, []);

  useEffect(() => {
    if (!onFinish) return;
    SplashScreen.exit = (callback) => {
      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitScale, {
          toValue: 1.1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (callback) callback();
      });
    };
  }, [onFinish]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: Animated.multiply(backgroundOpacity, exitOpacity),
        },
      ]}
    >
      <Animated.View
        style={[styles.bgLayer, { opacity: backgroundOpacity }]}
      />

      {/* ✅ High-quality Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, breatheScale) },
              { scale: exitScale },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
          // ✅ High quality rendering
          fadeDuration={0}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.textWrapper,
          { opacity: Animated.multiply(textOpacity, exitOpacity) },
        ]}
      >
        <Text style={styles.appName}>Al Afiyah Hospital</Text>
        <Text style={styles.tagline}>স্বাস্থ্যসেবায় বিশ্বাস</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.dotsContainer,
          { opacity: Animated.multiply(dotsOpacity, exitOpacity) },
        ]}
      >
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </Animated.View>
    </Animated.View>
  );
}

SplashScreen.exit = null;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    // ✅ Remove shadow to prevent blur
    backgroundColor: 'transparent',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  textWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.primary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});