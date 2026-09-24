// components/ui/NotificationCard.js
// ==================================================
// 🔔 NotificationCard — Single notification item
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

const TYPE_ICONS = {
  booking_confirmed: { name: 'checkmark-circle', color: colors.success, bg: colors.successLight },
  queue_update: { name: 'notifications', color: colors.primary, bg: colors.primaryLight },
  promo: { name: 'gift', color: colors.warning, bg: colors.warningLight },
  account_approved: { name: 'shield-checkmark', color: colors.success, bg: colors.successLight },
  general: { name: 'information-circle', color: colors.textSecondary, bg: colors.surfaceMuted },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'এইমাত্র';
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
    if (diffDay < 7) return `${diffDay} দিন আগে`;

    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function NotificationCard({
  notification,
  onPress,
  onDeletePress,
  style,
}) {
  if (!notification) return null;

  const typeInfo = TYPE_ICONS[notification.type] || TYPE_ICONS.general;
  const isUnread = notification.isRead === false;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.container, isUnread && styles.unread, style]}
    >
      <View style={[styles.iconBox, { backgroundColor: typeInfo.bg }]}>
        <Ionicons name={typeInfo.name} size={22} color={typeInfo.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title || 'নোটিফিকেশন'}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        {notification.body ? (
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
        </View>
      </View>

      {onDeletePress && (
        <TouchableOpacity
          onPress={onDeletePress}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
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
    marginBottom: spacing.sm,
  },
  unread: {
    backgroundColor: colors.primarySubtle,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14.5,
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  deleteBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
});