// server.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Backend Server (Updated)
// ==================================================
// ✅ WhatsApp via Baileys (Fixed: Waiting for message issue)
// ✅ SMS via Automas Technologies (api.automas.com.bd/smsapiv4)
// ✅ Email via Gmail
// ✅ FCM Push Notifications
// ✅ GA4 Analytics Data API (Phase 2)
// ✅ Bot login: 8801898792301
// ✅ Notification target: 8801886776513
// ==================================================
require('dotenv').config();
const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const nodemailer = require('nodemailer');
const axios = require('axios');

// ---------- Google Analytics Data API ----------
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// ---------- Firebase Admin ----------
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// ==================================================
// ✅ Load service account (env variable OR file)
// ==================================================
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT,
      'base64'
    ).toString('utf-8');
    serviceAccount = JSON.parse(decoded);
    console.log('✅ serviceAccount loaded from env variable');
  } else {
    serviceAccount = require('./serviceAccountKey.json');
    console.log('✅ serviceAccountKey.json loaded');
  }
} catch (err) {
  console.error('❌ serviceAccount not found!');
  console.error('   → Set FIREBASE_SERVICE_ACCOUNT env variable (base64), OR');
  console.error('   → Add serviceAccountKey.json file in server folder');
  console.error('   Error:', err.message);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const app = express();
const PORT = process.env.PORT || 3001;

// ==================================================
// ✅ CORS Middleware
// ==================================================
const ALLOWED_ORIGINS = [
  'https://doctors.alafiyahhospital.com',
  'https://alafiyahhospital.com',
  'https://www.alafiyahhospital.com',
  'https://api.alafiyahhospital.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// ==================================================
// ---------- কনস্ট্যান্ট ----------
// ==================================================
const HOSPITAL_ID = process.env.HOSPITAL_ID || 'alafiyah_main';
const HOSPITAL_NAME_EN = 'Al-Afiyah Hospital';
const HOSPITAL_CONTACT = '01886-776512';

// ✅ GA4 Property ID (numeric)
const GA4_PROPERTY_ID = '551709872';

// ✅ Bot login number — এই number দিয়ে WhatsApp-এ login করবেন
const HOSPITAL_WHATSAPP = '8801898792301';

// ✅ Notification target — alert যাবে এই number-এ
const NOTIFICATION_TARGET = '8801886776513';

let sock = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ---------- ইমেইল ট্রান্সপোর্টার ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==================================================
// ✅ Helper: Format date as DD-MM-YYYY
// ==================================================
function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// ==================================================
// ✅ Helper: Format date as DD/MM/YY (short, used in SMS/Email/WhatsApp)
// ==================================================
function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
  }
  return dateStr;
}

// ==================================================
// ✅ In-App Notification Save to Firestore
// ==================================================
async function saveInAppNotification(userId, notification, data = {}) {
  if (!userId) {
    console.warn('⚠️ saveInAppNotification: No userId');
    return null;
  }

  try {
    const notificationsRef = db
      .collection('hospitals')
      .doc(HOSPITAL_ID)
      .collection('users')
      .doc(userId)
      .collection('notifications');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docRef = await notificationsRef.add({
      title: notification.title || 'Notification',
      body: notification.body || '',
      type: notification.type || 'general',
      data: data || {},
      isRead: false,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    console.log(`✅ In-app notification saved: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ saveInAppNotification error:', error.message);
    return null;
  }
}

// ==================================================
// ✅ FCM Push Notification
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
        title: notification.title || HOSPITAL_NAME_EN,
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

    const response = await getMessaging().send(message);
    console.log(`✅ FCM sent: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send error:', error.message);

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
// 📱 SMS পাঠানোর ফাংশন (Automas Technologies — smsapiv4)
// ==================================================
async function sendSMS(phoneNumber, message) {
  try {
    const apiKey = process.env.AUTOMAS_API_KEY;
    const senderId = process.env.AUTOMAS_SENDER_ID || 'AL AFIYAH';

    const apiUrl = 'https://api.automas.com.bd/smsapiv4';

    if (!apiKey) {
      console.error('❌ AUTOMAS_API_KEY not set');
      return false;
    }

    let number = phoneNumber.replace(/[^0-9]/g, '');
    if (number.startsWith('88')) {
      number = number.substring(2);
    }
    if (!number.startsWith('0')) {
      number = '0' + number;
    }

    const isLongMessage = message.length > 160;
    const messageType = isLongMessage ? 'long' : 'text';

    console.log(
      `📤 Sending SMS to: ${number} via ${apiUrl} (${message.length} chars, type=${messageType})`
    );

    const payload = {
      api_key: apiKey,
      senderid: senderId,
      type: messageType,
      scheduledDateTime: '',
      msg: message,
      contacts: number,
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const resp = response.data;
    let resultsArray = null;

    if (resp && Array.isArray(resp.response) && resp.response.length > 0) {
      resultsArray = resp.response;
    } else if (Array.isArray(resp) && resp.length > 0) {
      resultsArray = resp;
    }

    if (resultsArray && resultsArray.length > 0) {
      const firstResult = resultsArray[0];
      const status = firstResult.status;

      if (status === 0) {
        console.log(`📱 SMS sent successfully | ID: ${firstResult.id}`);
        return true;
      } else {
        console.error(`❌ SMS failed — status ${status}`);
        return false;
      }
    } else {
      console.error(`❌ SMS send failed — invalid response`);
      return false;
    }
  } catch (error) {
    console.error('❌ SMS API error:', error.message);
    return false;
  }
}

// ==================================================
// ✅ WhatsApp কানেকশন
// ==================================================
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      'auth_info_baileys'
    );
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n====================');
        console.log('📱 WhatsApp QR Scan করুন:');
        console.log('👉 Settings → Linked Devices → Link a Device');
        console.log('====================\n');
        qrcode.generate(qr, { small: true });
        console.log('\n====================\n');
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `\n🔌 Connection closed | statusCode: ${statusCode} | reconnect: ${shouldReconnect}`
        );

        if (shouldReconnect) {
          reconnectAttempts++;
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(3000 * reconnectAttempts, 15000);
            console.log(
              `🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
            );
            setTimeout(() => connectToWhatsApp(), delay);
          } else {
            console.error(
              `❌ Failed after ${MAX_RECONNECT_ATTEMPTS} attempts!`
            );
          }
        } else {
          console.log('\n❌ WhatsApp logged out!');
          console.log('👉 Delete auth_info_baileys folder and restart');
        }
      } else if (connection === 'open') {
        isConnected = true;
        reconnectAttempts = 0;
        console.log('\n✅ WhatsApp connected!');
        console.log(`📞 Bot WhatsApp: ${HOSPITAL_WHATSAPP}`);
        console.log(`📢 Notification Target: ${NOTIFICATION_TARGET}\n`);
      }
    });
  } catch (error) {
    console.error('❌ connectToWhatsApp error:', error.message);
    console.log('🔄 Retrying in 5s...');
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

// ==================================================
// 🆕 TRIGGER 1: Hospital WhatsApp notification on new booking
// ==================================================
async function sendHospitalNotification(data, appointmentId) {
  if (!isConnected || !sock) {
    console.log(
      `⚠️ WhatsApp not connected! isConnected=${isConnected}, sock=${!!sock}`
    );
    return;
  }

  const jid = NOTIFICATION_TARGET + '@s.whatsapp.net';
  const formattedDate = formatDateDDMMYYYY(data.bookingDate);

  const englishPatientName = data.nameEn || data.name || '';
  const englishDoctorName = data.doctorNameEn || data.doctorName || '';
  const englishDoctorDept = data.doctorDept || '';
  const englishAddress = data.address || '';

  const msg = `New Booking Alert

Patient: ${englishPatientName || '-'}
Mobile: ${data.mobile || '-'}
Age: ${data.age || '-'}
Gender: ${data.gender || '-'}

Serial: ${data.serialNo || '-'}
Doctor: ${englishDoctorName || '-'}
Department: ${englishDoctorDept || '-'}
Date: ${formattedDate} (${data.bookingDay || '-'})
Time: ${data.doctorTime || 'As scheduled'}

Address: ${englishAddress || '-'}
Referral: ${data.referralSource || '-'}

-------------------
Status: Pending
Booking ID: ${appointmentId}
Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}

Admin confirm korle patient SMS/Email pabe.`;

  try {
    await sock.sendMessage(jid, { text: msg });
    console.log(`📨 Hospital WhatsApp notified → ${NOTIFICATION_TARGET}\n`);
  } catch (err) {
    console.error('❌ WhatsApp notification failed:', err.message);
  }
}

// ==================================================
// 🆕 TRIGGER 2: Admin Confirm → Patient WhatsApp + SMS + Email + In-App + FCM
// ==================================================
async function sendPatientConfirmation(data, appointmentId) {
  const englishPatientName = data.nameEn || data.name || 'Patient';
  const englishDoctorName = data.doctorNameEn || data.doctorName || 'Doctor';

  const formattedDate = formatDateShort(data.bookingDate);
  const serial = data.serialNo || '';
  const arrivalTime = data.doctorTime || 'As scheduled';

  // ✅ নতুন মেসেজ ফরম্যাট (Patient will receive this)
  const unifiedMessage = `Assalamu Alaikum. Your appointment with ${englishDoctorName} at Al-Afiyah Hospital is confirmed.

Patient: ${englishPatientName}
Serial: ${serial}
Date: ${formattedDate}
Arrival Time: ${arrivalTime}

Please arrive on time. Contact: ${HOSPITAL_CONTACT}`;

  // ---------- ১. WhatsApp ----------
  if (isConnected && sock && data.mobile) {
    try {
      let waNumber = data.mobile.replace(/[^0-9]/g, '');
      if (waNumber.startsWith('0')) waNumber = '88' + waNumber.substring(1);
      else if (!waNumber.startsWith('88')) waNumber = '88' + waNumber;
      
      const jid = waNumber + '@s.whatsapp.net';
      await sock.sendMessage(jid, { text: unifiedMessage });
      console.log(`📱 WhatsApp sent to patient: ${waNumber}`);
      
      // ✅ FIX: হোয়াটসঅ্যাপে "Waiting for this message" সমস্যা এড়াতে ২ সেকেন্ড ডিলে
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error('❌ WhatsApp error:', err.message);
    }
  } else {
    console.log('⚠️ WhatsApp not connected or no mobile number provided.');
  }

  // ---------- ২. এসএমএস ----------
  let mobile = data.mobile;
  if (mobile) {
    mobile = mobile.replace(/[^0-9]/g, '');
    if (mobile.startsWith('0')) mobile = '88' + mobile.substring(1);
    else if (!mobile.startsWith('88')) mobile = '88' + mobile;

    // SMS এর জন্য মেসেজটি একটু শর্ট করা হলো যাতে খরচ কম হয়
    const smsText = `Assalamu Alaikum. Your appointment with ${englishDoctorName} at Al-Afiyah Hospital is confirmed.
Patient: ${englishPatientName}
Serial: ${serial}
Date: ${formattedDate}
Arrival Time: ${arrivalTime}
Contact: ${HOSPITAL_CONTACT}`;

    const smsSent = await sendSMS(mobile, smsText);
    if (smsSent) {
      console.log(`📱 SMS sent to ${mobile}`);
    } else {
      console.log(`⚠️ SMS failed for ${mobile}`);
    }
  }

  // ---------- ৩. ইমেইল ----------
  if (data.email) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
          <h2 style="color: #1c5fa8; margin-top: 0;">${HOSPITAL_NAME_EN}</h2>
          <p><strong>Assalamu Alaikum ${englishPatientName},</strong></p>
          <p>Your appointment with <strong>${englishDoctorName}</strong> at Al-Afiyah Hospital is confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 6px 0; color: #475569;">Patient:</td>
              <td style="padding: 6px 0; font-weight: 700;">${englishPatientName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Serial:</td>
              <td style="padding: 6px 0; font-weight: 700;">${serial}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Date:</td>
              <td style="padding: 6px 0; font-weight: 700;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Arrival Time:</td>
              <td style="padding: 6px 0; font-weight: 700;">${arrivalTime}</td>
            </tr>
          </table>
          <p>Please arrive on time.</p>
          <p style="color: #16a34a; font-weight: 700;">Contact: ${HOSPITAL_CONTACT}</p>
        </div>
      `;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: `Booking Confirmed - Serial ${serial}`,
        html: emailHtml,
      });
      console.log(`📧 Email sent to ${data.email}`);
    } catch (err) {
      console.error('❌ Email error:', err.message);
    }
  }

  // ---------- ৪. In-App Notification ----------
  if (data.userId) {
    await saveInAppNotification(
      data.userId,
      {
        title: 'Booking Confirmed',
        body: `Serial #${serial} · ${englishDoctorName} · ${formattedDate}`,
        type: 'booking_confirmed',
      },
      {
        appointmentId: appointmentId,
        doctorName: englishDoctorName,
        serialNo: String(serial),
        bookingDate: data.bookingDate || '',
      }
    );

    // ---------- ৫. FCM Push Notification ----------
    try {
      const userDoc = await db
        .collection('hospitals')
        .doc(HOSPITAL_ID)
        .collection('users')
        .doc(data.userId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        let fcmTokens = [];

        if (Array.isArray(userData.fcmTokens)) {
          fcmTokens = userData.fcmTokens.map((t) =>
            typeof t === 'string' ? t : t.token
          );
        } else if (userData.fcmToken) {
          fcmTokens = [userData.fcmToken];
        }

        if (fcmTokens.length > 0) {
          await sendToDevice(
            fcmTokens[0],
            {
              title: 'Booking Confirmed',
              body: `Serial #${serial} · ${englishDoctorName}`,
            },
            {
              type: 'BOOKING_CONFIRMED',
              appointmentId: appointmentId,
              serialNo: String(serial),
              clickAction: 'OPEN_APPOINTMENT',
            }
          );
        }
      }
    } catch (fcmErr) {
      console.warn('⚠️ FCM push failed:', fcmErr.message);
    }
  }
}

// ==================================================
// 📊 GA4 Analytics Endpoint (Phase 2)
// ==================================================
app.get('/api/analytics/ga4', async (req, res) => {
  try {
    const { hospitalId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing startDate or endDate',
      });
    }

    console.log(`📊 GA4 API: ${startDate} → ${endDate}`);

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    });

    const [overviewResponse] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
      ],
    });

    let overview = {
      activeUsers: 0,
      newUsers: 0,
      pageViews: 0,
      sessions: 0,
      avgSessionDuration: 0,
    };

    if (
      overviewResponse &&
      overviewResponse.rows &&
      overviewResponse.rows.length > 0
    ) {
      const values = overviewResponse.rows[0].metricValues;
      overview = {
        activeUsers: parseInt(values[0]?.value || '0', 10),
        newUsers: parseInt(values[1]?.value || '0', 10),
        pageViews: parseInt(values[2]?.value || '0', 10),
        sessions: parseInt(values[3]?.value || '0', 10),
        avgSessionDuration: parseFloat(values[4]?.value || '0'),
      };
    }

    const [pagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true,
        },
      ],
      limit: 10,
    });

    const topPages = [];
    if (pagesResponse && pagesResponse.rows) {
      pagesResponse.rows.forEach((row) => {
        const path = row.dimensionValues[0]?.value || '/';
        const views = parseInt(row.metricValues[0]?.value || '0', 10);
        if (views > 0) {
          topPages.push({ path, views });
        }
      });
    }

    const [devicesResponse] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const devices = [];
    if (devicesResponse && devicesResponse.rows) {
      devicesResponse.rows.forEach((row) => {
        const category = row.dimensionValues[0]?.value || 'unknown';
        const users = parseInt(row.metricValues[0]?.value || '0', 10);
        devices.push({ category, users });
      });
    }

    res.json({
      success: true,
      data: {
        ...overview,
        topPages,
        devices,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ GA4 API error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 📢 Queue Next API (FCM)
// ==================================================
app.post('/api/queue/next', async (req, res) => {
  try {
    const { hospitalId, doctorId, date, nextSerial } = req.body;

    if (!hospitalId || !doctorId || !date) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const appointmentsRef = db
      .collection('hospitals')
      .doc(hospitalId)
      .collection('appointments');

    const snapshot = await appointmentsRef
      .where('doctorId', '==', doctorId)
      .where('bookingDate', '==', date)
      .where('serialNo', '==', nextSerial)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ success: false, error: 'No appointment found' });
    }

    const appointment = snapshot.docs[0].data();
    const userId = appointment.userId;

    if (!userId) {
      return res.json({ success: false, error: 'Patient has no user account' });
    }

    const userDoc = await db
      .collection('hospitals')
      .doc(hospitalId)
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.data();
    let fcmTokens = [];

    if (Array.isArray(userData.fcmTokens)) {
      fcmTokens = userData.fcmTokens.map((t) =>
        typeof t === 'string' ? t : t.token
      );
    } else if (userData.fcmToken) {
      fcmTokens = [userData.fcmToken];
    }

    const englishDoctorName =
      appointment.doctorNameEn || appointment.doctorName || '';

    let fcmResult = { success: false, error: 'No FCM token' };
    if (fcmTokens.length > 0) {
      fcmResult = await sendToDevice(
        fcmTokens[0],
        {
          title: 'Your serial is next!',
          body: `Please be ready at ${englishDoctorName}'s chamber. Serial #${nextSerial}`,
        },
        {
          type: 'QUEUE_UPDATE',
          appointmentId: snapshot.docs[0].id,
          mySerial: String(nextSerial),
        }
      );
    }

    await saveInAppNotification(
      userId,
      {
        title: 'Your serial is next!',
        body: `Please be ready at ${englishDoctorName}'s chamber. Serial #${nextSerial}`,
        type: 'queue_update',
      },
      {
        appointmentId: snapshot.docs[0].id,
        doctorName: englishDoctorName,
        serialNo: String(nextSerial),
      }
    );

    res.json({ success: true, result: fcmResult });
  } catch (error) {
    console.error('❌ Queue API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// ✅ Confirm Appointment with Custom Message
// ==================================================
app.post('/api/appointment/confirm-with-message', async (req, res) => {
  try {
    const {
      hospitalId,
      appointmentId,
      customSerial,
      customDoctorTime,
      customNote,
    } = req.body;

    if (!hospitalId || !appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing hospitalId or appointmentId',
      });
    }

    const apptRef = db
      .collection('hospitals')
      .doc(hospitalId)
      .collection('appointments')
      .doc(appointmentId);

    const apptDoc = await apptRef.get();

    if (!apptDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    const data = apptDoc.data();

    const updates = {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'admin',
    };

    if (customSerial) updates.serialNo = customSerial;
    if (customDoctorTime) updates.doctorTime = customDoctorTime;
    if (customNote) updates.confirmNote = customNote;

    await apptRef.update(updates);
    console.log(`✅ Appointment updated: ${appointmentId}`);

    const editedData = {
      ...data,
      serialNo: customSerial || data.serialNo,
      doctorTime: customDoctorTime || data.doctorTime,
      confirmNote: customNote || '',
    };

    try {
      await sendPatientConfirmation(editedData, appointmentId);
      console.log(`✅ Patient notification sent for ${appointmentId}`);
    } catch (notifErr) {
      console.error('⚠️ Notification send failed:', notifErr.message);
      return res.json({
        success: true,
        message: 'Appointment confirmed but notification may have failed',
        warning: notifErr.message,
      });
    }

    res.json({
      success: true,
      message: 'Appointment confirmed and notification sent',
    });
  } catch (error) {
    console.error('❌ Confirm API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 📢 Promotional Notification API
// ==================================================
app.post('/api/notification/send-promo', async (req, res) => {
  try {
    const { title, body, targetUserIds } = req.body;

    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing title or body' });
    }

    let userIds = targetUserIds;

    if (!userIds || userIds.length === 0) {
      const usersSnap = await db
        .collection('hospitals')
        .doc(HOSPITAL_ID)
        .collection('users')
        .where('approved', '==', true)
        .get();

      userIds = usersSnap.docs.map((d) => d.id);
    }

    const results = [];

    for (const userId of userIds) {
      const notifId = await saveInAppNotification(
        userId,
        { title, body, type: 'promo' },
        { isPromo: true }
      );

      try {
        const userDoc = await db
          .collection('hospitals')
          .doc(HOSPITAL_ID)
          .collection('users')
          .doc(userId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          let fcmTokens = [];
          if (Array.isArray(userData.fcmTokens)) {
            fcmTokens = userData.fcmTokens.map((t) =>
              typeof t === 'string' ? t : t.token
            );
          } else if (userData.fcmToken) {
            fcmTokens = [userData.fcmToken];
          }

          if (fcmTokens.length > 0) {
            await sendToDevice(
              fcmTokens[0],
              { title, body },
              { type: 'PROMO', clickAction: 'OPEN_APP' }
            );
          }
        }
      } catch (err) {
        console.warn(`⚠️ FCM failed for user ${userId}:`, err.message);
      }

      results.push({ userId, notifId });
    }

    res.json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error) {
    console.error('❌ Promo API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 🏠 Root endpoint
// ==================================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hospital: HOSPITAL_ID,
    bot_number: HOSPITAL_WHATSAPP,
    notification_target: NOTIFICATION_TARGET,
    ga4_property: GA4_PROPERTY_ID,
    whatsapp: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// 🔥 FIREBASE লিসেনার — Auto-trigger on pending → confirmed
// ==================================================
const previousStatuses = new Map();
const appointmentsPath = `hospitals/${HOSPITAL_ID}/appointments`;

console.log(`\n🔍 Firestore listener starting: ${appointmentsPath}`);
console.log(`📢 Trigger 1: New booking → Hospital WhatsApp`);
console.log(`📢 Trigger 2: Direct Firestore confirm → Patient WhatsApp + SMS + Email + In-App\n`);

db.collection(appointmentsPath).onSnapshot(
  (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const docId = change.doc.id;
      const data = change.doc.data();
      const currentStatus = data.status;

      // ---------- Added ----------
      if (change.type === 'added') {
        previousStatuses.set(docId, currentStatus);

        const rawDate = data.createdAt || data.timestamp;
        const createdAt = rawDate?.toDate
          ? rawDate.toDate()
          : rawDate?.seconds
          ? new Date(rawDate.seconds * 1000)
          : rawDate
          ? new Date(rawDate)
          : null;

        const now = new Date();
        const secondsSinceCreation = createdAt
          ? (now.getTime() - createdAt.getTime()) / 1000
          : 999;

        const isFreshBooking = secondsSinceCreation < 300;

        if (isFreshBooking) {
          console.log(`\n✅ New booking → Sending to Hospital WhatsApp...`);
          try {
            await sendHospitalNotification(data, docId);
          } catch (err) {
            console.error('❌ sendHospitalNotification error:', err.message);
          }
        }
      }

      // ---------- Modified ----------
      if (change.type === 'modified') {
        const previousStatus = previousStatuses.get(docId);

        if (previousStatus === 'pending' && currentStatus === 'confirmed') {
          if (data.confirmedBy === 'admin') {
            console.log(`⏭️ API confirmed — listener skipping (already sent)`);
          } else {
            console.log(
              `\n✅ Direct Firestore confirm detected! Sending notification...`
            );
            try {
              await sendPatientConfirmation(data, docId);
              console.log(`✅ Patient notification sent\n`);
            } catch (err) {
              console.error('❌ sendPatientConfirmation error:', err.message);
            }
          }
        }

        previousStatuses.set(docId, currentStatus);
      }

      // ---------- Removed ----------
      if (change.type === 'removed') {
        previousStatuses.delete(docId);
      }
    });
  },
  (error) => {
    console.error('❌ Firestore listener error:', error.message);
  }
);

// ==================================================
// 🚀 সার্ভার চালু
// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port: ${PORT}`);
});

// ---------- WhatsApp কানেকশন শুরু ----------
connectToWhatsApp();

// ---------- Graceful Shutdown ----------
process.on('SIGINT', () => {
  console.log('\n\n🛑 Server shutting down...');
  if (sock) {
    try {
      sock.end(undefined);
    } catch (e) {}
  }
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});