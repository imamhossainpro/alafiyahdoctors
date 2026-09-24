// components/ui/DoctorCompactCard.js
// ==================================================
// 👨‍⚕️ DoctorCompactCard — Horizontal scroll compact card
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

export default function DoctorCompactCard({
  doctor,
  onBookPress,
  onPress,
  style,
}) {
  if (!doctor) return null;

  const { name, specialty, timeSlots = [], deptName, deptColor } = doctor;

  const timeDisplay =
    timeSlots.length > 0
      ? `${timeSlots[0].start} - ${timeSlots[0].end}`
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, style]}
    >
      <View
        style={[
          styles.colorBar,
          { backgroundColor: deptColor || colors.primary },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.avatarBox}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {name || 'ডাক্তার'}
        </Text>

        {specialty && (
          <Text style={styles.specialty} numberOfLines={1}>
            {specialty}
          </Text>
        )}

        {deptName && (
          <View style={styles.deptRow}>
            <View
              style={[
                styles.deptDot,
                { backgroundColor: deptColor || colors.accent },
              ]}
            />
            <Text style={styles.deptText} numberOfLines={1}>
              {deptName}
            </Text>
          </View>
        )}

        {timeDisplay && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={colors.warningDark} />
            <Text style={styles.timeText} numberOfLines={1}>
              {timeDisplay}
            </Text>
          </View>
        )}

        <Button
          title="সিরিয়াল নিন"
          onPress={onBookPress}
          variant="primary"
          size="sm"
          icon="calendar-outline"
          fullWidth
          style={styles.button}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  colorBar: { height: 4 },
  content: { padding: spacing.md, alignItems: 'center' },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    minHeight: 38,
  },
  specialty: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    color: '#9c2a7e',
    textAlign: 'center',
    marginBottom: 4,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  deptDot: { width: 6, height: 6, borderRadius: 3 },
  deptText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  timeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.warningDark,
  },
  button: { marginTop: spacing.xs },
});