// components/doctors/DoctorFilterBar.js
// ==================================================
// 🎛️ DoctorFilterBar — Department, Day + Info text
// ==================================================
// ✅ Time filter সরানো হয়েছে
// ✅ "আজ" chip সরানো হয়েছে (auto-select)
// ✅ "শুধু আজ উপলব্ধ" toggle সরানো হয়েছে
// ✅ নতুন info text: "আজকে {বার} সেসকল ডাক্তার চেম্বার করছেন"
// ==================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

// ✅ Day filters — "আজ" বাদ
const DAY_FILTERS = [
  { key: 'all', label: 'সব দিন', short: 'সব দিন' },
  { key: 'শনিবার', label: 'শনিবার', short: 'শনি' },
  { key: 'রবিবার', label: 'রবিবার', short: 'রবি' },
  { key: 'সোমবার', label: 'সোমবার', short: 'সোম' },
  { key: 'মঙ্গলবার', label: 'মঙ্গলবার', short: 'মঙ্গল' },
  { key: 'বুধবার', label: 'বুধবার', short: 'বুধ' },
  { key: 'বৃহস্পতিবার', label: 'বৃহস্পতিবার', short: 'বৃহঃ' },
  { key: 'শুক্রবার', label: 'শুক্রবার', short: 'শুক্র' },
];

export default function DoctorFilterBar({
  departments = [],
  selectedDepartment,
  onDepartmentChange,
  selectedDay,
  onDayChange,
  todayDayName,   // ✅ NEW: আজকের দিনের নাম (e.g., "শনিবার")
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {/* Department filter */}
      <Text style={styles.filterLabel}>বিভাগ</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Chip
          label={`সব বিভাগ (${departments.length})`}
          active={selectedDepartment === 'all'}
          onPress={() => onDepartmentChange('all')}
        />
        {departments.map((dept) => {
          const count = (dept.doctors || []).length;
          return (
            <Chip
              key={dept.id}
              label={`${dept.name} (${count})`}
              dotColor={dept.color}
              active={selectedDepartment === dept.id}
              onPress={() => onDepartmentChange(dept.id)}
            />
          );
        })}
      </ScrollView>

      {/* Day filter */}
      <Text style={styles.filterLabel}>দিন</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {DAY_FILTERS.map((d) => (
          <Chip
            key={d.key}
            label={d.short || d.label}
            active={selectedDay === d.key}
            onPress={() => onDayChange(d.key)}
          />
        ))}
      </ScrollView>

      {/* ✅ Today's info text — নতুন */}
      {todayDayName ? (
        <View style={styles.todayInfoBox}>
          <Ionicons
            name="information-circle"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.todayInfoText}>
            আজকে {todayDayName} সেসকল ডাক্তার চেম্বার করছেন
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ==================================================
// ✅ Chip component
// ==================================================
function Chip({ label, active, onPress, dotColor }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, active && styles.chipActive]}
    >
      {dotColor && (
        <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      )}
      <Text
        style={[styles.chipLabel, active && styles.chipLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
  },

  // ✅ Today's info box
  todayInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  todayInfoText: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
});