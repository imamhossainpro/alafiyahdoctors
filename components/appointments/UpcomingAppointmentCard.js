// components/appointments/UpcomingAppointmentCard.js
// ==================================================
// 📅 UpcomingAppointmentCard — With real-time queue status
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import LiveStatusCard from './LiveStatusCard';
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

export default function UpcomingAppointmentCard({
  appointment,
  onViewPress,
  onCancelPress,
  canCancel = false,
  style,
}) {
  if (!appointment) return null;

  const {
    doctorName,
    doctorDept,
    doctorTime,
    bookingDate,
    serialNo,
    status,
    doctorId,
  } = appointment;

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
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

        <StatusBadge status={status} size="sm" />
      </View>

      {/* Date + Time */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>তারিখ</Text>
            <Text style={styles.infoValue}>{formatBengaliDate(bookingDate)}</Text>
          </View>
        </View>

        {doctorTime ? (
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>সময়</Text>
              <Text style={styles.infoValue}>{doctorTime}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Serial number */}
      <View style={styles.serialBox}>
        <View style={styles.serialLeft}>
          <Text style={styles.serialLabel}>আপনার সিরিয়াল</Text>
          <Text style={styles.serialNumber}>#{serialNo || '—'}</Text>
        </View>
      </View>

      {/* ✅ Live Status Card with real-time */}
      <LiveStatusCard
        mySerial={serialNo}
        doctorId={doctorId}
        bookingDate={bookingDate}
        appointmentStatus={status}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="সিরিয়াল দেখুন"
          onPress={onViewPress}
          variant="primary"
          size="sm"
          icon="qr-code-outline"
          style={styles.actionBtn}
        />

        {canCancel && (
          <TouchableOpacity
            onPress={onCancelPress}
            activeOpacity={0.7}
            style={styles.cancelBtn}
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color={colors.error}
            />
            <Text style={styles.cancelText}>বাতিল করুন</Text>
          </TouchableOpacity>
        )}
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
    ...shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  doctorWrap: { flex: 1 },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  doctorDept: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.accent,
  },
  infoGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 1,
  },
  infoValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  serialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  serialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  serialLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  serialNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  actionBtn: { flex: 1 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.error + '60',
    backgroundColor: colors.errorLight,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.error,
  },
});