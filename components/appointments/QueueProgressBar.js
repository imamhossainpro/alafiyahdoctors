// components/appointments/QueueProgressBar.js
// ==================================================
// 📊 QueueProgressBar — 4-step progress indicator
// ==================================================
// Booked → Waiting → Consulting → Completed
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

const STEPS = [
  { key: 'booked',     label: 'বুক',     icon: 'checkmark-circle-outline' },
  { key: 'waiting',    label: 'অপেক্ষা', icon: 'time-outline' },
  { key: 'consulting', label: 'চিকিৎসা', icon: 'medkit-outline' },
  { key: 'completed',  label: 'সম্পন্ন', icon: 'checkmark-done-outline' },
];

// ✅ Status → step index mapping
const STATUS_TO_STEP = {
  booked: 0,
  waiting: 1,
  consulting: 2,
  completed: 3,
};

export default function QueueProgressBar({ status = 'booked', style }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;

  // Cancelled — don't show progress
  if (status === 'cancelled') {
    return (
      <View style={[styles.cancelledBox, style]}>
        <Ionicons name="close-circle" size={18} color={colors.error} />
        <Text style={styles.cancelledText}>সিরিয়াল বাতিল হয়েছে</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Progress line background */}
      <View style={styles.lineBackground} />

      {/* Progress line filled */}
      <View
        style={[
          styles.lineFilled,
          {
            width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
          },
        ]}
      />

      {/* Steps */}
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <View key={step.key} style={styles.stepWrap}>
              <View
                style={[
                  styles.stepCircle,
                  isDone && styles.stepCircleDone,
                  isActive && styles.stepCircleActive,
                ]}
              >
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={
                    isDone || isActive ? colors.white : colors.textTertiary
                  }
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isDone || isActive) && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  lineBackground: {
    position: 'absolute',
    top: spacing.sm + 14,     // aligned with circle center
    left: '12.5%',
    right: '12.5%',
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  lineFilled: {
    position: 'absolute',
    top: spacing.sm + 14,
    left: '12.5%',
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stepLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10.5,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  cancelledText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.errorDark,
  },
});