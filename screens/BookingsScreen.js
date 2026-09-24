// screens/BookingsScreen.js
// ==================================================
// 📅 BookingsScreen — My appointments list
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
import { findUserAppointments } from '../services/userAppointmentsService';

import AppointmentCard from '../components/ui/AppointmentCard';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AppText from '../components/ui/AppText';
import PhoneRequiredCard from '../components/home/PhoneRequiredCard';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const FILTERS = [
  { key: 'all', label: 'সব' },
  { key: 'pending', label: 'অপেক্ষমাণ' },
  { key: 'confirmed', label: 'নিশ্চিত' },
  { key: 'checked-in', label: 'চেক-ইন' },
  { key: 'completed', label: 'সম্পন্ন' },
];

export default function BookingsScreen({ navigation }) {
  const { user } = useAuth();
  const { hospitalId } = useHospital();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadBookings = useCallback(async () => {
    if (!hospitalId || !user) return;
    try {
      const all = await findUserAppointments(hospitalId, user);
      setAppointments(all);
    } catch (err) {
      console.error('❌ Bookings load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId, user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  if (loading) {
    return <LoadingState message="বুকিং লোড হচ্ছে..." />;
  }

  const hasPhone = user?.phone || user?.phoneNormalized;

  // Filter
  const filtered = activeFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === activeFilter);

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
          <AppText variant="h2" color="textInverse">
            আমার সিরিয়াল
          </AppText>
          <AppText variant="bodySmall" color="textInverse" style={styles.headerSub}>
            {appointments.length} টি বুকিং
          </AppText>
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

        {/* Filter chips */}
        {appointments.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {FILTERS.map((filter) => {
              const count =
                filter.key === 'all'
                  ? appointments.length
                  : appointments.filter((a) => a.status === filter.key).length;

              return (
                <Button
                  key={filter.key}
                  title={`${filter.label} (${count})`}
                  onPress={() => setActiveFilter(filter.key)}
                  variant={activeFilter === filter.key ? 'primary' : 'outline'}
                  size="sm"
                  style={styles.filterChip}
                />
              );
            })}
          </ScrollView>
        )}

        {/* Bookings List */}
        <View style={styles.listWrap}>
          {filtered.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={
                appointments.length === 0
                  ? 'আপনার কোনো সিরিয়াল নেই'
                  : 'এই filter-এ কোনো সিরিয়াল নেই'
              }
              message={
                appointments.length === 0
                  ? 'নতুন সিরিয়াল নিতে উপরের বাটনে ক্লিক করুন'
                  : 'অন্য filter নির্বাচন করুন'
              }
            />
          ) : (
            filtered.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() => {
                  // TODO: Detail screen (Phase 3)
                }}
              />
            ))
          )}
        </View>

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
  headerSub: { marginTop: 4, opacity: 0.9 },
  ctaWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  phoneCard: {
    marginTop: spacing.md,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});