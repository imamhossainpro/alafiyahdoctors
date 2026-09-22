// components/ui/Skeleton.js
// ==================================================
// 🎨 Base Skeleton Component with Shimmer Animation
// ==================================================
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  circle = false,
  style = {},
}) {
  // Shimmer animation value
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  // Shimmer translate
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const baseWidth = circle ? height : width;
  const baseHeight = circle ? width : height;
  const baseRadius = circle ? height / 2 : borderRadius;

  return (
    <View
      style={[
        styles.container,
        {
          width: baseWidth,
          height: baseHeight,
          borderRadius: baseRadius,
        },
        style,
      ]}
    >
      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9edf2',
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});