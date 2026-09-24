// src/components/ui/Card.js
// ==================================================
// 🃏 Card — Base Card Component
// ==================================================
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function Card({
  children,
  onPress,
  variant = 'default',       // default | elevated | outline | flat
  padding = 'md',            // none | sm | md | lg
  style,
  ...rest
}) {
  const paddingMap = {
    none: 0,
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  };

  const variantStyle = {
    default: { backgroundColor: colors.surface, ...shadows.sm },
    elevated: { backgroundColor: colors.surface, ...shadows.md },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    flat: { backgroundColor: colors.surfaceVariant },
  }[variant];

  const cardStyle = [
    styles.base,
    variantStyle,
    { padding: paddingMap[padding] },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={cardStyle}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});