// components/ui/SkeletonScreens.js
// ==================================================
// 🎯 Screen-specific Skeleton Layouts
// ==================================================
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Skeleton from './Skeleton';

// ==================================================
// ✅ Preview Screen Skeleton
// ==================================================
export function PreviewSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSkeleton}>
        <Skeleton width={280} height={32} borderRadius={6} />
      </View>

      {[0, 1, 2].map((deptIndex) => (
        <View key={deptIndex} style={styles.deptCard}>
          <View style={styles.deptHeader}>
            <Skeleton width={40} height={40} borderRadius={10} />
            <Skeleton
              width={180}
              height={28}
              borderRadius={6}
              style={{ marginLeft: -10 }}
            />
          </View>

          {[0, 1].map((docIndex) => (
            <View key={docIndex} style={styles.doctorEntry}>
              <Skeleton width={220} height={26} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width="85%" height={14} borderRadius={4} style={{ marginBottom: 5 }} />
              <Skeleton width="75%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={180} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width={200} height={26} borderRadius={14} />
            </View>
          ))}
        </View>
      ))}

      <View style={styles.footerSkeleton}>
        <Skeleton width={200} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
        <Skeleton width={150} height={20} borderRadius={6} />
      </View>
    </ScrollView>
  );
}

// ==================================================
// ✅ Doctor List Skeleton (DoctorsScreen-এর জন্য) — নতুন
// ==================================================
export function DoctorListSkeleton({ count = 4 }) {
  return (
    <ScrollView
      style={styles.doctorListContainer}
      contentContainerStyle={styles.doctorListContent}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.doctorCard}>
          {/* Header Row: Avatar + Name + Specialty */}
          <View style={styles.doctorHeader}>
            <Skeleton width={64} height={64} circle />
            <View style={styles.doctorHeaderText}>
              <Skeleton
                width="75%"
                height={18}
                borderRadius={6}
                style={{ marginBottom: 8 }}
              />
              <Skeleton
                width="90%"
                height={13}
                borderRadius={4}
                style={{ marginBottom: 5 }}
              />
              <Skeleton width="60%" height={13} borderRadius={4} />
            </View>
          </View>

          {/* Dept Badge */}
          <Skeleton
            width={130}
            height={24}
            borderRadius={20}
            style={{ marginBottom: 12 }}
          />

          {/* Workplace */}
          <Skeleton
            width="85%"
            height={13}
            borderRadius={4}
            style={{ marginBottom: 12 }}
          />

          {/* Status Pill */}
          <Skeleton
            width={150}
            height={26}
            borderRadius={20}
            style={{ marginBottom: 14 }}
          />

          {/* Buttons */}
          <View style={styles.doctorButtons}>
            <Skeleton width="45%" height={38} borderRadius={10} />
            <Skeleton width="50%" height={38} borderRadius={10} />
          </View>
        </View>
      ))}
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

  // Generic List
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

  // ✅ Doctor List Skeleton (নতুন)
  doctorListContainer: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  doctorListContent: {
    padding: 16,
    paddingTop: 8,
  },
  doctorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  doctorHeaderText: {
    flex: 1,
    paddingTop: 4,
  },
  doctorButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});