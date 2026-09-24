// components/home/PhoneRequiredCard.js
// ==================================================
// 📞 PhoneRequiredCard — Prompt to add phone number
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function PhoneRequiredCard({ onPress, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconBox}>
        <Ionicons name="call-outline" size={28} color={colors.warningDark} />
      </View>

      <Text style={styles.title}>ফোন নাম্বার যোগ করুন</Text>

      <Text style={styles.message}>
        আপনার সিরিয়াল ও বুকিং দেখতে ফোন নাম্বার যোগ করা প্রয়োজন।
      </Text>

      <Button
        title="এখনই যোগ করুন"
        onPress={onPress}
        icon="arrow-forward"
        iconPosition="right"
        variant="primary"
        size="md"
        fullWidth
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  button: { marginTop: spacing.xs },
});