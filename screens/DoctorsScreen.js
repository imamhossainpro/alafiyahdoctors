// screens/DoctorsScreen.js
// ==================================================
// 👨‍⚕️ DoctorsScreen — Doctor Discovery (Fixed)
// ==================================================
// ✅ Functional filter button
// ✅ Header + Search + Skeleton
// ==================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const todayDay = useMemo(() => getTodayBanglaDay(), []);
  const [selectedDay, setSelectedDay] = useState(todayDay);

  // ✅ Advanced filters
  const [filterAvailableToday, setFilterAvailableToday] = useState(false);
  const [filterInChamber, setFilterInChamber] = useState(false);

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

    // ✅ Available today filter
    if (filterAvailableToday) {
      doctors = doctors.filter((d) =>
        isDoctorAvailableOnDay(d.id, todayDay, panels)
      );
    }

    return doctors;
  }, [
    departments,
    panels,
    searchTerm,
    selectedDepartment,
    selectedDay,
    todayDay,
    filterAvailableToday,
  ]);

  const handleBookDoctor = (doctor) => {
    navigation.navigate('Booking', { preselectedDoctor: doctor });
  };

  const handleViewDetails = (doctor) => {
    navigation.navigate('DoctorDetails', { doctorId: doctor.id });
  };

  // ✅ Filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedDepartment !== 'all') count++;
    if (selectedDay !== todayDay) count++;
    if (filterAvailableToday) count++;
    return count;
  }, [searchTerm, selectedDepartment, selectedDay, todayDay, filterAvailableToday]);

  const toBangla = (num) => {
    const bangla = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (d) => bangla[d]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedDay(todayDay);
    setFilterAvailableToday(false);
    setFilterInChamber(false);
  };

  // ==================================================
  // Loading Skeleton
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
  // Render
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

          {/* SEARCH ROW */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBarWrapper}>
              <SearchBar
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="ডাক্তার, বিশেষজ্ঞতা বা বিভাগ খুঁজুন"
              />
            </View>

            {/* ✅ FUNCTIONAL Filter Icon */}
            <TouchableOpacity
              style={[
                styles.filterIconBtn,
                activeFilterCount > 0 && styles.filterIconBtnActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={
                  activeFilterCount > 0 ? colors.white : colors.primary
                }
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
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
            <TouchableOpacity
              style={styles.filterBadge}
              onPress={clearAllFilters}
              activeOpacity={0.7}
            >
              <Ionicons
                name="funnel-outline"
                size={12}
                color={colors.primary}
              />
              <Text style={styles.filterBadgeText}>
                ফিল্টার ({toBangla(activeFilterCount)})
              </Text>
              <Ionicons
                name="close-circle"
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
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

      {/* ==========================================
          ✅ FILTER MODAL
          ========================================== */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ফিল্টার</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalSectionTitle}>দ্রুত ফিল্টার</Text>

              {/* Available today */}
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setFilterAvailableToday(!filterAvailableToday)}
                activeOpacity={0.7}
              >
                <View style={styles.filterOptionLeft}>
                  <View
                    style={[
                      styles.filterOptionIcon,
                      { backgroundColor: colors.successLight },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={colors.successDark}
                    />
                  </View>
                  <Text style={styles.filterOptionLabel}>
                    শুধু আজ উপলব্ধ ডাক্তার
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    filterAvailableToday && styles.toggleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      filterAvailableToday && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* In chamber */}
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setFilterInChamber(!filterInChamber)}
                activeOpacity={0.7}
              >
                <View style={styles.filterOptionLeft}>
                  <View
                    style={[
                      styles.filterOptionIcon,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Ionicons
                      name="pulse-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.filterOptionLabel}>
                    এখন চেম্বারে আছেন
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    filterInChamber && styles.toggleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      filterInChamber && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  clearAllFilters();
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearBtnText}>সব রিসেট</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>
                  প্রয়োগ করুন ({toBangla(filteredDoctors.length)})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },

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
  headerTextWrap: { flex: 1, paddingRight: spacing.md },
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
  searchBarWrapper: { flex: 1, minWidth: 0 },
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
    position: 'relative',
  },
  filterIconBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  filterCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  filterCountText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    color: colors.white,
  },

  // RESULT
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
  listWrap: { paddingHorizontal: spacing.lg },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: { flex: 1 },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalSectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  filterOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14.5,
    color: colors.textPrimary,
    flex: 1,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    color: colors.white,
  },
});