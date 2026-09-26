// components/doctors/DoctorDiscoveryCard.js
// ==================================================
// 👨‍⚕️ DoctorDiscoveryCard — Fixed Avatar & Icon
// ==================================================
// ✅ Male/Female icon (no "ড" letter)
// ✅ Photo from imageUrl if available
// ✅ Safe dept icon
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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

// ==================================================
// ✅ Dept name → Ionicons icon (same mapping)
// ==================================================
const DEPT_NAME_TO_ICON = {
  'গাইনী': 'female-outline',
  'গাইনি': 'female-outline',
  'গাইনোকোলজি': 'female-outline',
  'স্ত্রীরোগ': 'female-outline',
  'প্রসূতি': 'female-outline',
  'শিশু': 'happy-outline',
  'মেডিসিন': 'medkit-outline',
  'সার্জারি': 'bandage-outline',
  'অর্থোপেডিক': 'walk-outline',
  'হাড়': 'walk-outline',
  'হৃদরোগ': 'heart-outline',
  'কার্ডিওলজি': 'heart-outline',
  'চর্ম': 'hand-left-outline',
  'চোখ': 'eye-outline',
  'নাক': 'ear-outline',
  'কান': 'ear-outline',
  'গলা': 'ear-outline',
  'দাঁত': 'happy-outline',
  'ডেন্টাল': 'happy-outline',
  'মুখ': 'happy-outline',
  'ডায়াবেটিস': 'water-outline',
  'কিডনি': 'water-outline',
  'রক্ত': 'water-outline',
  'ফিজিওথেরাপি': 'fitness-outline',
  'বাত': 'walk-outline',
};

const getDeptIcon = (deptName, fallback = 'medkit-outline') => {
  if (!deptName) return fallback;
  const name = deptName.trim();
  if (DEPT_NAME_TO_ICON[name]) return DEPT_NAME_TO_ICON[name];
  for (const [key, icon] of Object.entries(DEPT_NAME_TO_ICON)) {
    if (name.includes(key) || key.includes(name)) return icon;
  }
  return fallback;
};

// ==================================================
// ✅ Dept label (avoid duplicate "বিভাগ")
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
// ✅ Gender detection from name (fallback)
// ==================================================
const guessGenderFromName = (name) => {
  if (!name) return 'unknown';
  const femaleIndicators = [
    'ডা. মিসেস', 'ডা. মিস', 'ডা. সেলিনা', 'ডা. ফারহানা', 'ডা. নাসরিন',
    'ডা. শাহানা', 'ডা. নূরুন', 'ডা. রুবিনা', 'ডা. সাবরিনা', 'ডা. সাদিয়া',
    'ডা. রেহানা', 'ডা. তাসলিমা', 'ডা. সুরাইয়া', 'ডা. ফরিদা', 'ডা. মমতাজ',
    'ডা. জাহানারা', 'ডা. আয়েশা', 'ডা. খালেদা', 'ডা. সাজেদা', 'ডা. রোকেয়া',
    'ডা. সাবিহা', 'ডা. আনোয়ারা', 'ডা. শিরিন', 'ডা. লুবনা', 'ডা. সুমাইয়া',
    'ডা. মারিয়া', 'ডা. নাদিয়া', 'ডা. সানজিদা', 'ডা. জান্নাত', 'ডা. তাহমিনা',
  ];
  for (const indicator of femaleIndicators) {
    if (name.includes(indicator)) return 'female';
  }
  return 'unknown';
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

  // ✅ Dept icon (safe)
  const deptIconName = getDeptIcon(doctor.deptName, 'medkit-outline');
  const deptLabel = formatDeptLabel(doctor.deptName);

  // ✅ Avatar logic: Photo → Gender → Icon
  const hasPhoto = doctor.imageUrl && doctor.imageUrl.trim() !== '';

  // ✅ Gender detection: explicit field → name-based guess
  let gender = (doctor.gender || '').toLowerCase();
  if (gender === 'মহিলা' || gender === 'female' || gender === 'female_doctor') {
    gender = 'female';
  } else if (gender === 'পুরুষ' || gender === 'male' || gender === 'male_doctor') {
    gender = 'male';
  } else if (!gender || gender === '') {
    gender = guessGenderFromName(doctor.name);
  }

  // ✅ Avatar colors
  const getAvatarStyle = () => {
    if (hasPhoto) return { bg: colors.primaryLight, icon: null };
    if (gender === 'female') return { bg: '#FDE7F3', icon: 'female' };
    if (gender === 'male') return { bg: '#E6F0FA', icon: 'male' };
    return { bg: colors.primaryLight, icon: 'person' };
  };

  const avatarStyle = getAvatarStyle();
  const avatarIconColor =
    gender === 'female'
      ? '#DB2777'
      : gender === 'male'
      ? '#1c5fa8'
      : colors.primary;

  return (
    <View style={[styles.card, style]}>
      {/* ==========================================
          HEADER ROW
          ========================================== */}
      <View style={styles.headerRow}>
        {/* ✅ Avatar: Photo → Gender icon → Person */}
        <View style={[styles.avatar, { backgroundColor: avatarStyle.bg }]}>
          {hasPhoto ? (
            <Image
              source={{ uri: doctor.imageUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={avatarStyle.icon || 'person'}
              size={34}
              color={avatarIconColor}
            />
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
        {/* ✅ Dept badge with safe icon */}
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
              <Ionicons
                name={deptIconName}
                size={12}
                color={doctor.deptColor || colors.accent}
              />
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