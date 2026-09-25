// components/doctors/DoctorDiscoveryCard.js
// ==================================================
// 👨‍⚕️ DoctorDiscoveryCard — Redesigned (Premium)
// ==================================================
// ✅ Fallback avatar (no imageUrl)
// ✅ Verified badge (all doctors)
// ✅ Availability status (green/gray)
// ✅ Redesigned action buttons
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

// ✅ Bangla digit converter
const toBangla = (num) => {
  if (num === undefined || num === null) return '';
  const bangla = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bangla[d]);
};

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

  // ✅ Initials for fallback avatar
  const getInitials = () => {
    const name = doctor.name || '';
    // Bengali name থেকে প্রথম অক্ষর নিন
    const cleaned = name.replace(/^(ডাঃ|ডা\.|Dr\.?)\s*/i, '').trim();
    return cleaned.charAt(0) || 'ড';
  };

  const handleBookPress = () => {
    if (!canBookToday) return;
    onBookPress?.();
  };

  return (
    <View style={[styles.card, style]}>
      {/* ==========================================
          HEADER ROW: Avatar + Name + Favorite
          ========================================== */}
      <View style={styles.headerRow}>
        {/* Avatar (fallback) */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: doctor.deptColor || colors.primaryLight },
          ]}
        >
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </View>

        {/* Name + Specialty + Verified */}
        <View style={styles.nameWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {doctor.name || 'ডাক্তার'}
            </Text>
            {/* ✅ Verified badge */}
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.primary}
              style={styles.verifiedIcon}
            />
          </View>

          {doctor.specialty && (
            <Text style={styles.specialty} numberOfLines={2}>
              {doctor.specialty}
            </Text>
          )}
        </View>

        {/* Favorite button */}
        <FavoriteButton doctorId={doctor.id} size="sm" />
      </View>

      {/* ==========================================
          INFO SECTION
          ========================================== */}
      <View style={styles.infoSection}>
        {/* Department badge */}
        {doctor.deptName && (
          <View style={styles.deptBadgeWrap}>
            <View
              style={[
                styles.deptBadge,
                {
                  backgroundColor: (doctor.deptColor || colors.accent) + '15',
                  borderColor: (doctor.deptColor || colors.accent) + '40',
                },
              ]}
            >
              <View
                style={[
                  styles.deptDot,
                  { backgroundColor: doctor.deptColor || colors.accent },
                ]}
              />
              <Text
                style={[
                  styles.deptBadgeText,
                  { color: doctor.deptColor || colors.accent },
                ]}
              >
                {doctor.deptName} বিভাগ
              </Text>
            </View>
          </View>
        )}

        {/* Workplace */}
        {doctor.workplace && (
          <View style={styles.infoRow}>
            <Ionicons
              name="business-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text style={styles.infoText} numberOfLines={2}>
              {doctor.workplace}
            </Text>
          </View>
        )}

        {/* Availability status */}
        <View style={styles.availabilityRow}>
          {inChamber ? (
            // ✅ Live: chamber-এ আছেন
            <View style={[styles.statusPill, styles.statusPillLive]}>
              <View style={styles.liveDot} />
              <Text style={styles.statusLiveText}>
                এখন চেম্বারে আছেন
              </Text>
            </View>
          ) : availableToday ? (
            // ✅ Available today
            <View style={[styles.statusPill, styles.statusPillAvailable]}>
              <View style={styles.availableDot} />
              <Text style={styles.statusAvailableText}>
                আজ {todayTime || ''}
              </Text>
            </View>
          ) : (
            // ❌ Not available
            <View style={[styles.statusPill, styles.statusPillUnavailable]}>
              <Ionicons
                name="close-circle"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.statusUnavailableText}>আজ নেই</Text>
            </View>
          )}
        </View>
      </View>

      {/* ==========================================
          ACTION BUTTONS
          ========================================== */}
      <View style={styles.ctaRow}>
        {/* বিস্তারিত (outline) */}
        <Button
          title="বিস্তারিত"
          onPress={onDetailsPress}
          variant="outline"
          size="sm"
          icon="information-circle-outline"
          style={styles.secondaryBtn}
        />

        {/* সিরিয়াল নিন (primary) OR আজ সিরিয়াল নেই (disabled) */}
        <Button
          title={canBookToday ? 'সিরিয়াল নিন' : 'আজ সিরিয়াল নেই'}
          onPress={handleBookPress}
          disabled={!canBookToday}
          variant={canBookToday ? 'primary' : 'outline'}
          size="sm"
          icon={canBookToday ? 'arrow-forward' : 'close-circle-outline'}
          iconPosition={canBookToday ? 'right' : 'left'}
          style={styles.primaryBtn}
        />
      </View>
    </View>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // ==========================================
  // Header Row
  // ==========================================
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.white,
  },
  nameWrap: {
    flex: 1,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: '#9c2a7e',
    lineHeight: 18,
  },

  // ==========================================
  // Info Section
  // ==========================================
  infoSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  deptBadgeWrap: {
    flexDirection: 'row',
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  deptDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  deptBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // ==========================================
  // Availability
  // ==========================================
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusPillLive: {
    backgroundColor: colors.successLight,
  },
  statusPillAvailable: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusPillUnavailable: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusLiveText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.successDark,
  },
  statusAvailableText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.successDark,
  },
  statusUnavailableText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ==========================================
  // CTA Buttons
  // ==========================================
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1.2,
  },
});