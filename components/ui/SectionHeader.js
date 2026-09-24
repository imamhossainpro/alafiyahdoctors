// src/components/ui/SectionHeader.js
// ==================================================
// 📰 Section Header — Page/Section Title with optional action
// ==================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  icon,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.primary}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
          style={styles.action}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          {actionIcon && (
            <Ionicons
              name={actionIcon}
              size={16}
              color={colors.primary}
              style={{ marginLeft: 4 }}
            />
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
    marginBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
});