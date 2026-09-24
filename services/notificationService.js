// services/notificationService.js
// ==================================================
// 📱 Notification Service — FCM Token Registration
// ==================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db, doc, updateDoc, arrayUnion } from '../firebase';

// ==================================================
// ✅ FCM Token নিন
// ==================================================
export async function registerForPushNotificationsAsync(user, hospitalId) {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission denied');
      return null;
    }

    // ✅ FCM Device Token নিন (Expo Push Token নয়)
    // FCM-এ সরাসরি পাঠানোর জন্য এটি প্রয়োজন
    token = (await Notifications.getDevicePushTokenAsync()).data;

    console.log('📱 FCM Device Token:', token);
  } else {
    console.warn('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

// ==================================================
// ✅ Token Firestore-এ সেভ করুন
// ==================================================
export async function saveFcmToken(user, hospitalId, fcmToken) {
  if (!user || !fcmToken || !hospitalId) return;

  try {
    const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);

    // ✅ fcmTokens array তে যোগ করুন (duplicate এড়াতে)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion({
        token: fcmToken,
        device: Platform.OS,
        createdAt: new Date().toISOString(),
      }),
    });

    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('❌ Save FCM token error:', error);
  }
}