// components/ui/HealthTipCard.js
// ==================================================
// 💡 HealthTipCard — Reusable health tip card
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function HealthTipCard({ tip, style }) {
  if (!tip) return null;

  const { title, content, icon = 'bulb-outline', category } = tip;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>

      <View style={styles.content}>
        {category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.body} numberOfLines={3}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  categoryBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.accentDark,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    fontSize: 14.5,
    marginBottom: 3,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});