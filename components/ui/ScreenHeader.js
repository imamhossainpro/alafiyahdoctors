// components/ui/ScreenHeader.js
// ==================================================
// 📱 ScreenHeader — Custom screen top bar
// ==================================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightIcon,
  onRightPress,
  rightLabel,
  variant = 'default',      // default | transparent
  style,
}) {
  const insets = useSafeAreaInsets();

  const bg = variant === 'transparent' ? 'transparent' : colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingTop: insets.top + spacing.sm,
        },
        style,
      ]}
    >
      {/* Left — Back button */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Center — Title */}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title || ''}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right — Action */}
      <View style={styles.right}>
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={22} color={colors.white} />
          </TouchableOpacity>
        )}
        {rightLabel && (
          <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    minHeight: 60,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: 6,
  },
  title: {
    ...typography.h4,
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  rightLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.white,
  },
});