// components/ui/SkeletonScreens.js
// ==================================================
// 🎯 Screen-specific Skeleton Layouts
// ==================================================
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from './Skeleton';

// ==================================================
// ✅ Preview Screen Skeleton
// (ডাক্তার প্যানেল লোড হওয়ার সময়)
// ==================================================
export function PreviewSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <Skeleton width={280} height={32} borderRadius={6} />
      </View>

      {/* ৩টি Department Card */}
      {[0, 1, 2].map((deptIndex) => (
        <View key={deptIndex} style={styles.deptCard}>
          {/* Department Header */}
          <View style={styles.deptHeader}>
            <Skeleton width={40} height={40} borderRadius={10} />
            <Skeleton
              width={180}
              height={28}
              borderRadius={6}
              style={{ marginLeft: -10 }}
            />
          </View>

          {/* Doctor Entries (২টি করে) */}
          {[0, 1].map((docIndex) => (
            <View key={docIndex} style={styles.doctorEntry}>
              {/* Doctor Name */}
              <Skeleton width={220} height={26} borderRadius={6} style={{ marginBottom: 8 }} />
              
              {/* Qualifications */}
              <Skeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 5 }} />
              <Skeleton width="75%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              
              {/* Specialty */}
              <Skeleton width={180} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
              
              {/* Time Slot Badge */}
              <Skeleton width={200} height={26} borderRadius={14} />
            </View>
          ))}
        </View>
      ))}

      {/* Footer Skeleton */}
      <View style={styles.footerSkeleton}>
        <Skeleton width={200} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width={150} height={20} borderRadius={6} />
      </View>
    </ScrollView>
  );
}

// ==================================================
// ✅ Generic List Skeleton
// ==================================================
export function ListSkeleton({ rows = 5 }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          <Skeleton width={50} height={50} circle />
          <View style={styles.listContent}>
            <Skeleton width="60%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ==================================================
// ✅ Styles
// ==================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  contentContainer: {
    paddingBottom: 30,
  },

  // Header
  headerSkeleton: {
    backgroundColor: '#1c5fa8',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
  },

  // Department Card
  deptCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  deptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorEntry: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e9edf2',
    marginBottom: 20,
  },

  // List
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  listContent: {
    marginLeft: 12,
    flex: 1,
  },

  // Footer
  footerSkeleton: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 12,
  },
});