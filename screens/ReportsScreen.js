// screens/ReportsScreen.js
// ==================================================
// 📄 ReportsScreen — Simple report access
// ==================================================
// Simple CTA screen: বাটনে ক্লিক → External Report Portal
// (No Firebase reports collection, no admin upload)
// ==================================================
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export default function ReportsScreen({ navigation }) {
  const handleOpenReports = () => {
    navigation.navigate('OnlineReport');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>আমার রিপোর্ট</Text>
          <Text style={styles.headerSubtitle}>
            ডাক্তারি রিপোর্ট ও পরীক্ষার ফলাফল দেখুন
          </Text>
        </View>

        {/* Main CTA Card */}
        <View style={styles.ctaWrap}>
          <View style={styles.ctaCard}>
            {/* Icon */}
            <View style={styles.iconBox}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.primary}
              />
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>অনলাইন রিপোর্ট</Text>

            {/* Message */}
            <Text style={styles.cardMessage}>
              আপনার সব রিপোর্ট দেখতে ও ডাউনলোড করতে নিচের বাটনে ক্লিক করুন
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={handleOpenReports}
              activeOpacity={0.85}
              style={styles.ctaButton}
            >
              <Ionicons name="open-outline" size={20} color={colors.white} />
              <Text style={styles.ctaButtonText}>রিপোর্ট দেখুন</Text>
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.infoDark}
              />
              <Text style={styles.infoText}>
                রিপোর্ট সিস্টেম হাসপাতালের অনলাইন পোর্টালে খুলবে। ইন্টারনেট
                সংযোগ প্রয়োজন।
              </Text>
            </View>
          </View>

          {/* Helpful Hint */}
          <View style={styles.hintWrap}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color={colors.textTertiary}
            />
            <Text style={styles.hintText}>
              রিপোর্ট ডাউনলোড করতে Internet connection সক্রিয় আছে কিনা নিশ্চিত
              করুন।
            </Text>
          </View>

          {/* How-to steps */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>কীভাবে রিপোর্ট দেখবেন</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>১</Text>
              </View>
              <Text style={styles.stepText}>
                উপরের বাটনে ক্লিক করুন
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>২</Text>
              </View>
              <Text style={styles.stepText}>
                রোগীর মোবাইল নম্বর ও ID দিন
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>৩</Text>
              </View>
              <Text style={styles.stepText}>
                রিপোর্ট দেখুন ও ডাউনলোড করুন
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // CTA Card
  ctaWrap: {
    padding: spacing.lg,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardMessage: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },

  // Info
  infoCard: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: colors.infoDark,
    lineHeight: 19,
  },

  // Hint
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  hintText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },

  // Steps
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  stepsTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});