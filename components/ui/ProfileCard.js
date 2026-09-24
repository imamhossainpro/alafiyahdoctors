// components/ui/ProfileCard.js
// ==================================================
// 👤 ProfileCard — User profile summary card
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function ProfileCard({
  user,
  onPress,
  showRole = true,
  style,
}) {
  if (!user) return null;

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <Card
      onPress={onPress}
      variant="elevated"
      padding="lg"
      style={[styles.container, style]}
    >
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name || 'ব্যবহারকারী'}
          </Text>

          {user.email && (
            <View style={styles.metaRow}>
              <Ionicons name="mail-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.meta} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          )}

          {user.designation && (
            <View style={styles.metaRow}>
              <Ionicons name="briefcase-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.meta} numberOfLines={1}>
                {user.designation}
              </Text>
            </View>
          )}

          {showRole && user.role && (
            <View style={styles.badgeRow}>
              <StatusBadge status={user.role} size="sm" />
            </View>
          )}
        </View>

        {/* Chevron */}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  badgeRow: {
    marginTop: 6,
  },
});