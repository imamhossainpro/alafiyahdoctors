// screens/DoctorDetailsScreen.js
// ==================================================
// 🩺 DoctorDetailsScreen — Doctor profile + weekly schedule
// ==================================================
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useHospital } from '../context/HospitalContext';
import { loadDepartments, loadPanels } from '../services/dataService';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import FavoriteButton from '../components/doctors/FavoriteButton';
import {
  findDoctorById,
  getDoctorAvailability,
  isDoctorInChamberNow,
  getTodayBanglaDay,
  BANGLA_DAYS,
} from '../utils/doctorUtils';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography, fontFamily } from '../theme/typography';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

export default function DoctorDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { hospitalId } = useHospital();

  const doctorId = route?.params?.doctorId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);

  // Load data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!hospitalId || !doctorId) {
        setError('ডাক্তার আইডি পাওয়া যায়নি');
        setLoading(false);
        return;
      }

      try {
        const [depts, pnls] = await Promise.all([
          loadDepartments(hospitalId),
          loadPanels(hospitalId),
        ]);
        if (!mounted) return;
        setDepartments(depts);
        setPanels(pnls);
      } catch (err) {
        console.error('❌ DoctorDetails load error:', err);
        if (mounted) setError(err.message || 'লোড করা যায়নি');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [hospitalId, doctorId]);

  // Find doctor
  const doctor = useMemo(() => {
    if (!doctorId || departments.length === 0) return null;
    return findDoctorById(doctorId, departments);
  }, [doctorId, departments]);

  // Availability
  const availability = useMemo(() => {
    if (!doctor || panels.length === 0) return {};
    return getDoctorAvailability(doctor.id, panels);
  }, [doctor, panels]);

  const weeklySchedule = useMemo(() => {
    if (!doctor) return [];
    return BANGLA_DAYS
      .filter((day) => availability[day])
      .map((day) => ({
        day,
        timeSlots: doctor.timeSlots || [],
        isToday: day === getTodayBanglaDay(),
      }));
  }, [doctor, availability]);

  const inChamber = doctor ? isDoctorInChamberNow(doctor) : false;

  const availableToday = useMemo(() => {
    if (!doctor || panels.length === 0) return false;
    const today = getTodayBanglaDay();
    const panel = panels.find((p) => p.name === today || p.id === today);
    return panel?.activeDoctorIds?.includes(doctor.id) || false;
  }, [doctor, panels]);

  const handleBookPress = () => {
    if (!availableToday) {
      const nextDay = weeklySchedule.find((entry) => !entry.isToday)?.day;

      Alert.alert(
        'আজ সিরিয়াল নেই',
        nextDay
          ? `ডাক্তার আজ চেম্বারে নেই। পরবর্তী উপলব্ধ দিন: ${nextDay}।`
          : 'ডাক্তার আজ চেম্বারে নেই।',
        [
          { text: 'বাতিল', style: 'cancel' },
          {
            text: 'তবুও বুকিং ফরমে যান',
            onPress: () => {
              navigation.navigate('Booking', {
                preselectedDoctor: doctor,
              });
            },
          },
        ]
      );
      return;
    }

    navigation.navigate('Booking', {
      preselectedDoctor: doctor,
    });
  };

  if (loading) {
    return <LoadingState message="ডাক্তারের তথ্য লোড হচ্ছে..." />;
  }

  if (error || !doctor) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ErrorState
          title="ডাক্তার পাওয়া যায়নি"
          message={error || 'ডাক্তারের তথ্য লোড করা যায়নি'}
          onRetry={() => navigation.goBack()}
          retryLabel="ফিরে যান"
          icon="person-remove-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View
            style={[
              styles.headerColorBar,
              { backgroundColor: doctor.deptColor || colors.primary },
            ]}
          />

          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>

              <FavoriteButton doctorId={doctor.id} size="lg" />
            </View>

            <Text style={styles.doctorName}>{doctor.name}</Text>

            {doctor.specialty && (
              <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
            )}

            {doctor.deptName && (
              <View style={styles.deptPill}>
                <View
                  style={[
                    styles.deptDot,
                    { backgroundColor: doctor.deptColor || colors.accent },
                  ]}
                />
                <Text style={styles.deptPillText}>{doctor.deptName}</Text>
              </View>
            )}

            {availableToday && inChamber && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>এখন চেম্বারে আছেন</Text>
              </View>
            )}

            {availableToday && !inChamber && (
              <View style={styles.availablePill}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.successDark}
                />
                <Text style={styles.availablePillText}>আজ উপলব্ধ</Text>
              </View>
            )}

            {!availableToday && (
              <View style={styles.unavailablePill}>
                <Ionicons
                  name="close-circle"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.unavailablePillText}>আজ চেম্বারে নেই</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info Card — with Designation */}
        <View style={styles.sectionWrap}>
          <Card variant="outline" padding="lg">
            <Text style={styles.sectionTitle}>তথ্য</Text>

            {/* ✅ NEW: Designation */}
            {doctor.designation && (
              <InfoRow
                icon="briefcase-outline"
                label="পদবী"
                value={doctor.designation}
              />
            )}

            {doctor.quals && (
              <InfoRow
                icon="school-outline"
                label="শিক্ষাগত যোগ্যতা"
                value={doctor.quals}
              />
            )}

            {doctor.workplace && (
              <InfoRow
                icon="business-outline"
                label="কর্মস্থল"
                value={doctor.workplace}
              />
            )}
          </Card>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeaderOutside}>
            এই সপ্তাহের সময়সূচি
          </Text>

          {weeklySchedule.length === 0 ? (
            <Card variant="outline" padding="lg">
              <View style={styles.emptySchedule}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyScheduleText}>
                  এই সপ্তাহে কোনো সময়সূচি পাওয়া যায়নি
                </Text>
              </View>
            </Card>
          ) : (
            <Card variant="outline" padding="none">
              {weeklySchedule.map((entry, index) => (
                <View
                  key={entry.day}
                  style={[
                    styles.scheduleRow,
                    index === weeklySchedule.length - 1 &&
                      styles.scheduleRowLast,
                    entry.isToday && styles.scheduleRowToday,
                  ]}
                >
                  <View style={styles.scheduleDayWrap}>
                    <Text
                      style={[
                        styles.scheduleDay,
                        entry.isToday && styles.scheduleDayToday,
                      ]}
                    >
                      {entry.day}
                    </Text>

                    {entry.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>আজ</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.scheduleTimeWrap}>
                    {entry.timeSlots.map((slot, idx) => (
                      <View key={idx} style={styles.timeSlotRow}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={colors.warningDark}
                        />
                        <Text style={styles.timeSlotText}>
                          {slot.start} - {slot.end}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Note */}
        <View style={styles.noteWrap}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={styles.noteText}>
            সময়সূচি সাপ্তাহিক প্যানেল অনুযায়ী দেখানো হচ্ছে।
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View
        style={[
          styles.stickyBar,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Button
          title={availableToday ? 'সিরিয়াল নিন' : 'আজ সিরিয়াল নেই'}
          onPress={handleBookPress}
          variant={availableToday ? 'primary' : 'outline'}
          size="lg"
          icon={availableToday ? 'calendar-outline' : 'close-circle-outline'}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

// Helper Components
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },

  // Header
  headerCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  headerColorBar: { height: 6 },
  headerContent: { padding: spacing.lg },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 30,
  },
  doctorSpecialty: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: '#9c2a7e',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  deptDot: { width: 8, height: 8, borderRadius: 4 },
  deptPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.successLight,
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  livePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.successDark,
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.successLight,
    marginTop: spacing.sm,
  },
  availablePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.successDark,
  },
  unavailablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.sm,
  },
  unavailablePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Sections
  sectionWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sectionHeaderOutside: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 19,
  },

  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  scheduleRowLast: {
    borderBottomWidth: 0,
  },
  scheduleRowToday: {
    backgroundColor: colors.primarySubtle,
  },
  scheduleDayWrap: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleDay: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  scheduleDayToday: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  todayBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 9.5,
    color: colors.white,
  },
  scheduleTimeWrap: {
    flex: 1,
    gap: 3,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeSlotText: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    color: colors.warningDark,
  },

  // Empty schedule
  emptySchedule: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  emptyScheduleText: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Note
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    justifyContent: 'center',
  },
  noteText: {
    fontFamily: fontFamily.regular,
    fontSize: 11.5,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Sticky bottom
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    ...shadows.lg,
  },
});