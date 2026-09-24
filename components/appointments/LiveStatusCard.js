// components/appointments/LiveStatusCard.js
// ==================================================
// 🔴 LiveStatusCard — Real-time queue status
// ==================================================
// Phase 5: Now with real-time onSnapshot listener
// ==================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHospital } from '../../context/HospitalContext';
import { subscribeToCounter } from '../../services/queueService';
import QueueProgressBar from './QueueProgressBar';
import { getQueueStatusFromAppointment } from '../ui/StatusBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function LiveStatusCard({
  mySerial,
  doctorId,
  bookingDate,
  appointmentStatus,
  style,
}) {
  const { hospitalId } = useHospital();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Real-time subscription
  useEffect(() => {
    if (!hospitalId || !doctorId || !bookingDate) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToCounter(
      hospitalId,
      doctorId,
      bookingDate,
      (data) => {
        setQueueData(data);
        setLoading(false);
      },
      (err) => {
        console.error('Live status error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [hospitalId, doctorId, bookingDate]);

  // ✅ Calculate derived values
  const currentSerial = queueData?.currentSerial || 0;
  const waitingAhead = Math.max(0, (mySerial || 0) - currentSerial - 1);
  const totalCount = queueData?.count || 0;
  const queueStatus = getQueueStatusFromAppointment({
    status: appointmentStatus,
  });

  // ✅ Has real-time data?
  const hasLiveData =
    !loading && queueData !== null && typeof currentSerial === 'number';

  // ==========================================
  // Loading state
  // ==========================================
  if (loading) {
    return (
      <View style={[styles.card, styles.cardPlaceholder, style]}>
        <View style={styles.headerRow}>
          <Ionicons
            name="sync-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.placeholderLabel}>লাইভ স্ট্যাটাস লোড হচ্ছে...</Text>
        </View>
      </View>
    );
  }

  // ==========================================
  // Live data available
  // ==========================================
  if (hasLiveData) {
    return (
      <View style={[styles.card, styles.cardLive, style]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveLabel}>লাইভ স্ট্যাটাস</Text>
          {queueData?.status === 'paused' && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>বিরতি</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="আপনার সিরিয়াল" value={mySerial} highlight />
          <StatBox label="বর্তমানে চলছে" value={currentSerial} />
          <StatBox
            label="আপনার আগে"
            value={`${waitingAhead} জন`}
          />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressWrap}>
          <QueueProgressBar status={queueStatus} />
        </View>

        {/* Info */}
        {waitingAhead === 0 && currentSerial < mySerial && (
          <View style={styles.readyBox}>
            <Ionicons
              name="notifications"
              size={16}
              color={colors.successDark}
            />
            <Text style={styles.readyText}>
              আপনি এখন পরবর্তী — প্রস্তুত থাকুন
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ==========================================
  // No live data — placeholder
  // ==========================================
  return (
    <View style={[styles.card, styles.cardPlaceholder, style]}>
      <View style={styles.headerRow}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.placeholderLabel}>লাইভ স্ট্যাটাস</Text>
      </View>

      <Text style={styles.placeholderText}>
        এখন লাইভ স্ট্যাটাস পাওয়া যাচ্ছে না। সিরিয়াল নম্বর{' '}
        <Text style={styles.placeholderSerial}>#{mySerial}</Text> — হাসপাতালে এসে
        reception-এ জিজ্ঞেস করুন।
      </Text>

      {/* Still show progress */}
      <View style={styles.progressWrap}>
        <QueueProgressBar status={queueStatus} />
      </View>
    </View>
  );
}

// ==================================================
// ✅ StatBox
// ==================================================
function StatBox({ label, value, highlight = false }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value ?? '—'}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  cardLive: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  cardPlaceholder: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.successDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pausedBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pausedText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10.5,
    color: colors.warningDark,
  },
  placeholderLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  placeholderText: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  placeholderSerial: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statValueHighlight: {
    color: colors.successDark,
    fontSize: 24,
  },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 10.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  readyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  readyText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    color: colors.successDark,
    flex: 1,
  },
});