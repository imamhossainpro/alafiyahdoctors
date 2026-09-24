// components/ui/NotificationItem.js
// ==================================================
// 🔔 NotificationItem — Notification list item
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function NotificationItem({
  title,
  message,
  time,
  icon = 'notifications-outline',
  iconColor = colors.primary,
  unread = false,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.container, unread && styles.unread, style]}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconBox,
          { backgroundColor: `${iconColor}15` },
        ]}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'নোটিফিকেশন'}
          </Text>
          {unread && <View style={styles.unreadDot} />}
        </View>

        {message && (
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        )}

        {time && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.time}>{time}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  unread: {
    backgroundColor: colors.primarySubtle,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textTertiary,
  },
});