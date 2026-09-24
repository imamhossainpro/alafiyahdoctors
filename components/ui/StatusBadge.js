// components/ui/StatusBadge.js
// ==================================================
// 🏷️ StatusBadge — Status pill for appointments / roles
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

const PRESETS = {
  // ==========================================
  // Phase 5 — Queue Tracking Statuses
  // ==========================================
  booked: { bg: colors.infoLight, text: colors.infoDark, label: 'বুক করা হয়েছে' },
  waiting: { bg: colors.warningLight, text: colors.warningDark, label: 'অপেক্ষমাণ' },
  consulting: { bg: '#ede9fe', text: '#6d28d9', label: 'চিকিৎসা চলছে' },

  // ==========================================
  // Existing Appointment Statuses
  // ==========================================
  pending: { bg: colors.warningLight, text: colors.warningDark, label: 'অপেক্ষমাণ' },
  confirmed: { bg: colors.infoLight, text: colors.infoDark, label: 'নিশ্চিত' },
  'checked-in': { bg: '#ede9fe', text: '#6d28d9', label: 'চেক-ইন' },
  completed: { bg: colors.successLight, text: colors.successDark, label: 'সম্পন্ন' },
  cancelled: { bg: colors.errorLight, text: colors.errorDark, label: 'বাতিল' },
  'no-show': { bg: colors.surfaceMuted, text: colors.textSecondary, label: 'অনুপস্থিত' },
  archived: { bg: colors.surfaceMuted, text: colors.textSecondary, label: 'আর্কাইভ' },

  // ==========================================
  // Patient Types
  // ==========================================
  new: { bg: colors.successLight, text: colors.successDark, label: 'নতুন' },
  report: { bg: colors.warningLight, text: colors.warningDark, label: 'রিপোর্ট' },
  followup: { bg: colors.infoLight, text: colors.infoDark, label: 'ফলোআপ' },

  // ==========================================
  // Roles
  // ==========================================
  admin: { bg: colors.infoLight, text: colors.infoDark, label: 'Admin' },
  'sub-admin': { bg: '#ede9fe', text: '#6d28d9', label: 'Sub-Admin' },
  editor: { bg: colors.accentLight, text: colors.accentDark, label: 'Editor' },
  viewer: { bg: colors.surfaceMuted, text: colors.textSecondary, label: 'Viewer' },
};

// ✅ Helper: Convert appointment status → queue status
export const getQueueStatusFromAppointment = (appointment) => {
  if (!appointment) return 'booked';
  const status = (appointment.status || '').toLowerCase();

  if (status === 'cancelled' || status === 'no-show') return 'cancelled';
  if (status === 'completed') return 'completed';
  if (status === 'checked-in') return 'consulting';
  if (status === 'confirmed') return 'waiting';
  if (status === 'pending') return 'booked';

  return 'booked';
};

export default function StatusBadge({
  status,
  label,
  bgColor,
  textColor,
  size = 'md',
  style,
}) {
  const preset = PRESETS[status] || null;

  const finalLabel = label || preset?.label || status || '—';
  const finalBg = bgColor || preset?.bg || colors.surfaceMuted;
  const finalColor = textColor || preset?.text || colors.textSecondary;

  const sizeStyle = {
    sm: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 11 },
    md: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12 },
    lg: { paddingHorizontal: 14, paddingVertical: 6, fontSize: 13 },
  }[size];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: finalBg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: finalColor,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {finalLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fontFamily.semiBold,
  },
});