// src/components/ui/ErrorState.js
// ==================================================
// ⚠️ ErrorState — Error message with retry action
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function ErrorState({
  title = 'কিছু একটা সমস্যা হয়েছে',
  message = 'আবার চেষ্টা করুন',
  onRetry,
  retryLabel = 'আবার চেষ্টা করুন',
  icon = 'cloud-offline-outline',
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={44} color={colors.error} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}

      {onRetry && (
        <Button
          title={retryLabel}
          onPress={onRetry}
          icon="refresh"
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorLight,
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