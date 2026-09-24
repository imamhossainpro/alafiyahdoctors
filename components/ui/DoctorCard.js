// components/ui/DoctorCard.js
// ==================================================
// 👨‍⚕️ DoctorCard — Doctor information card
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

export default function DoctorCard({
  doctor,
  selected = false,
  onPress,
  showCheckbox = false,
  style,
}) {
  if (!doctor) return null;

  const {
    name,
    specialty,
    quals,
    workplace,
    timeSlots = [],
    deptName,
    deptColor,
  } = doctor;

  return (
    <Card
      onPress={onPress}
      variant={selected ? 'elevated' : 'default'}
      padding="lg"
      style={[
        styles.container,
        selected && styles.selected,
        deptColor && { borderLeftWidth: 4, borderLeftColor: deptColor },
        style,
      ]}
    >
      {/* Header — Name + Selection */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{name || 'নামহীন ডাক্তার'}</Text>
          {deptName && (
            <Text style={[styles.dept, deptColor && { color: deptColor }]}>
              {deptName}
            </Text>
          )}
        </View>

        {showCheckbox && (
          <View style={[styles.radio, selected && styles.radioSelected]}>
            {selected && (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            )}
          </View>
        )}
      </View>

      {/* Specialty */}
      {specialty && (
        <Text style={styles.specialty}>{specialty}</Text>
      )}

      {/* Qualifications */}
      {quals && (
        <Text style={styles.quals} numberOfLines={2}>
          {quals}
        </Text>
      )}

      {/* Workplace */}
      {workplace && (
        <Text style={styles.workplace} numberOfLines={2}>
          {workplace}
        </Text>
      )}

      {/* Time Slots */}
      {timeSlots.length > 0 && (
        <View style={styles.slotsContainer}>
          {timeSlots.map((slot, idx) => (
            <View key={idx} style={styles.slotBadge}>
              <Ionicons name="time-outline" size={13} color={colors.warningDark} />
              <Text style={styles.slotText}>
                {slot.start} - {slot.end}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  dept: {
    ...typography.bodySmall,
    color: colors.accent,
    fontFamily: fontFamily.semiBold,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  specialty: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: '#9c2a7e',
    marginBottom: 4,
  },
  quals: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  workplace: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  slotText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.warningDark,
  },
});