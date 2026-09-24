// screens/AppointmentDetailScreen.js
// ==================================================
// 📄 AppointmentDetailScreen — With real-time queue
// ==================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import {
  getAppointmentById,
  cancelAppointmentByPatient,
  canPatientCancel,
} from '../services/appointmentActionsService';

import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge, {
  getQueueStatusFromAppointment,
} from '../components/ui/StatusBadge';
import Card from '../components/ui/Card';
import LiveStatusCard from '../components/appointments/LiveStatusCard';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';
import { radius } from '../theme/radius';

const WEB_APP_URL = 'https://doctors.alafiyahhospital.com';

const formatBengaliDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  } catch {
    return dateStr;
  }
};

export default function AppointmentDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { hospitalId } = useHospital();
  const appointmentId = route?.params?.appointmentId;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!appointmentId || !hospitalId) {
        setError('Appointment ID পাওয়া যায়নি');
        setLoading(false);
        return;
      }

      try {
        const data = await getAppointmentById(hospitalId, appointmentId);
        if (!mounted) return;
        if (!data) {
          setError('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি');
        } else {
          setAppointment(data);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'লোড করা যায়নি');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [appointmentId, hospitalId]);

  const handleCancel = () => {
    if (!canPatientCancel(appointment)) {
      Alert.alert(
        'বাতিল করা যাবে না',
        'শুধু অপেক্ষমাণ সিরিয়াল বাতিল করা যায়।'
      );
      return;
    }

    Alert.alert('সিরিয়াল বাতিল', 'আপনি কি এই সিরিয়াল বাতিল করতে চান?', [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAppointmentByPatient(
              hospitalId,
              appointment.id,
              user
            );
            Alert.alert('✅ সফল', 'সিরিয়াল বাতিল করা হয়েছে।');
            navigation.goBack();
          } catch (err) {
            Alert.alert('❌ ব্যর্থ', err.message);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingState message="লোড হচ্ছে..." />;

  if (error || !appointment) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ErrorState
          title="পাওয়া যায়নি"
          message={error || 'অ্যাপয়েন্টমেন্ট লোড করা যায়নি'}
          onRetry={() => navigation.goBack()}
          retryLabel="ফিরে যান"
        />
      </SafeAreaView>
    );
  }

  const checkinUrl = `${WEB_APP_URL}/checkin/${appointment.id}`;
  const cancellable = canPatientCancel(appointment);
  const queueStatus = getQueueStatusFromAppointment(appointment);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Serial Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>আপনার সিরিয়াল</Text>
          <Text style={styles.heroNumber}>#{appointment.serialNo || '—'}</Text>
          <View style={styles.heroStatusWrap}>
            <StatusBadge status={queueStatus} size="md" />
          </View>
        </View>

        {/* ✅ Live Status — with real-time */}
        <View style={styles.sectionWrap}>
          <LiveStatusCard
            mySerial={appointment.serialNo}
            doctorId={appointment.doctorId}
            bookingDate={appointment.bookingDate}
            appointmentStatus={appointment.status}
          />
        </View>

        {/* Doctor info */}
        <View style={styles.sectionWrap}>
          <Card variant="outline" padding="lg">
            <Text style={styles.sectionTitle}>ডাক্তারের তথ্য</Text>
            <InfoRow
              icon="person-outline"
              label="ডাক্তার"
              value={appointment.doctorName}
            />
            {appointment.doctorDept ? (
              <InfoRow
                icon="medkit-outline"
                label="বিভাগ"
                value={appointment.doctorDept}
              />
            ) : null}
            {appointment.doctorQuals ? (
              <InfoRow
                icon="school-outline"
                label="যোগ্যতা"
                value={appointment.doctorQuals}
              />
            ) : null}
          </Card>
        </View>

        {/* Booking info */}
        <View style={styles.sectionWrap}>
          <Card variant="outline" padding="lg">
            <Text style={styles.sectionTitle}>সিরিয়াল তথ্য</Text>
            <InfoRow
              icon="calendar-outline"
              label="তারিখ"
              value={formatBengaliDate(appointment.bookingDate)}
            />
            {appointment.doctorTime ? (
              <InfoRow
                icon="time-outline"
                label="সময়"
                value={appointment.doctorTime}
              />
            ) : null}
            <InfoRow
              icon="ticket-outline"
              label="সিরিয়াল নম্বর"
              value={`#${appointment.serialNo}`}
            />
            {appointment.locationName ? (
              <InfoRow
                icon="location-outline"
                label="লোকেশন"
                value={appointment.locationName}
              />
            ) : null}
          </Card>
        </View>

        {/* QR code */}
        <View style={styles.sectionWrap}>
          <Card variant="outline" padding="lg">
            <Text style={styles.sectionTitle}>চেক-ইন QR</Text>
            <View style={styles.qrWrap}>
              <QRCode
                value={checkinUrl}
                size={180}
                color={colors.primary}
                backgroundColor={colors.white}
              />
            </View>
            <Text style={styles.qrNote}>
              হাসপাতালে এসে QR স্ক্যান করে চেক-ইন করুন
            </Text>
          </Card>
        </View>

        {/* Actions */}
        {cancellable && (
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              style={styles.cancelBtn}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.error}
              />
              <Text style={styles.cancelText}>সিরিয়াল বাতিল করুন</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  heroLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  heroNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 56,
    color: colors.white,
    lineHeight: 64,
    marginBottom: spacing.sm,
  },
  heroStatusWrap: { marginTop: spacing.xs },
  sectionWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
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
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 1,
  },
  infoValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  qrWrap: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrNote: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  actionsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.errorLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.error + '60',
  },
  cancelText: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    color: colors.error,
  },
});