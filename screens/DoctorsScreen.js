// screens/DoctorsScreen.js
// ==================================================
// 👨‍⚕️ DoctorsScreen — Doctor Discovery (Redesigned)
// ==================================================
// ✅ Header + Search + Filter icon (fixed)
// ✅ Skeleton loading
// ✅ Filter indicator
// ✅ Firebase data অপরিবর্তিত
// ==================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useHospital } from '../context/HospitalContext';
import { loadDepartments, loadPanels } from '../services/dataService';

import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import { DoctorListSkeleton } from '../components/ui/SkeletonScreens';
import DoctorDiscoveryCard from '../components/doctors/DoctorDiscoveryCard';
import DoctorFilterBar from '../components/doctors/DoctorFilterBar';
import {
  flattenDoctors,
  isDoctorAvailableOnDay,
  getTodayBanglaDay,
} from '../utils/doctorUtils';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export default function DoctorsScreen({ navigation }) {
  const { hospitalId } = useHospital();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const todayDay = useMemo(() => getTodayBanglaDay(), []);
  const [selectedDay, setSelectedDay] = useState(todayDay);

  // ✅ Load data
  const loadData = useCallback(async () => {
    if (!hospitalId) return;
    try {
      const [depts, pnls] = await Promise.all([
        loadDepartments(hospitalId),
        loadPanels(hospitalId),
      ]);
      setDepartments(depts);
      setPanels(pnls);
    } catch (err) {
      console.error('❌ Doctors load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ✅ Filtered doctors
  const filteredDoctors = useMemo(() => {
    let doctors = flattenDoctors(departments);

    if (selectedDepartment !== 'all') {
      doctors = doctors.filter((d) => d.deptId === selectedDepartment);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      doctors = doctors.filter((d) => {
        return (
          (d.name || '').toLowerCase().includes(term) ||
          (d.specialty || '').toLowerCase().includes(term) ||
          (d.quals || '').toLowerCase().includes(term) ||
          (d.workplace || '').toLowerCase().includes(term)
        );
      });
    }

    if (selectedDay !== 'all') {
      doctors = doctors.filter((d) =>
        isDoctorAvailableOnDay(d.id, selectedDay, panels)
      );
    }

    return doctors;
  }, [departments, panels, searchTerm, selectedDepartment, selectedDay]);

  const handleBookDoctor = (doctor) => {
    navigation.navigate('Booking', { preselectedDoctor: doctor });
  };

  const handleViewDetails = (doctor) => {
    navigation.navigate('DoctorDetails', { doctorId: doctor.id });
  };

  // ✅ Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedDepartment !== 'all') count++;
    if (selectedDay !== todayDay) count++;
    return count;
  }, [searchTerm, selectedDepartment, selectedDay, todayDay]);

  const toBangla = (num) => {
    const bangla = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bangla[d]);
  };

  // ==================================================
  // ✅ Loading Skeleton
  // ==================================================
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>ডাক্তার খুঁজুন</Text>
              <Text style={styles.headerSubtitle}>
                আপনার প্রয়োজন অনুযায়ী ডাক্তার খুঁজুন ও সিরিয়াল নিন
              </Text>
            </View>
          </View>
        </View>
        <DoctorListSkeleton count={4} />
      </SafeAreaView>
    );
  }

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>ডাক্তার খুঁজুন</Text>
              <Text style={styles.headerSubtitle}>
                আপনার প্রয়োজন অনুযায়ী ডাক্তার খুঁজুন ও সিরিয়াল নিন
              </Text>
            </View>

            <View style={styles.headerIconBox}>
              <Ionicons name="heart" size={18} color={colors.white} />
              <Text style={styles.headerIconText}>
                সুস্থ থাকুন{'\n'}নিরাপদ থাকুন
              </Text>
            </View>
          </View>

          {/* SEARCH ROW (fixed) */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBarWrapper}>
              <SearchBar
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="ডাক্তার, বিশেষজ্ঞতা বা বিভাগ খুঁজুন"
              />
            </View>

            <TouchableOpacity
              style={styles.filterIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTERS */}
        <DoctorFilterBar
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          todayDayName={todayDay}
        />

        {/* RESULT SUMMARY */}
        <View style={styles.resultRow}>
          <Text style={styles.resultCount}>
            {toBangla(filteredDoctors.length)} জন ডাক্তার
          </Text>

          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Ionicons
                name="funnel-outline"
                size={12}
                color={colors.primary}
              />
              <Text style={styles.filterBadgeText}>
                ফিল্টার প্রয়োগ করা হয়েছে ({toBangla(activeFilterCount)})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm('');
                  setSelectedDepartment('all');
                  setSelectedDay(todayDay);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* DOCTOR LIST */}
        <View style={styles.listWrap}>
          {filteredDoctors.length === 0 ? (
            <EmptyState
              icon="medkit-outline"
              title="কোনো ডাক্তার পাওয়া যায়নি"
              message="ফিল্টার পরিবর্তন করুন অথবা অন্য নাম দিয়ে খুঁজুন"
            />
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorDiscoveryCard
                key={doctor.id}
                doctor={doctor}
                panels={panels}
                onBookPress={() => handleBookDoctor(doctor)}
                onDetailsPress={() => handleViewDetails(doctor)}
              />
            ))
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // HEADER
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.white,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  headerIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  headerIconText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.white,
    lineHeight: 13,
  },

  // SEARCH
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  searchBarWrapper: {
    flex: 1,
    minWidth: 0,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    minWidth: 48,
    flexShrink: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },

  // RESULT ROW
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultCount: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  filterBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.primary,
  },

  // LIST
  listWrap: {
    paddingHorizontal: spacing.lg,
  },
});