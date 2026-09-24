// server/services/fcmService.js
// ==================================================
// 📨 FCM Service — Firebase Cloud Messaging (HTTP v1)
// ==================================================
const admin = require('firebase-admin');

// ==================================================
// ✅ Send notification to single device
// ==================================================
async function sendToDevice(fcmToken, notification, data = {}) {
  if (!fcmToken) {
    console.warn('⚠️ No FCM token provided');
    return { success: false, error: 'No token' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title || 'আল-আফিয়া হাসপাতাল',
        body: notification.body || '',
      },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        clickAction: data.clickAction || 'OPEN_APP',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'alafiyah_default',
          sound: 'default',
          priority: 'high',
          color: '#1c5fa8',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ FCM sent: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send error:', error.message);

    // Handle invalid tokens
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      return { success: false, error: 'INVALID_TOKEN', code: error.code };
    }

    return { success: false, error: error.message };
  }
}

// ==================================================
// ✅ Send to multiple devices
// ==================================================
async function sendToDevices(fcmTokens, notification, data = {}) {
  if (!fcmTokens || fcmTokens.length === 0) {
    return { success: false, sent: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    fcmTokens.map((token) => sendToDevice(token, notification, data))
  );

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;
  const failed = results.length - sent;

  return { success: sent > 0, sent, failed, results };
}

module.exports = {
  sendToDevice,
  sendToDevices,
};