// services/notificationService.js
// ==================================================
// 📱 Notification Service — FCM Token Registration
// ==================================================
// ✅ Android 13+ Runtime Permission
// ✅ FCM Device Token Retrieval
// ✅ Firestore Token Storage
// ==================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, PermissionsAndroid } from 'react-native';
import { db, doc, updateDoc, arrayUnion } from '../firebase';

// ==================================================
// ✅ FCM Token নিন (Permission সহ)
// ==================================================
export async function registerForPushNotificationsAsync(user, hospitalId) {
  let token;

  // ✅ Physical device check
  if (!Device.isDevice) {
    console.warn('⚠️ Must use physical device for Push Notifications');
    return null;
  }

  // ==================================================
  // ✅ ধাপ ১: Android 13+ (API 33+) Runtime Permission
  // ==================================================
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const permissionStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      console.log('📱 POST_NOTIFICATIONS permission status:', permissionStatus);

      if (permissionStatus !== 'granted') {
        console.warn('⚠️ POST_NOTIFICATIONS permission denied by user');
        return null;
      }
      console.log('✅ POST_NOTIFICATIONS permission granted');
    } catch (err) {
      console.error('❌ Error requesting POST_NOTIFICATIONS:', err);
      // চলুন Expo Notifications এর মাধ্যমে চেষ্টা করি
    }
  }

  // ==================================================
  // ✅ ধাপ ২: Expo Notifications Permission (সব Android/iOS ভার্সন)
  // ==================================================
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('⚠️ Push notification permission denied (Expo Notifications)');
    return null;
  }
  console.log('✅ Expo Notifications permission granted');

  // ==================================================
  // ✅ ধাপ ৩: Android Notification Channel তৈরি (Critical!)
  // ==================================================
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('alafiyah_default', {
        name: 'আল-আফিয়া হাসপাতাল',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1c5fa8',
        sound: 'default',
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
      console.log('✅ Notification channel created: alafiyah_default');
    } catch (err) {
      console.error('❌ Error creating notification channel:', err);
    }
  }

  // ==================================================
  // ✅ ধাপ ৪: FCM Device Token নিন
  // ==================================================
  try {
    token = (await Notifications.getDevicePushTokenAsync()).data;
    console.log('📱 FCM Device Token:', token);
  } catch (error) {
    console.error('❌ Error getting FCM device token:', error);

    // কিছু ডিভাইসে ExpoPushToken ব্যবহার করে fallback
    try {
      const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Expo Push Token (fallback):', expoToken);
      token = expoToken;
    } catch (fallbackErr) {
      console.error('❌ Fallback Expo token also failed:', fallbackErr);
      return null;
    }
  }

  return token;
}

// ==================================================
// ✅ Token Firestore-এ সেভ করুন
// ==================================================
export async function saveFcmToken(user, hospitalId, fcmToken) {
  if (!user || !fcmToken || !hospitalId) {
    console.warn('⚠️ saveFcmToken: missing args', {
      hasUser: !!user,
      hasToken: !!fcmToken,
      hasHospitalId: !!hospitalId,
    });
    return;
  }

  try {
    const userRef = doc(db, 'hospitals', hospitalId, 'users', user.uid);

    // ✅ fcmTokens array তে যোগ করুন (duplicate এড়াতে)
    await updateDoc(userRef, {
      fcmTokens: arrayUnion({
        token: fcmToken,
        device: Platform.OS,
        createdAt: new Date().toISOString(),
      }),
      lastTokenUpdate: new Date().toISOString(),
    });

    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('❌ Save FCM token error:', error);
    console.error('   → সম্ভবত Firestore Rules এ update permission নেই');
    console.error('   → অথবা user document exist করে না');
  }
}