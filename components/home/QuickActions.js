// components/home/QuickActions.js
// ==================================================
// ⚡ QuickActions — Grid of primary actions
// ==================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';

const ACTIONS = [
  { key: 'doctors', icon: 'medkit-outline', label: 'ডাক্তার', color: '#1c5fa8', bgColor: '#e6f0fa' },
  { key: 'booking', icon: 'calendar-outline', label: 'সিরিয়াল', color: '#0d9488', bgColor: '#f0fdfa' },
  { key: 'reports', icon: 'document-text-outline', label: 'রিপোর্ট', color: '#d97706', bgColor: '#fef3c7' },
  { key: 'profile', icon: 'person-outline', label: 'প্রোফাইল', color: '#7c3aed', bgColor: '#ede9fe' },
];

export default function QuickActions({ onAction, style }) {
  return (
    <View style={[styles.grid, style]}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.key}
          onPress={() => onAction?.(action.key)}
          activeOpacity={0.75}
          style={styles.item}
        >
          <View style={[styles.iconBox, { backgroundColor: action.bgColor }]}>
            <Ionicons name={action.icon} size={26} color={action.color} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    ...shadows.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});