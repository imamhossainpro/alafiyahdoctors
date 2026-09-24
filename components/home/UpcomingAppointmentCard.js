// components/home/UpcomingAppointmentCard.js
// ==================================================
// 📅 UpcomingAppointmentCard — Next appointment display
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function UpcomingAppointmentCard({
  appointment,
  onViewPress,
  style,
}) {
  if (!appointment) return null;

  const {
    serialNo,
    doctorName,
    doctorDept,
    doctorTime,
    bookingDate,
    bookingDay,
    status,
  } = appointment;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={styles.dot} />
          <Text style={styles.label}>আপনার পরবর্তী সিরিয়াল</Text>
        </View>
        {status && <StatusBadge status={status} size="sm" />}
      </View>

      <View style={styles.body}>
        <View style={styles.serialBox}>
          <Text style={styles.serialLabel}>সিরিয়াল</Text>
          <Text style={styles.serialNumber}>{serialNo || '—'}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {doctorName || 'ডাক্তার'}
          </Text>

          {doctorDept && (
            <Text style={styles.dept} numberOfLines={1}>
              {doctorDept}
            </Text>
          )}

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.metaText}>
              {bookingDate || ''}
              {bookingDay ? ` (${bookingDay})` : ''}
            </Text>
          </View>

          {doctorTime && (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.metaText}>{doctorTime}</Text>
            </View>
          )}
        </View>
      </View>

      <Button
        title="সিরিয়াল দেখুন"
        onPress={onViewPress}
        variant="primary"
        size="md"
        icon="eye-outline"
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
    ...shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  body: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  serialBox: {
    width: 72,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  serialLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  serialNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
  },
  infoBox: { flex: 1 },
  doctorName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dept: {
    ...typography.bodySmall,
    color: colors.accent,
    fontFamily: fontFamily.medium,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  button: { marginTop: spacing.xs },
});