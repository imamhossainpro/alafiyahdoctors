// screens/NotificationsScreen.js
// ==================================================
// 🔔 NotificationsScreen — All in-app notifications
// ==================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/inAppNotificationService';

import NotificationCard from '../components/ui/NotificationCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontFamily } from '../theme/typography';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { hospitalId } = useHospital();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==================================================
  // ✅ Real-time subscription
  // ==================================================
  useEffect(() => {
    if (!hospitalId || !user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToNotifications(
      hospitalId,
      user.uid,
      (data) => {
        setNotifications(data);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Notification subscribe error:', err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsub();
  }, [hospitalId, user?.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ==================================================
  // ✅ Handlers
  // ==================================================
  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (notification.isRead === false) {
      await markNotificationAsRead(hospitalId, user.uid, notification.id);
    }

    // Navigate based on type
    if (notification.type === 'booking_confirmed' || notification.type === 'queue_update') {
      const appointmentId = notification.data?.appointmentId;
      if (appointmentId) {
        navigation.navigate('AppointmentDetail', { appointmentId });
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(hospitalId, user.uid);
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(hospitalId, user.uid, notificationId);
  };

  // ==================================================
  // ✅ Loading state
  // ==================================================
  if (loading) {
    return <LoadingState message="নোটিফিকেশন লোড হচ্ছে..." />;
  }

  const unreadCount = notifications.filter((n) => n.isRead === false).length;

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header bar */}
      {notifications.length > 0 && (
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>
            {unreadCount > 0
              ? `${unreadCount} টি অপঠিত`
              : 'সব পড়া হয়েছে'}
          </Text>

          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>সব পড়া হয়েছে</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onDeletePress={() => handleDelete(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="কোনো নোটিফিকেশন নেই"
            message="নতুন বুকিং, সিরিয়াল আপডেট বা প্রচারমূলক বার্তা এলে এখানে দেখা যাবে"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  topBarText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  markAllText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});