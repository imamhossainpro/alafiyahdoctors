// src/components/ui/EmptyState.js
// ==================================================
// 📭 EmptyState — Empty list / no data state
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';

export default function EmptyState({
  icon = 'document-text-outline',
  title = 'কিছু নেই',
  message,
  actionLabel,
  onAction,
  actionIcon = 'add',
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}

      {actionLabel && (
        <Button
          title={actionLabel}
          onPress={onAction}
          icon={actionIcon}
          variant="primary"
          size="md"
          style={{ marginTop: spacing.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});