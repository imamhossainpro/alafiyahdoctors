// components/appointments/CompletedAppointmentCard.js
// ==================================================
// ✅ CompletedAppointmentCard — History card
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

const formatBengaliDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function CompletedAppointmentCard({
  appointment,
  onBookAgainPress,
  onViewPress,
  style,
}) {
  if (!appointment) return null;

  const { doctorName, doctorDept, bookingDate, serialNo, status } = appointment;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.doctorWrap}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {doctorName || 'ডাক্তার'}
          </Text>
          {doctorDept ? (
            <Text style={styles.doctorDept} numberOfLines={1}>
              {doctorDept}
            </Text>
          ) : null}
        </View>
        <StatusBadge status={status || 'completed'} size="sm" />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.infoText}>{formatBengaliDate(bookingDate)}</Text>
      </View>

      {serialNo ? (
        <View style={styles.infoRow}>
          <Ionicons name="ticket-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.infoText}>সিরিয়াল #{serialNo}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="আবার সিরিয়াল নিন"
          onPress={onBookAgainPress}
          variant="primary"
          size="sm"
          icon="refresh"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  doctorWrap: { flex: 1 },
  doctorName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  doctorDept: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.accent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});