// src/components/ui/Button.js
// ==================================================
// 🔘 Button — Primary / Secondary / Outline / Icon
// ==================================================
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

// ==================================================
// ✅ Main Button Component
// ==================================================
export default function Button({
  title,
  onPress,
  variant = 'primary',        // primary | secondary | outline | ghost | danger
  size = 'md',                // sm | md | lg
  icon,                        // Ionicons name
  iconPosition = 'left',       // left | right
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  // ==========================================
  // Variant styles
  // ==========================================
  const variantStyles = {
    primary: {
      container: styles.primaryContainer,
      text: styles.primaryText,
      indicator: colors.white,
      iconColor: colors.white,
    },
    secondary: {
      container: styles.secondaryContainer,
      text: styles.secondaryText,
      indicator: colors.accent,
      iconColor: colors.accent,
    },
    outline: {
      container: styles.outlineContainer,
      text: styles.outlineText,
      indicator: colors.primary,
      iconColor: colors.primary,
    },
    ghost: {
      container: styles.ghostContainer,
      text: styles.ghostText,
      indicator: colors.primary,
      iconColor: colors.primary,
    },
    danger: {
      container: styles.dangerContainer,
      text: styles.dangerText,
      indicator: colors.white,
      iconColor: colors.white,
    },
  };

  // ==========================================
  // Size styles
  // ==========================================
  const sizeStyles = {
    sm: { container: styles.sizeSm, text: styles.textSm, iconSize: 16 },
    md: { container: styles.sizeMd, text: styles.textMd, iconSize: 20 },
    lg: { container: styles.sizeLg, text: styles.textLg, iconSize: 22 },
  };

  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {/* Loading spinner */}
      {loading ? (
        <ActivityIndicator size="small" color={v.indicator} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={s.iconSize}
              color={v.iconColor}
              style={{ marginRight: spacing.sm }}
            />
          )}

          <Text style={[styles.baseText, v.text, s.text, textStyle]}>
            {title}
          </Text>

          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={s.iconSize}
              color={v.iconColor}
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// ==================================================
// ✅ Icon Button (Circular / Square)
// ==================================================
export function IconButton({
  icon,
  onPress,
  variant = 'primary',        // primary | secondary | outline | ghost
  size = 'md',                // sm | md | lg
  shape = 'circle',           // circle | square
  disabled = false,
  style,
}) {
  const variantStyles = {
    primary: { bg: colors.primary, color: colors.white },
    secondary: { bg: colors.accentLight, color: colors.accent },
    outline: {
      bg: colors.white,
      color: colors.primary,
      borderColor: colors.border,
    },
    ghost: { bg: colors.surfaceMuted, color: colors.textSecondary },
  };

  const sizeStyles = {
    sm: { size: 36, iconSize: 18 },
    md: { size: 44, iconSize: 22 },
    lg: { size: 52, iconSize: 26 },
  };

  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.iconButtonBase,
        {
          width: s.size,
          height: s.size,
          borderRadius: shape === 'circle' ? s.size / 2 : radius.md,
          backgroundColor: v.bg,
        },
        v.borderColor && { borderWidth: 1, borderColor: v.borderColor },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={s.iconSize} color={v.color} />
    </TouchableOpacity>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  // Base
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  baseText: {
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },

  // ==========================================
  // Variants
  // ==========================================
  primaryContainer: {
    backgroundColor: colors.primary,
    ...shadows.primary,
  },
  primaryText: {
    color: colors.white,
  },

  secondaryContainer: {
    backgroundColor: colors.accentLight,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  secondaryText: {
    color: colors.accent,
  },

  outlineContainer: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.primary,
  },

  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.primary,
  },

  dangerContainer: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: colors.white,
  },

  // ==========================================
  // Sizes
  // ==========================================
  sizeSm: {
    height: 38,
    paddingHorizontal: spacing.lg,
  },
  sizeMd: {
    height: 48,
    paddingHorizontal: spacing.xl,
  },
  sizeLg: {
    height: 56,
    paddingHorizontal: spacing.xxl,
  },

  textSm: { fontSize: 13 },
  textMd: { fontSize: 15 },
  textLg: { fontSize: 16 },

  // ==========================================
  // Icon Button
  // ==========================================
  iconButtonBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});