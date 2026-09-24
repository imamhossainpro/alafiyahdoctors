// components/ui/AppointmentCard.js
// ==================================================
// 📅 AppointmentCard — Booking / appointment card
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

export default function AppointmentCard({
  appointment,
  onPress,
  style,
}) {
  if (!appointment) return null;

  const {
    serialNo,
    name,
    age,
    mobile,
    bookingDate,
    bookingDay,
    doctorName,
    doctorDept,
    doctorTime,
    status,
    isNew,
  } = appointment;

  return (
    <Card
      onPress={onPress}
      variant="default"
      padding="lg"
      style={[styles.container, isNew && styles.newHighlight, style]}
    >
      {/* Top Row — Serial + Status */}
      <View style={styles.topRow}>
        <View style={styles.serialBadge}>
          <Text style={styles.serialLabel}>সিরিয়াল</Text>
          <Text style={styles.serialNumber}>{serialNo || '—'}</Text>
        </View>

        <View style={styles.statusWrap}>
          {status && <StatusBadge status={status} size="sm" />}
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>নতুন</Text>
            </View>
          )}
        </View>
      </View>

      {/* Patient name */}
      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.patientName}>{name || '—'}</Text>
        {age && <Text style={styles.patientMeta}>· {age} বছর</Text>}
      </View>

      {/* Mobile */}
      {mobile && (
        <View style={styles.row}>
          <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{mobile}</Text>
        </View>
      )}

      {/* Doctor */}
      {doctorName && (
        <View style={styles.row}>
          <Ionicons name="medkit-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {doctorName}
            {doctorDept ? ` · ${doctorDept}` : ''}
          </Text>
        </View>
      )}

      {/* Time */}
      {doctorTime && (
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metaText}>{doctorTime}</Text>
        </View>
      )}

      {/* Date (bottom, separator) */}
      {(bookingDate || bookingDay) && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.dateText}>
            {bookingDate || ''} {bookingDay ? `(${bookingDay})` : ''}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  newHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  serialBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  serialLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  serialNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.primary,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  newBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.successDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  patientName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  patientMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  dateText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textTertiary,
  },
});