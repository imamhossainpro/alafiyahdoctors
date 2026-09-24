// components/doctors/DoctorDiscoveryCard.js
// ==================================================
// 👨‍⚕️ DoctorDiscoveryCard — Modern compact card with favorite
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import FavoriteButton from './FavoriteButton';
import {
  isDoctorAvailableToday,
  isDoctorInChamberNow,
  getTodayTimeDisplay,
} from '../../utils/doctorUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function DoctorDiscoveryCard({
  doctor,
  panels,
  onBookPress,
  onDetailsPress,
  style,
}) {
  if (!doctor) return null;

  const availableToday = isDoctorAvailableToday(doctor.id, panels);
  const inChamber = availableToday && isDoctorInChamberNow(doctor);
  const todayTime = getTodayTimeDisplay(doctor);
  const canBookToday = availableToday;

  const handleBookPress = () => {
    if (!canBookToday) return;
    onBookPress?.();
  };

  return (
    <View style={[styles.card, style]}>
      {/* Left color bar */}
      <View
        style={[
          styles.colorBar,
          { backgroundColor: doctor.deptColor || colors.primary },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header row: avatar + name + favorite */}
        <View style={styles.headerRow}>
          <View style={styles.avatarBox}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>

          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {doctor.name || 'ডাক্তার'}
            </Text>

            {doctor.specialty && (
              <Text style={styles.specialty} numberOfLines={2}>
                {doctor.specialty}
              </Text>
            )}
          </View>

          {/* ✅ Favorite button */}
          <FavoriteButton doctorId={doctor.id} size="sm" />
        </View>

        {/* Info rows */}
        {doctor.deptName && (
          <View style={styles.infoRow}>
            <View
              style={[
                styles.deptDot,
                { backgroundColor: doctor.deptColor || colors.accent },
              ]}
            />
            <Text style={styles.deptName}>{doctor.deptName}</Text>
          </View>
        )}

        {doctor.workplace && (
          <View style={styles.infoRow}>
            <Ionicons
              name="business-outline"
              size={13}
              color={colors.textTertiary}
            />
            <Text style={styles.infoText} numberOfLines={2}>
              {doctor.workplace}
            </Text>
          </View>
        )}

        {/* Availability + time */}
        <View style={styles.availabilityRow}>
          {inChamber ? (
            <View style={[styles.statusPill, styles.statusPillLive]}>
              <View style={styles.liveDot} />
              <Text style={styles.statusLiveText}>চেম্বারে আছেন</Text>
            </View>
          ) : availableToday ? (
            <View style={[styles.statusPill, styles.statusPillAvailable]}>
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={colors.successDark}
              />
              <Text style={styles.statusAvailableText}>আজ উপলব্ধ</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, styles.statusPillUnavailable]}>
              <Ionicons
                name="close-circle"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.statusUnavailableText}>আজ নেই</Text>
            </View>
          )}

          {todayTime && availableToday && (
            <View style={styles.timeBadge}>
              <Ionicons
                name="time-outline"
                size={11}
                color={colors.warningDark}
              />
              <Text style={styles.timeText} numberOfLines={1}>
                {todayTime}
              </Text>
            </View>
          )}
        </View>

        {/* Info note when unavailable today */}
        {!availableToday && (
          <View style={styles.noteRow}>
            <Ionicons
              name="information-circle-outline"
              size={12}
              color={colors.textTertiary}
            />
            <Text style={styles.noteText}>
              আজ সিরিয়াল দেওয়া যাবে না, বিস্তারিত দেখুন
            </Text>
          </View>
        )}

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <Button
            title="বিস্তারিত"
            onPress={onDetailsPress}
            variant="outline"
            size="sm"
            icon="information-circle-outline"
            style={styles.secondaryBtn}
          />
          <Button
            title={canBookToday ? 'সিরিয়াল নিন' : 'আজ নেই'}
            onPress={handleBookPress}
            disabled={!canBookToday}
            variant={canBookToday ? 'primary' : 'outline'}
            size="sm"
            icon={canBookToday ? 'calendar-outline' : 'close-circle-outline'}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  colorBar: { width: 5 },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: { flex: 1 },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: '#9c2a7e',
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  deptDot: { width: 6, height: 6, borderRadius: 3 },
  deptName: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    color: colors.textTertiary,
    flex: 1,
    lineHeight: 16,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusPillLive: { backgroundColor: colors.successLight },
  statusPillAvailable: { backgroundColor: colors.successLight },
  statusPillUnavailable: { backgroundColor: colors.surfaceMuted },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusLiveText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.successDark,
  },
  statusAvailableText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.successDark,
  },
  statusUnavailableText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.warningLight,
    flexShrink: 1,
  },
  timeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.warningDark,
    flexShrink: 1,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  noteText: {
    fontFamily: fontFamily.regular,
    fontSize: 10.5,
    color: colors.textTertiary,
    flex: 1,
    fontStyle: 'italic',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: { flex: 1 },
  primaryBtn: { flex: 1.4 },
});