// screens/DoctorsScreen.js
// ==================================================
// 👨‍⚕️ DoctorsScreen — Doctor Discovery
// ==================================================
// ✅ Time filter বাদ
// ✅ আজকের দিন auto-select
// ✅ "শুধু আজ উপলব্ধ" toggle বাদ
// ✅ আজকের দিনের info text
// ==================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useHospital } from '../context/HospitalContext';
import { loadDepartments, loadPanels } from '../services/dataService';

import SearchBar from '../components/ui/SearchBar';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import AppText from '../components/ui/AppText';
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

export default function DoctorsScreen({ navigation }) {
  const { hospitalId } = useHospital();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // ✅ আজকের দিন auto-select
  const todayDay = useMemo(() => getTodayBanglaDay(), []);
  const [selectedDay, setSelectedDay] = useState(todayDay);

  // ==================================================
  // ✅ Load data
  // ==================================================
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

  // ==================================================
  // ✅ Filtered doctors
  // ==================================================
  const filteredDoctors = useMemo(() => {
    let doctors = flattenDoctors(departments);

    // Department filter
    if (selectedDepartment !== 'all') {
      doctors = doctors.filter((d) => d.deptId === selectedDepartment);
    }

    // Search filter
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

    // ✅ Day filter
    if (selectedDay !== 'all') {
      doctors = doctors.filter((d) =>
        isDoctorAvailableOnDay(d.id, selectedDay, panels)
      );
    }

    return doctors;
  }, [
    departments,
    panels,
    searchTerm,
    selectedDepartment,
    selectedDay,
  ]);

  // ==================================================
  // ✅ Navigate handlers
  // ==================================================
  const handleBookDoctor = (doctor) => {
    navigation.navigate('Booking', {
      preselectedDoctor: doctor,
    });
  };

  const handleViewDetails = (doctor) => {
    navigation.navigate('DoctorDetails', {
      doctorId: doctor.id,
    });
  };

  // ==================================================
  // Loading
  // ==================================================
  if (loading) {
    return <LoadingState message="ডাক্তার লোড হচ্ছে..." />;
  }

  // ==================================================
  // Render
  // ==================================================
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h2" color="textInverse">
          ডাক্তার খুঁজুন
        </AppText>
        <AppText variant="bodySmall" color="textInverse" style={styles.headerSub}>
          আপনার প্রয়োজন অনুযায়ী ডাক্তার খুঁজুন ও সিরিয়াল নিন
        </AppText>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="ডাক্তারের নাম লিখুন"
        />
      </View>

      {/* Filters */}
      <DoctorFilterBar
        departments={departments}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        todayDayName={todayDay}
      />

      {/* Results */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Result count */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredDoctors.length} জন ডাক্তার
          </Text>
          {(searchTerm ||
            selectedDepartment !== 'all' ||
            selectedDay !== 'all') && (
            <Text style={styles.filteredText}>ফিল্টার প্রয়োগ করা হয়েছে</Text>
          )}
        </View>

        {/* List */}
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

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerSub: { marginTop: 4, opacity: 0.9 },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  listContainer: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  countText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  filteredText: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
});