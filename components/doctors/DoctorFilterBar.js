// components/doctors/DoctorFilterBar.js
// ==================================================
// 🎛️ DoctorFilterBar — Department + Day chips
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

// ✅ Bangla digit converter
const toBangla = (num) => {
  const bangla = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bangla[d]);
};

// ✅ Day chips with dynamic dates
const generateDayChips = (todayDayName) => {
  const BANGLA_DAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার',
    'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
  ];
  const SHORT_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  const today = new Date();
  const todayIndex = BANGLA_DAYS.indexOf(todayDayName);
  const startIdx = todayIndex >= 0 ? todayIndex : today.getDay();

  const chips = [
    {
      key: 'all',
      label: 'সব দিন',
      isAll: true,
    },
    {
      key: BANGLA_DAYS[startIdx],
      label: 'আজ',
      date: toBangla(today.getDate()),
      short: SHORT_DAYS[startIdx],
      isToday: true,
    },
  ];

  for (let i = 1; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayIdx = d.getDay();
    chips.push({
      key: BANGLA_DAYS[dayIdx],
      label: SHORT_DAYS[dayIdx],
      date: toBangla(d.getDate()),
      short: SHORT_DAYS[dayIdx],
      isToday: false,
    });
  }

  return chips;
};

export default function DoctorFilterBar({
  departments = [],
  selectedDepartment,
  onDepartmentChange,
  selectedDay,
  onDayChange,
  todayDayName,
  style,
}) {
  const dayChips = React.useMemo(
    () => generateDayChips(todayDayName),
    [todayDayName]
  );

  const [showAllDepts, setShowAllDepts] = React.useState(false);
  const visibleDepts = showAllDepts ? departments : departments.slice(0, 4);

  return (
    <View style={[styles.container, style]}>
      {/* ==========================================
          DEPARTMENT FILTER
          ========================================== */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.filterLabel}>বিভাগ</Text>
        {departments.length > 4 && (
          <TouchableOpacity
            onPress={() => setShowAllDepts(!showAllDepts)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterAction}>
              {showAllDepts ? 'কম দেখুন' : 'সব দেখুন'}{' '}
              <Ionicons
                name={showAllDepts ? 'arrow-back' : 'arrow-forward'}
                size={12}
                color={colors.primary}
              />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Chip
          label={`সব বিভাগ (${toBangla(departments.length)})`}
          icon="grid-outline"
          active={selectedDepartment === 'all'}
          onPress={() => onDepartmentChange('all')}
        />
        {visibleDepts.map((dept) => {
          const count = (dept.doctors || []).length;
          return (
            <Chip
              key={dept.id}
              label={`${dept.name} (${toBangla(count)})`}
              icon={dept.icon}
              color={dept.color}
              active={selectedDepartment === dept.id}
              onPress={() => onDepartmentChange(dept.id)}
            />
          );
        })}
      </ScrollView>

      {/* ==========================================
          DAY FILTER
          ========================================== */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.filterLabel}>দিন</Text>
        {todayDayName && (
          <View style={styles.todayBadgeRow}>
            <Text style={styles.todayText}>আজ</Text>
            <Ionicons name="calendar-outline" size={12} color={colors.primary} />
            <Text style={styles.todayDate}>
              {dayChips[1]?.short || ''}, {dayChips[1]?.date || ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {dayChips.map((d) => (
          <DayChip
            key={d.key}
            label={d.label}
            date={d.date}
            isToday={d.isToday}
            isAll={d.isAll}
            active={selectedDay === d.key}
            onPress={() => onDayChange(d.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ label, icon, color, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.white : color || colors.primary}
        />
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

function DayChip({ label, date, isToday, isAll, active, onPress }) {
  if (isAll) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.dayChip, active && styles.dayChipActive]}
      >
        <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.dayChip, active && styles.dayChipActive]}
    >
      <Text style={[styles.dayChipTop, active && styles.dayChipTopActive]}>
        {isToday ? 'আজ' : label}
      </Text>
      <Text style={[styles.dayChipDate, active && styles.dayChipDateActive]}>
        {date}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filterAction: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    color: colors.primary,
  },
  todayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayText: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    color: colors.primary,
  },
  todayDate: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.white,
  },
  dayChip: {
    minWidth: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  dayChipLabelActive: {
    color: colors.white,
  },
  dayChipTop: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dayChipTopActive: {
    color: colors.white,
  },
  dayChipDate: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayChipDateActive: {
    color: colors.white,
  },
});