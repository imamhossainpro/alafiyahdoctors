// components/doctors/DoctorFilterBar.js
// ==================================================
// 🎛️ DoctorFilterBar — Department + Day chips (Fixed)
// ==================================================
// ✅ Icon fallback (no ?)
// ✅ Department icon mapping
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

// ==================================================
// ✅ Department Name → Ionicons Icon Map
// ==================================================
const DEPT_NAME_TO_ICON = {
  // বাংলা নাম → icon
  'গাইনী': 'female-outline',
  'গাইনি': 'female-outline',
  'গাইনোকোলজি': 'female-outline',
  'স্ত্রীরোগ': 'female-outline',
  'প্রসূতি': 'female-outline',
  'শিশু': 'happy-outline',
  'পেডিয়াট্রিক': 'happy-outline',
  'মেডিসিন': 'medkit-outline',
  'ঔষধ': 'medkit-outline',
  'সার্জারি': 'bandage-outline',
  'সার্জারী': 'bandage-outline',
  'অর্থোপেডিক': 'walk-outline',
  'হাড়': 'walk-outline',
  'হৃদরোগ': 'heart-outline',
  'কার্ডিওলজি': 'heart-outline',
  'চর্ম': 'hand-left-outline',
  'চর্মরোগ': 'hand-left-outline',
  'নাক': 'ear-outline',
  'কান': 'ear-outline',
  'গলা': 'ear-outline',
  'চোখ': 'eye-outline',
  'নিউরো': 'fitness-outline',
  'মস্তিষ্ক': 'fitness-outline',
  'ডায়াবেটিস': 'water-outline',
  'কিডনি': 'water-outline',
  'দাঁত': 'happy-outline',
  'ডেন্টাল': 'happy-outline',
  'ফিজিওথেরাপি': 'fitness-outline',
  'মুখ': 'happy-outline',
  'রক্ত': 'water-outline',
  'বাত': 'walk-outline',
  'ফুসফুস': 'cloud-outline',
  'অ্যালার্জি': 'warning-outline',
  'বিশেষজ্ঞ': 'star-outline',
};

// ✅ Fallback icons (rotation for unknown departments)
const FALLBACK_ICONS = [
  'medkit-outline',
  'person-outline',
  'heart-outline',
  'fitness-outline',
  'happy-outline',
  'eye-outline',
];

// ==================================================
// ✅ Get icon for department (by name, not by field)
// ==================================================
const getDeptIcon = (dept, index) => {
  const name = (dept.name || '').trim();

  // Exact match
  if (DEPT_NAME_TO_ICON[name]) {
    return DEPT_NAME_TO_ICON[name];
  }

  // Partial match (Bengali substring)
  for (const [key, icon] of Object.entries(DEPT_NAME_TO_ICON)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }

  // Fallback (rotate based on index)
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
};

// ==================================================
// ✅ Day chips generator
// ==================================================
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
  const visibleDepts = showAllDepts ? departments : departments.slice(0, 3);

  return (
    <View style={[styles.container, style]}>
      {/* ==========================================
          DEPARTMENT FILTER
          ========================================== */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.filterLabel}>বিভাগ</Text>
        {departments.length > 3 && (
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
          iconName="grid-outline"
          active={selectedDepartment === 'all'}
          onPress={() => onDepartmentChange('all')}
        />
        {visibleDepts.map((dept, idx) => {
          const count = (dept.doctors || []).length;
          const iconName = getDeptIcon(dept, idx);
          return (
            <Chip
              key={dept.id}
              label={`${dept.name} (${toBangla(count)})`}
              iconName={iconName}
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

// ==================================================
// ✅ Chip (with safe icon)
// ==================================================
function Chip({ label, iconName, color, active, onPress }) {
  // ✅ Only render icon if valid Ionicons name
  const safeIcon = iconName || 'ellipse-outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Ionicons
        name={safeIcon}
        size={14}
        color={active ? colors.white : color || colors.primary}
      />
      <Text
        style={[styles.chipLabel, active && styles.chipLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ==================================================
// ✅ Day Chip
// ==================================================
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

// ==================================================
// 🎨 Styles
// ==================================================
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