// services/inAppNotificationService.js
// ==================================================
// 🔔 In-App Notification Service
// ==================================================
// Firestore-এ সেভ করা notification fetch, listen, mark-read
// ==================================================
import {
  db,
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from '../firebase';

// ==================================================
// ✅ Notification Listener (real-time)
// ==================================================
export const subscribeToNotifications = (
  hospitalId,
  userId,
  callback,
  errorCallback
) => {
  if (!hospitalId || !userId) {
    return () => {};
  }

  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'users',
      userId,
      'notifications'
    );
    const q = query(ref, orderBy('createdAt', 'desc'), limit(100));

    return onSnapshot(
      q,
      (snap) => {
        const notifications = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        if (callback) callback(notifications);
      },
      (err) => {
        console.error('❌ subscribeToNotifications:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToNotifications setup:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Unread Count (real-time)
// ==================================================
export const subscribeToUnreadCount = (
  hospitalId,
  userId,
  callback,
  errorCallback
) => {
  if (!hospitalId || !userId) {
    return () => {};
  }

  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'users',
      userId,
      'notifications'
    );
    const q = query(ref, where('isRead', '==', false));

    return onSnapshot(
      q,
      (snap) => {
        if (callback) callback(snap.size);
      },
      (err) => {
        console.error('❌ subscribeToUnreadCount:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToUnreadCount setup:', err);
    return () => {};
  }
};

// ==================================================
// ✅ Mark Single as Read
// ==================================================
export const markNotificationAsRead = async (
  hospitalId,
  userId,
  notificationId
) => {
  if (!hospitalId || !userId || !notificationId) return;
  try {
    const ref = doc(
      db,
      'hospitals',
      hospitalId,
      'users',
      userId,
      'notifications',
      notificationId
    );
    await updateDoc(ref, { isRead: true });
    return true;
  } catch (err) {
    console.error('❌ markNotificationAsRead:', err);
    return false;
  }
};

// ==================================================
// ✅ Mark All as Read
// ==================================================
export const markAllNotificationsAsRead = async (hospitalId, userId) => {
  if (!hospitalId || !userId) return 0;
  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'users',
      userId,
      'notifications'
    );
    const q = query(ref, where('isRead', '==', false));
    const snap = await getDocs(q);

    if (snap.empty) return 0;

    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();

    return snap.size;
  } catch (err) {
    console.error('❌ markAllNotificationsAsRead:', err);
    return 0;
  }
};

// ==================================================
// ✅ Delete Notification
// ==================================================
export const deleteNotification = async (
  hospitalId,
  userId,
  notificationId
) => {
  if (!hospitalId || !userId || !notificationId) return false;
  try {
    const ref = doc(
      db,
      'hospitals',
      hospitalId,
      'users',
      userId,
      'notifications',
      notificationId
    );
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error('❌ deleteNotification:', err);
    return false;
  }
};

export default {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};