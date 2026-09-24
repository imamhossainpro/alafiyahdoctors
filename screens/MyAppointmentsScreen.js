// screens/MyAppointmentsScreen.js
// ==================================================
// 📅 MyAppointmentsScreen — 3 states (Upcoming/Completed/Cancelled)
// ==================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { findUserAppointments } from '../services/userAppointmentsService';
import {
  cancelAppointmentByPatient,
  canPatientCancel,
} from '../services/appointmentActionsService';

import UpcomingAppointmentCard from '../components/appointments/UpcomingAppointmentCard';
import CompletedAppointmentCard from '../components/appointments/CompletedAppointmentCard';
import CancelledAppointmentCard from '../components/appointments/CancelledAppointmentCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import PhoneRequiredCard from '../components/home/PhoneRequiredCard';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';
import { radius } from '../theme/radius';

// ==================================================
// ✅ Tabs
// ==================================================
const TABS = [
  { key: 'upcoming', label: 'আসন্ন', icon: 'calendar-outline' },
  { key: 'completed', label: 'সম্পন্ন', icon: 'checkmark-circle-outline' },
  { key: 'cancelled', label: 'বাতিল', icon: 'close-circle-outline' },
];

export default function MyAppointmentsScreen({ navigation }) {
  const { user } = useAuth();
  const { hospitalId } = useHospital();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  // ==================================================
  // ✅ Load
  // ==================================================
  const loadData = useCallback(async () => {
    if (!hospitalId || !user) return;
    try {
      const all = await findUserAppointments(hospitalId, user);
      setAppointments(all);
    } catch (err) {
      console.error('❌ MyAppointments load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, user]);

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
  // ✅ Split by state
  // ==================================================
  const categorized = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const upcoming = [];
    const completed = [];
    const cancelled = [];

    appointments.forEach((appt) => {
      const status = (appt.status || '').toLowerCase();

      if (status === 'cancelled') {
        cancelled.push(appt);
      } else if (status === 'completed' || status === 'no-show') {
        completed.push(appt);
      } else if (
        ['pending', 'confirmed', 'checked-in'].includes(status) &&
        appt.bookingDate >= today
      ) {
        upcoming.push(appt);
      } else {
        // Past appointments (missed or stale) → completed history
        completed.push(appt);
      }
    });

    // Sort upcoming: date ascending
    upcoming.sort((a, b) =>
      (a.bookingDate || '').localeCompare(b.bookingDate || '')
    );

    // Sort completed/cancelled: date descending (recent first)
    completed.sort((a, b) =>
      (b.bookingDate || '').localeCompare(a.bookingDate || '')
    );
    cancelled.sort((a, b) =>
      (b.bookingDate || '').localeCompare(a.bookingDate || '')
    );

    return { upcoming, completed, cancelled };
  }, [appointments]);

  // ==================================================
  // ✅ Actions
  // ==================================================
  const handleViewAppointment = (appointment) => {
    navigation.navigate('AppointmentDetail', {
      appointmentId: appointment.id,
    });
  };

  const handleBookAgain = () => {
    // Per Phase 4 decision → go to Doctors tab (manual select)
    navigation.navigate('Doctors');
  };

  const handleCancel = (appointment) => {
    if (!canPatientCancel(appointment)) {
      Alert.alert(
        'বাতিল করা যাবে না',
        'শুধু অপেক্ষমাণ সিরিয়াল বাতিল করা যায়।'
      );
      return;
    }

    Alert.alert(
      'সিরিয়াল বাতিল',
      `আপনি কি "${appointment.doctorName}"-এর সিরিয়াল #${appointment.serialNo} বাতিল করতে চান?`,
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, বাতিল করুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointmentByPatient(
                hospitalId,
                appointment.id,
                user
              );
              Alert.alert('✅ সফল', 'সিরিয়াল বাতিল করা হয়েছে।');
              loadData();
            } catch (err) {
              Alert.alert('❌ ব্যর্থ', err.message);
            }
          },
        },
      ]
    );
  };

  // ==================================================
  // ✅ Counts
  // ==================================================
  const counts = {
    upcoming: categorized.upcoming.length,
    completed: categorized.completed.length,
    cancelled: categorized.cancelled.length,
  };

  const hasPhone = user?.phone || user?.phoneNormalized;

  // ==================================================
  // Loading
  // ==================================================
  if (loading) {
    return <LoadingState message="সিরিয়াল লোড হচ্ছে..." />;
  }

  // ==================================================
  // ✅ Render tab content
  // ==================================================
  const renderContent = () => {
    const list = categorized[activeTab] || [];

    if (list.length === 0) {
      if (activeTab === 'upcoming') {
        return (
          <EmptyState
            icon="calendar-outline"
            title="আপনার কোনো upcoming সিরিয়াল নেই"
            message="নতুন সিরিয়াল নিতে ডাক্তার দেখুন"
            actionLabel="ডাক্তার দেখুন"
            onAction={() => navigation.navigate('Doctors')}
            actionIcon="medkit-outline"
          />
        );
      }
      if (activeTab === 'completed') {
        return (
          <EmptyState
            icon="document-text-outline"
            title="এখনও কোনো appointment history নেই"
            message="সম্পন্ন appointment এখানে দেখা যাবে"
          />
        );
      }
      return (
        <EmptyState
          icon="close-circle-outline"
          title="কোনো বাতিল সিরিয়াল নেই"
          message="বাতিল করা appointment এখানে দেখা যাবে"
        />
      );
    }

    return list.map((appt) => {
      if (activeTab === 'upcoming') {
        return (
          <UpcomingAppointmentCard
            key={appt.id}
            appointment={appt}
            onViewPress={() => handleViewAppointment(appt)}
            onCancelPress={() => handleCancel(appt)}
            canCancel={canPatientCancel(appt)}
          />
        );
      }
      if (activeTab === 'completed') {
        return (
          <CompletedAppointmentCard
            key={appt.id}
            appointment={appt}
            onViewPress={() => handleViewAppointment(appt)}
            onBookAgainPress={handleBookAgain}
          />
        );
      }
      return (
        <CancelledAppointmentCard
          key={appt.id}
          appointment={appt}
          onBookAgainPress={handleBookAgain}
        />
      );
    });
  };

  // ==================================================
  // ✅ Main render
  // ==================================================
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>আমার সিরিয়াল</Text>
          <Text style={styles.headerSubtitle}>
            {appointments.length}টি মোট
          </Text>
        </View>

        {/* New Booking CTA */}
        <View style={styles.ctaWrap}>
          <Button
            title="নতুন সিরিয়াল নিন"
            onPress={() => navigation.navigate('Booking')}
            variant="primary"
            size="lg"
            icon="add-circle"
            fullWidth
          />
        </View>

        {/* Phone Required */}
        {!hasPhone && appointments.length === 0 && (
          <PhoneRequiredCard
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.phoneCard}
          />
        )}

        {/* Tabs */}
        <View style={styles.tabsWrap}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? colors.white : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabCount,
                    isActive && styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      isActive && styles.tabCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <View style={styles.listWrap}>{renderContent()}</View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
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
  ctaWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  phoneCard: {
    marginTop: spacing.md,
  },
  tabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.white,
  },
  tabCount: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabCountText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  tabCountTextActive: {
    color: colors.white,
  },
  listWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});