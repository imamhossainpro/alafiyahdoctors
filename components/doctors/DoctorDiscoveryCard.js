// components/doctors/DoctorDiscoveryCard.js
// ==================================================
// 👨‍⚕️ DoctorDiscoveryCard — Redesigned + Fixed
// ==================================================
// ✅ Lucide icons for departments
// ✅ No duplicate "বিভাগ" suffix
// ✅ Gender-based avatar fallback (Female/Male)
// ✅ Photo support (imageUrl)
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Stethoscope,
  Scissors,
  Heart,
  Baby,
  Bone,
  Syringe,
  Pill,
  Activity,
  Brain,
  Eye,
  Utensils,
  Smile,
  Sparkles,
  User,
  Droplet,
  Thermometer,
  Ear,
} from 'lucide-react-native';
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

// ==================================================
// ✅ Department Icon Map (lucide-react-native)
// ==================================================
const DEPT_ICONS = {
  Stethoscope,
  Scissors,
  Heart,
  Baby,
  Bone,
  Syringe,
  Pill,
  Activity,
  Brain,
  Eye,
  Utensils,
  Smile,
  Sparkles,
  User,
  Droplet,
  Thermometer,
  Ear,
};

// ==================================================
// ✅ Dept name + "বিভাগ" (avoid duplicate)
// ==================================================
const formatDeptLabel = (deptName) => {
  if (!deptName) return '';
  const trimmed = deptName.trim();
  if (trimmed.includes('বিভাগ') || trimmed.includes('department')) {
    return trimmed;
  }
  return `${trimmed} বিভাগ`;
};

// ==================================================
// ✅ Doctor initials for fallback avatar
// ==================================================
const getDoctorInitials = (name) => {
  if (!name) return 'ডা';
  const cleaned = name.replace(/^(ডাঃ|ডা\.|Dr\.?|Dr\s*)/i, '').trim();
  return cleaned.charAt(0) || 'ডা';
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

  // ✅ Department icon
  const DeptIcon = DEPT_ICONS[doctor.deptIcon] || Stethoscope;

  // ✅ Gender detection
  const isFemale =
    doctor.gender === 'female' ||
    doctor.gender === 'মহিলা' ||
    doctor.gender === 'female_doctor';
  const isMale =
    doctor.gender === 'male' ||
    doctor.gender === 'পুরুষ' ||
    doctor.gender === 'male_doctor';

  // ✅ Avatar logic
  const hasPhoto = doctor.imageUrl && doctor.imageUrl.trim() !== '';

  // ✅ Dept label (avoid duplicate)
  const deptLabel = formatDeptLabel(doctor.deptName);

  return (
    <View style={[styles.card, style]}>
      {/* ==========================================
          HEADER ROW
          ========================================== */}
      <View style={styles.headerRow}>
        {/* Avatar: Photo → Gender → Initials */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: hasPhoto
                ? colors.primaryLight
                : isFemale
                ? '#FDE7F3'
                : isMale
                ? '#E6F0FA'
                : colors.primaryLight,
            },
          ]}
        >
          {hasPhoto ? (
            <Image
              source={{ uri: doctor.imageUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : isFemale ? (
            <Ionicons name="woman" size={34} color="#DB2777" />
          ) : isMale ? (
            <Ionicons name="man" size={34} color="#1c5fa8" />
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {getDoctorInitials(doctor.name)}
            </Text>
          )}
        </View>

        {/* Name + Specialty + Verified */}
        <View style={styles.nameWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {doctor.name || 'ডাক্তার'}
            </Text>
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

        <FavoriteButton doctorId={doctor.id} size="sm" />
      </View>

      {/* ==========================================
          INFO SECTION
          ========================================== */}
      <View style={styles.infoSection}>
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
              <DeptIcon size={12} color={doctor.deptColor || colors.accent} />
              <Text
                style={[
                  styles.deptBadgeText,
                  { color: doctor.deptColor || colors.accent },
                ]}
                numberOfLines={1}
              >
                {deptLabel}
              </Text>
            </View>
          </View>
        )}

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

        <View style={styles.availabilityRow}>
          {inChamber ? (
            <View style={[styles.statusPill, styles.statusPillLive]}>
              <View style={styles.liveDot} />
              <Text style={styles.statusLiveText}>এখন চেম্বারে আছেন</Text>
            </View>
          ) : availableToday ? (
            <View style={[styles.statusPill, styles.statusPillAvailable]}>
              <View style={styles.availableDot} />
              <Text style={styles.statusAvailableText}>
                আজ {todayTime || ''}
              </Text>
            </View>
          ) : (
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
        <Button
          title="বিস্তারিত"
          onPress={onDetailsPress}
          variant="outline"
          size="sm"
          icon="information-circle-outline"
          style={styles.secondaryBtn}
        />
        <Button
          title={canBookToday ? 'সিরিয়াল নিন' : 'আজ সিরিয়াল নেই'}
          onPress={onBookPress}
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
    overflow: 'hidden',
    ...shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
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
    maxWidth: '100%',
  },
  deptBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    flexShrink: 1,
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