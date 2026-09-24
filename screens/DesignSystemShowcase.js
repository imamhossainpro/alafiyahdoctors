// src/screens/DesignSystemShowcase.js
// ==================================================
// 🎨 Design System Showcase — Temporary test screen
// ==================================================
// সব components preview করার জন্য
// পরে delete করা যাবে
// ==================================================

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  Card,
  SectionHeader,
  Input,
  StatusBadge,
  EmptyState,
  LoadingState,
  ErrorState,
  BottomSheet,
  SearchBar,
} from '../components/ui';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';


export default function DesignSystemShowcase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>🎨 Design System</Text>
        <Text style={styles.pageSubtitle}>
          সব UI components — Phase 1 Preview
        </Text>

        {/* ============================================
            Typography
            ============================================ */}
        <SectionHeader title="Typography" icon="text-outline" />
        <Card padding="lg">
          <Text style={typography.h1}>H1 Heading</Text>
          <Text style={typography.h2}>H2 Heading</Text>
          <Text style={typography.h3}>H3 Heading</Text>
          <Text style={typography.h4}>H4 Heading</Text>
          <Text style={[typography.body, { marginTop: 8 }]}>
            Body text — বাংলা লেখা এখানে দেখা যাবে
          </Text>
          <Text style={typography.bodySmall}>Body Small</Text>
          <Text style={typography.caption}>Caption</Text>
        </Card>

        {/* ============================================
            Buttons
            ============================================ */}
        <SectionHeader title="Buttons" icon="radio-button-on-outline" />
        <Card padding="lg" style={{ gap: 12 }}>
          <Button title="সিরিয়াল নিন" onPress={() => {}} variant="primary" />
          <Button title="বিস্তারিত দেখুন" onPress={() => {}} variant="secondary" />
          <Button title="রিপোর্ট দেখুন" onPress={() => {}} variant="outline" />
          <Button title="বাতিল করুন" onPress={() => {}} variant="danger" />
          <Button
            title="Loading..."
            onPress={() => {}}
            variant="primary"
            loading
          />
          <Button
            title="Disabled"
            onPress={() => {}}
            variant="primary"
            disabled
          />
          <View style={styles.iconButtonRow}>
            <IconButton icon="add" variant="primary" />
            <IconButton icon="pencil" variant="secondary" />
            <IconButton icon="trash" variant="outline" />
            <IconButton icon="close" variant="ghost" />
          </View>
        </Card>

        {/* ============================================
            Status Badges
            ============================================ */}
        <SectionHeader title="Status Badges" icon="pricetag-outline" />
        <Card padding="lg" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <StatusBadge status="pending" />
          <StatusBadge status="confirmed" />
          <StatusBadge status="checked-in" />
          <StatusBadge status="completed" />
          <StatusBadge status="cancelled" />
          <StatusBadge status="no-show" />
          <StatusBadge status="new" />
          <StatusBadge status="report" />
          <StatusBadge status="followup" />
          <StatusBadge status="admin" />
          <StatusBadge status="editor" />
          <StatusBadge status="viewer" />
        </Card>

        {/* ============================================
            Inputs
            ============================================ */}
        <SectionHeader title="Input Fields" icon="create-outline" />
        <Card padding="lg">
          <Input
            label="ইমেইল"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            icon="mail-outline"
            keyboardType="email-address"
            required
          />
          <Input
            label="পাসওয়ার্ড"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            icon="lock-closed-outline"
            secureTextEntry
            required
          />
          <Input
            label="ভুল ইনপুট"
            value=""
            onChangeText={() => {}}
            placeholder="Error example"
            icon="alert-circle-outline"
            error="এই ফিল্ডটি সঠিক নয়"
          />
        </Card>

        {/* ============================================
            Search Bar
            ============================================ */}
        <SectionHeader title="Search Bar" icon="search-outline" />
        <Card padding="lg">
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="ডাক্তার খুঁজুন..."
          />
        </Card>

        {/* ============================================
            Cards
            ============================================ */}
        <SectionHeader title="Cards" icon="albums-outline" />
        <View style={{ gap: 12 }}>
          <Card variant="default" padding="lg">
            <Text style={typography.h4}>Default Card</Text>
            <Text style={[typography.bodySmall, { marginTop: 4 }]}>
              Subtle shadow সহ কার্ড
            </Text>
          </Card>
          <Card variant="elevated" padding="lg">
            <Text style={typography.h4}>Elevated Card</Text>
            <Text style={[typography.bodySmall, { marginTop: 4 }]}>
              বেশি shadow
            </Text>
          </Card>
          <Card variant="outline" padding="lg">
            <Text style={typography.h4}>Outline Card</Text>
            <Text style={[typography.bodySmall, { marginTop: 4 }]}>
              Border সহ
            </Text>
          </Card>
        </View>

        {/* ============================================
            Section Header (again)
            ============================================ */}
        <SectionHeader
          title="Section with Action"
          subtitle="Action button সহ"
          icon="layers-outline"
          actionLabel="সব দেখুন"
          actionIcon="arrow-forward"
          onAction={() => {}}
        />

        {/* ============================================
            Bottom Sheet
            ============================================ */}
        <SectionHeader title="Bottom Sheet" icon="square-outline" />
        <Card padding="lg">
          <Button
            title="Bottom Sheet খুলুন"
            onPress={() => setBottomSheetVisible(true)}
            icon="chevron-up"
            variant="primary"
          />
        </Card>

        {/* ============================================
            States
            ============================================ */}
        <SectionHeader title="Empty State" icon="file-tray-outline" />
        <Card variant="outline" padding="none">
          <EmptyState
            icon="calendar-outline"
            title="কোনো বুকিং নেই"
            message="নতুন বুকিং করলে এখানে দেখা যাবে"
            actionLabel="নতুন বুকিং"
            onAction={() => {}}
          />
        </Card>

        <SectionHeader title="Error State" icon="warning-outline" />
        <Card variant="outline" padding="none">
          <ErrorState
            title="ডেটা লোড করা যায়নি"
            message="ইন্টারনেট সংযোগ চেক করুন"
            onRetry={() => {}}
          />
        </Card>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        title="উদাহরণ Bottom Sheet"
      >
        <Text style={typography.body}>
          এটি একটি reusable Bottom Sheet component।
        </Text>
        <Text style={[typography.bodySmall, { marginTop: 8, color: colors.textSecondary }]}>
          Modal-এর ভেতরে যেকোনো content রাখা যাবে।
        </Text>
        <Button
          title="ঠিক আছে"
          onPress={() => setBottomSheetVisible(false)}
          variant="primary"
          fullWidth
          style={{ marginTop: spacing.lg }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  iconButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});