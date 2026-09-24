// components/ui/ReportCard.js
// ==================================================
// 📄 ReportCard — Report / document card with download action
// ==================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import Button from './Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function ReportCard({
  title,
  subtitle,
  date,
  type,                     // 'pdf' | 'image' | 'text'
  status,                   // 'ready' | 'processing' | 'failed'
  onView,
  onDownload,
  style,
}) {
  const iconMap = {
    pdf: { name: 'document-text-outline', color: colors.error },
    image: { name: 'image-outline', color: colors.accent },
    text: { name: 'document-outline', color: colors.primary },
  };

  const statusMap = {
    ready: { text: 'প্রস্তুত', bg: colors.successLight, color: colors.successDark },
    processing: { text: 'প্রসেসিং', bg: colors.warningLight, color: colors.warningDark },
    failed: { text: 'ব্যর্থ', bg: colors.errorLight, color: colors.errorDark },
  };

  const icon = iconMap[type] || iconMap.pdf;
  const statusInfo = statusMap[status] || statusMap.ready;

  return (
    <Card variant="default" padding="lg" style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'রিপোর্ট'}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {status && (
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        )}
      </View>

      {date && (
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {onView && (
          <Button
            title="দেখুন"
            onPress={onView}
            variant="outline"
            size="sm"
            icon="eye-outline"
            style={styles.actionButton}
          />
        )}
        {onDownload && (
          <Button
            title="ডাউনলোড"
            onPress={onDownload}
            variant="primary"
            size="sm"
            icon="download-outline"
            style={styles.actionButton}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  dateText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionButton: {
    flex: 1,
  },
});