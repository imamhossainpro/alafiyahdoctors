// components/home/GreetingHeader.js
// ==================================================
// 👋 GreetingHeader — Home greeting + notification bell
// ==================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'শুভ সকাল';
  if (hour < 16) return 'শুভ দুপুর';
  if (hour < 18) return 'শুভ বিকাল';
  if (hour < 20) return 'শুভ সন্ধ্যা';
  return 'শুভ রাত্রি';
};

export default function GreetingHeader({
  userName,
  onNotificationPress,
  notificationCount = 0,
  style,
}) {
  const greeting = getGreeting();
  const displayName = userName || 'রোগী';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.greeting} numberOfLines={1}>
          {greeting}, {displayName} 👋
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          আপনার স্বাস্থ্যসেবা এখন আরও সহজ
        </Text>
      </View>

      {onNotificationPress && (
        <TouchableOpacity
          onPress={onNotificationPress}
          activeOpacity={0.7}
          style={styles.bellButton}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.textPrimary}
          />

          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '৯+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  left: { flex: 1, marginRight: spacing.md },
  greeting: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: 9,
  },
});