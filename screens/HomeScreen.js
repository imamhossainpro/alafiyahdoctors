// screens/HomeScreen.js
// ==================================================
// 🏠 HomeScreen — Patient Home Dashboard
// ==================================================
// ✅ Bell icon notification badge (real-time unread count)
// ==================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';

import {
  findUpcomingAppointments,
  findUserAppointments,
} from '../services/userAppointmentsService';
import { loadDepartments, loadPanels } from '../services/dataService';
import { subscribeToUnreadCount } from '../services/inAppNotificationService';

import GreetingHeader from '../components/home/GreetingHeader';
import HomeCarousel from '../components/home/HomeCarousel';
import QuickActions from '../components/home/QuickActions';
import UpcomingAppointmentCard from '../components/home/UpcomingAppointmentCard';
import PhoneRequiredCard from '../components/home/PhoneRequiredCard';
import HealthTipsSection from '../components/home/HealthTipsSection';
import SearchBar from '../components/ui/SearchBar';
import SectionHeader from '../components/ui/SectionHeader';
import DoctorCompactCard from '../components/ui/DoctorCompactCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

// ==================================================
// ✅ Helper — Bengali day name
// ==================================================
const BANGLA_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const getTodayBanglaDay = () => BANGLA_DAYS[new Date().getDay()];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { hospitalId } = useHospital();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todayDoctors, setTodayDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Real-time unread notification count
  const [unreadCount, setUnreadCount] = useState(0);

  // ==================================================
  // ✅ Load Home data
  // ==================================================
  const loadHomeData = useCallback(async () => {
    if (!hospitalId || !user) return;

    try {
      const upcoming = await findUpcomingAppointments(hospitalId, user);
      setUpcomingAppointments(upcoming || []);

      const [departments, panels] = await Promise.all([
        loadDepartments(hospitalId),
        loadPanels(hospitalId),
      ]);

      const todayName = getTodayBanglaDay();
      const todayPanel = panels.find(
        (p) => p.name === todayName || p.id === todayName
      );

      if (todayPanel && Array.isArray(todayPanel.activeDoctorIds)) {
        const activeIds = new Set(todayPanel.activeDoctorIds);
        const docs = [];

        departments.forEach((dept) => {
          (dept.doctors || []).forEach((doc) => {
            if (activeIds.has(doc.id)) {
              docs.push({
                ...doc,
                deptId: dept.id,
                deptName: dept.name,
                deptColor: dept.color,
              });
            }
          });
        });

        setTodayDoctors(docs);
      } else {
        setTodayDoctors([]);
      }
    } catch (err) {
      console.error('❌ Home load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, user]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  // ==================================================
  // ✅ Real-time unread notification count (Bell badge)
  // ==================================================
  useEffect(() => {
    if (!hospitalId || !user?.uid) return;

    const unsub = subscribeToUnreadCount(
      hospitalId,
      user.uid,
      (count) => setUnreadCount(count),
      (err) => console.warn('Unread count error:', err)
    );

    return () => unsub();
  }, [hospitalId, user?.uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleQuickAction = (actionKey) => {
    switch (actionKey) {
      case 'doctors':
        navigation.navigate('Doctors');
        break;
      case 'booking':
        navigation.navigate('Bookings');
        break;
      case 'reports':
        navigation.navigate('Reports');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const handleBookDoctor = (doctor) => {
    navigation.navigate('Booking', {
      preselectedDoctor: doctor,
    });
  };

  if (loading) {
    return <LoadingState message="লোড হচ্ছে..." />;
  }

  const filteredDoctors = searchTerm.trim()
    ? todayDoctors.filter((d) => {
        const term = searchTerm.toLowerCase();
        return (
          (d.name || '').toLowerCase().includes(term) ||
          (d.specialty || '').toLowerCase().includes(term) ||
          (d.deptName || '').toLowerCase().includes(term)
        );
      })
    : todayDoctors;

  const hasUpcoming = upcomingAppointments.length > 0;
  const hasPhone = user?.phone || user?.phoneNormalized;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Greeting + Bell with badge */}
        <GreetingHeader
          userName={user?.name}
          onNotificationPress={() => navigation.navigate('Notifications')}
          notificationCount={unreadCount}
        />

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="ডাক্তার, বিভাগ বা সেবা খুঁজুন"
          />
        </View>

        {/* Carousel */}
        <HomeCarousel navigation={navigation} />

        {/* Quick Actions */}
        <View style={styles.sectionWrap}>
          <QuickActions onAction={handleQuickAction} />
        </View>

        {/* Upcoming Appointments */}
        {hasUpcoming ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderWrap}>
              <View style={styles.upcomingHeaderRow}>
                <View style={styles.upcomingTitleWrap}>
                  <View style={styles.upcomingHeaderDot} />
                  <Text style={styles.upcomingHeaderTitle}>
                    আপনার আসন্ন সিরিয়াল
                  </Text>
                </View>
                <View style={styles.upcomingCountBadge}>
                  <Text style={styles.upcomingCountText}>
                    {upcomingAppointments.length}টি
                  </Text>
                </View>
              </View>
            </View>

            {upcomingAppointments.map((appointment) => (
              <UpcomingAppointmentCard
                key={appointment.id}
                appointment={appointment}
                onViewPress={() => navigation.navigate('Bookings')}
                style={styles.upcomingCard}
              />
            ))}
          </View>
        ) : !hasPhone ? (
          <View style={styles.sectionWrap}>
            <PhoneRequiredCard
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>
        ) : (
          <View style={styles.sectionWrap}>
            <EmptyState
              icon="calendar-outline"
              title="আপনার কোনো upcoming সিরিয়াল নেই"
              message="নতুন সিরিয়াল নিতে নিচের বাটনে ক্লিক করুন"
              actionLabel="ডাক্তার দেখুন"
              onAction={() => navigation.navigate('Doctors')}
              actionIcon="medkit-outline"
            />
          </View>
        )}

        {/* Today's Doctors */}
        {filteredDoctors.length > 0 && (
          <View style={styles.todayDoctorsSection}>
            <View style={styles.sectionHeaderWrap}>
              <SectionHeader
                title="আজকের ডাক্তার"
                subtitle={`${getTodayBanglaDay()} · ${filteredDoctors.length} জন`}
                icon="medkit-outline"
                actionLabel="সব দেখুন"
                actionIcon="arrow-forward"
                onAction={() => navigation.navigate('Doctors')}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {filteredDoctors.map((doc) => (
                <DoctorCompactCard
                  key={doc.id}
                  doctor={doc}
                  onBookPress={() => handleBookDoctor(doc)}
                  onPress={() => handleBookDoctor(doc)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Health Tips */}
        <HealthTipsSection hospitalId={hospitalId} />

        <View style={{ height: spacing.huge }} />
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  todayDoctorsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  upcomingTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upcomingHeaderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  upcomingHeaderTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  upcomingCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  upcomingCountText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primary,
  },
  upcomingCard: {
    marginBottom: spacing.md,
  },
  horizontalList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});