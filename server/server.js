// server.cjs
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Backend Server (Fully Fixed)
// ==================================================
// ✅ WhatsApp via Baileys — WITH TIMEOUT + LOGGING + AUTO-RECONNECT
// ✅ SMS via Automas Technologies
// ✅ Email via Gmail
// ✅ FCM Push Notifications
// ✅ GA4 Analytics Data API
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
// ✅ Load service account
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
// ---------- Constants ----------
// ==================================================
const HOSPITAL_ID = process.env.HOSPITAL_ID || 'alafiyah_main';
const HOSPITAL_NAME_EN = 'Al-Afiyah Hospital';
const HOSPITAL_CONTACT = '01886-776512';

const GA4_PROPERTY_ID = '551709872';
const HOSPITAL_WHATSAPP = '8801898792301';
const NOTIFICATION_TARGET = '8801886776513';

let sock = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ✅ Status tracking (for / endpoint)
let sessionStartTime = null;
let lastMessageSentAt = null;
let lastMessageError = null;
let lastMessageTarget = null;

// ==================================================
// ✅ State check helpers
// ==================================================
function isWhatsAppReady() {
  return isConnected === true && sock !== null && sock.user != null;
}

// ✅ Safe sendMessage with 15s timeout
async function safeSendMessage(jid, payload, label = 'WhatsApp') {
  if (!isWhatsAppReady()) {
    throw new Error(`${label} not ready (isConnected=${isConnected}, sock=${!!sock})`);
  }

  const promise = sock.sendMessage(jid, payload);
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`${label} sendMessage timeout after 15s — session likely dead`)),
      15000
    )
  );

  return Promise.race([promise, timeout]);
}

// ---------- Email Transporter ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==================================================
// ✅ Helper: Format Date
// ==================================================
function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
  }
  return dateStr;
}

// ==================================================
// ✅ In-App Notification
// ==================================================
async function saveInAppNotification(userId, notification, data = {}) {
  if (!userId) return null;
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
  if (!fcmToken) return { success: false, error: 'No token' };
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
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const response = await getMessaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send error:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================================================
// 📱 SMS (Automas Technologies)
// ==================================================
async function sendSMS(phoneNumber, message) {
  try {
    const apiKey = process.env.AUTOMAS_API_KEY;
    const senderId = process.env.AUTOMAS_SENDER_ID || 'AL AFIYAH';
    const apiUrl = 'https://api.automas.com.bd/smsapiv4';

    if (!apiKey) {
      console.error('❌ AUTOMAS_API_KEY not set in .env');
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

    console.log(`📤 Sending SMS to: ${number}...`);

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
      if (firstResult.status === 0) {
        console.log(`✅ SMS sent successfully | ID: ${firstResult.id}`);
        return true;
      } else {
        console.error(`❌ SMS failed — status ${firstResult.status}`);
        return false;
      }
    } else {
      console.error(`❌ SMS send failed — invalid response format`);
      return false;
    }
  } catch (error) {
    console.error('❌ SMS API error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data));
    }
    return false;
  }
}

// ==================================================
// ✅ WhatsApp Connection (FIXED)
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
        qrcode.generate(qr, { small: true });
        console.log('\n====================\n');
      }

      if (connection === 'close') {
        isConnected = false;
        sessionStartTime = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`\n🔌 Connection closed | statusCode: ${statusCode}`);
        console.log(`   error: ${lastDisconnect?.error?.message || 'N/A'}`);

        if (shouldReconnect) {
          reconnectAttempts++;
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(3000 * reconnectAttempts, 15000);
            console.log(`   → Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
            setTimeout(() => connectToWhatsApp(), delay);
          } else {
            console.error(`   → Max reconnect attempts reached. Manual restart required.`);
          }
        } else {
          console.log('❌ WhatsApp logged out! New QR scan required.');
        }
      } else if (connection === 'open') {
        // ✅ FIX: Only mark connected if sock.user is set
        if (sock?.user) {
          isConnected = true;
          sessionStartTime = Date.now();
          reconnectAttempts = 0;

          console.log('\n✅ WhatsApp connected!');
          console.log(`   Logged in as: ${sock.user.id}`);
          console.log(`   Notification target: ${NOTIFICATION_TARGET}@s.whatsapp.net`);

          if (sock.user.id.startsWith(NOTIFICATION_TARGET)) {
            console.error('\n⚠️⚠️⚠️ WARNING ⚠️⚠️⚠️');
            console.error('   NOTIFICATION_TARGET === LOGIN NUMBER');
            console.error('   Baileys may fail silently when sending to yourself!');
            console.error('   Use a DIFFERENT number for NOTIFICATION_TARGET.\n');
          }
        } else {
          console.warn('⚠️ Connection "open" but sock.user not yet available');
        }
      }
    });
  } catch (error) {
    console.error('❌ connectToWhatsApp error:', error.message);
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

// ==================================================
// 🆕 TRIGGER 1: Hospital WhatsApp Notification (FIXED)
// ==================================================
async function sendHospitalNotification(data, appointmentId) {
  console.log('\n========================================');
  console.log('🔔 [HOSPITAL-NOTIFY] Booking received:', appointmentId);
  console.log('   isConnected:', isConnected);
  console.log('   sock exists:', !!sock);
  console.log('   sock.user.id:', sock?.user?.id || 'N/A');
  console.log('   isWhatsAppReady():', isWhatsAppReady());
  console.log('   Target phone:', NOTIFICATION_TARGET);
  console.log('========================================\n');

  if (!isWhatsAppReady()) {
    console.error('❌ [HOSPITAL-NOTIFY] ABORT — WhatsApp not ready!');
    console.error('   → Check QR scan / session validity');
    lastMessageError = 'WhatsApp not ready at ' + new Date().toISOString();
    return;
  }

  const jid = `${NOTIFICATION_TARGET}@s.whatsapp.net`;
  const formattedDate = formatDateDDMMYYYY(data.bookingDate);

  const englishPatientName = data.nameEn || data.name || '';
  const englishDoctorName = data.doctorNameEn || data.doctorName || '';

  const msg = `New Booking Alert

Patient: ${englishPatientName || '-'}
Mobile: ${data.mobile || '-'}
Serial: ${data.serialNo || '-'}
Doctor: ${englishDoctorName || '-'}
Date: ${formattedDate} (${data.bookingDay || '-'})
Time: ${data.doctorTime || 'As scheduled'}

Status: Pending
Booking ID: ${appointmentId}`;

  try {
    console.log(`📤 [HOSPITAL-NOTIFY] Sending to JID: ${jid}`);
    console.log(`📝 Message length: ${msg.length} chars`);

    const result = await safeSendMessage(jid, { text: msg }, 'HOSPITAL-NOTIFY');

    console.log('✅ [HOSPITAL-NOTIFY] SUCCESS!');
    console.log('   Message ID:', result?.key?.id);
    console.log('   Remote JID:', result?.key?.remoteJid);
    console.log('   Status:', result?.status);

    lastMessageSentAt = new Date().toISOString();
    lastMessageTarget = jid;
    lastMessageError = null;
  } catch (err) {
    console.error('❌ [HOSPITAL-NOTIFY] FAILED:', err.message);
    console.error('   Full error:', err);

    lastMessageError = `${err.message} at ${new Date().toISOString()}`;

    // ✅ Force reconnect on session-dead signals
    if (
      err.message.includes('timeout') ||
      err.message.includes('closed') ||
      err.message.includes('not ready')
    ) {
      console.warn('⚠️ Session appears dead — forcing reconnect...');
      isConnected = false;
      try {
        sock?.end(undefined);
      } catch (e) {}
      setTimeout(() => connectToWhatsApp(), 3000);
    }
  }
}

// ==================================================
// 🆕 TRIGGER 2: Patient Notification (WhatsApp + SMS + Email + FCM)
// ==================================================
async function sendPatientConfirmation(data, appointmentId) {
  const englishPatientName = data.nameEn || data.name || 'Patient';
  const englishDoctorName = data.doctorNameEn || data.doctorName || 'Doctor';

  const formattedDate = formatDateShort(data.bookingDate);
  const serial = data.serialNo || '';
  const arrivalTime = data.doctorTime || 'As scheduled';

  const unifiedMessage = `Assalamu Alaikum. Your appointment with ${englishDoctorName} at Al-Afiyah Hospital is confirmed.

Patient: ${englishPatientName}
Serial: ${serial}
Date: ${formattedDate}
Arrival Time: ${arrivalTime}

Please arrive on time. Contact: ${HOSPITAL_CONTACT}`;

  // ✅ ফোন নম্বর ফরম্যাট
  let formattedMobile = data.mobile || '';
  if (formattedMobile) {
    formattedMobile = formattedMobile.replace(/[^0-9]/g, '');
    if (formattedMobile.startsWith('0')) {
      formattedMobile = '88' + formattedMobile.substring(1);
    } else if (!formattedMobile.startsWith('88')) {
      formattedMobile = '88' + formattedMobile;
    }
  }

  // ---------- ১. WhatsApp ----------
  if (isWhatsAppReady() && formattedMobile) {
    try {
      const jid = formattedMobile + '@s.whatsapp.net';
      console.log(`📱 [PATIENT-WA] Sending to ${jid}...`);
      await safeSendMessage(jid, { text: unifiedMessage }, 'PATIENT-WA');
      console.log(`✅ [PATIENT-WA] Sent to patient: ${formattedMobile}`);
      lastMessageSentAt = new Date().toISOString();
      lastMessageTarget = jid;
    } catch (err) {
      console.error('❌ [PATIENT-WA] Failed:', err.message);
      lastMessageError = `${err.message} at ${new Date().toISOString()}`;
    }
  } else {
    console.warn(`⚠️ [PATIENT-WA] Skipped — ready=${isWhatsAppReady()}, mobile=${!!formattedMobile}`);
  }

  // ---------- ২. SMS ----------
  if (formattedMobile) {
    const smsText = `Assalamu Alaikum. Your appointment with ${englishDoctorName} at Al-Afiyah Hospital is confirmed.
Patient: ${englishPatientName}
Serial: ${serial}
Date: ${formattedDate}
Time: ${arrivalTime}
Contact: ${HOSPITAL_CONTACT}`;

    const smsSent = await sendSMS(formattedMobile, smsText);
    if (smsSent) {
      console.log(`📱 SMS sent to ${formattedMobile}`);
    } else {
      console.log(`⚠️ SMS failed for ${formattedMobile}`);
    }
  }

  // ---------- ৩. Email ----------
  if (data.email) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
          <h2 style="color: #1c5fa8; margin-top: 0;">${HOSPITAL_NAME_EN}</h2>
          <p><strong>Assalamu Alaikum ${englishPatientName},</strong></p>
          <p>Your appointment with <strong>${englishDoctorName}</strong> is confirmed.</p>
          <p><strong>Serial:</strong> ${serial}<br/>
          <strong>Date:</strong> ${formattedDate}<br/>
          <strong>Arrival Time:</strong> ${arrivalTime}</p>
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

  // ---------- ৪. In-App & FCM ----------
  if (data.userId) {
    await saveInAppNotification(
      data.userId,
      {
        title: 'Booking Confirmed',
        body: `Serial #${serial} · ${englishDoctorName}`,
        type: 'booking_confirmed',
      },
      { appointmentId, doctorName: englishDoctorName, serialNo: String(serial) }
    );

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
          fcmTokens = userData.fcmTokens.map((t) => (typeof t === 'string' ? t : t.token));
        } else if (userData.fcmToken) {
          fcmTokens = [userData.fcmToken];
        }

        if (fcmTokens.length > 0) {
          await sendToDevice(
            fcmTokens[0],
            { title: 'Booking Confirmed', body: `Serial #${serial}` },
            { type: 'BOOKING_CONFIRMED', appointmentId, clickAction: 'OPEN_APPOINTMENT' }
          );
        }
      }
    } catch (fcmErr) {
      console.warn('⚠️ FCM push failed:', fcmErr.message);
    }
  }
}

// ==================================================
// 🧪 TEST ENDPOINT — Manual WhatsApp test
// ==================================================
app.post('/api/test-whatsapp', async (req, res) => {
  const { to, text } = req.body;
  const targetJid = `${to || NOTIFICATION_TARGET}@s.whatsapp.net`;

  console.log('\n🧪 [TEST] Manual WhatsApp test triggered');
  console.log('   Target:', targetJid);
  console.log('   isConnected:', isConnected);
  console.log('   isWhatsAppReady():', isWhatsAppReady());
  console.log('   sock.user.id:', sock?.user?.id || 'N/A');

  if (!isWhatsAppReady()) {
    return res.json({
      success: false,
      reason: 'WhatsApp not ready',
      isConnected,
      hasSock: !!sock,
      hasUser: !!sock?.user,
    });
  }

  try {
    const result = await safeSendMessage(
      targetJid,
      {
        text:
          text ||
          `🧪 Test message from server at ${new Date().toLocaleString('bn-BD')}`,
      },
      'TEST'
    );

    console.log('✅ [TEST] Sent successfully!', result?.key?.id);
    res.json({
      success: true,
      messageId: result?.key?.id,
      targetJid,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ [TEST] Failed:', err.message);
    res.json({
      success: false,
      error: err.message,
      targetJid,
      stack: err.stack,
    });
  }
});

// ==================================================
// 📊 GA4 Analytics Endpoint
// ==================================================
app.get('/api/analytics/ga4', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing dates' });
    }

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

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('❌ GA4 API error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 📢 Queue Next API
// ==================================================
app.post('/api/queue/next', async (req, res) => {
  try {
    const { hospitalId, doctorId, date, nextSerial } = req.body;
    if (!hospitalId || !doctorId || !date) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing fields' });
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

    if (snapshot.empty)
      return res.json({ success: false, error: 'No appointment found' });

    const appointment = snapshot.docs[0].data();
    const userId = appointment.userId;
    if (!userId)
      return res.json({ success: false, error: 'No user account' });

    const userDoc = await db
      .collection('hospitals')
      .doc(hospitalId)
      .collection('users')
      .doc(userId)
      .get();
    if (!userDoc.exists)
      return res.json({ success: false, error: 'User not found' });

    const userData = userDoc.data();
    let fcmTokens = [];
    if (Array.isArray(userData.fcmTokens)) {
      fcmTokens = userData.fcmTokens.map((t) =>
        typeof t === 'string' ? t : t.token
      );
    } else if (userData.fcmToken) {
      fcmTokens = [userData.fcmToken];
    }

    let fcmResult = { success: false, error: 'No FCM token' };
    if (fcmTokens.length > 0) {
      fcmResult = await sendToDevice(
        fcmTokens[0],
        { title: 'Your serial is next!', body: `Serial #${nextSerial}` },
        { type: 'QUEUE_UPDATE', mySerial: String(nextSerial) }
      );
    }

    await saveInAppNotification(
      userId,
      {
        title: 'Your serial is next!',
        body: `Serial #${nextSerial}`,
        type: 'queue_update',
      },
      { serialNo: String(nextSerial) }
    );
    res.json({ success: true, result: fcmResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// ✅ Confirm Appointment API
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
    if (!hospitalId || !appointmentId)
      return res
        .status(400)
        .json({ success: false, error: 'Missing IDs' });

    const apptRef = db
      .collection('hospitals')
      .doc(hospitalId)
      .collection('appointments')
      .doc(appointmentId);
    const apptDoc = await apptRef.get();
    if (!apptDoc.exists)
      return res.status(404).json({ success: false, error: 'Not found' });

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

    const editedData = {
      ...data,
      serialNo: customSerial || data.serialNo,
      doctorTime: customDoctorTime || data.doctorTime,
    };

    let notificationError = null;
    try {
      await sendPatientConfirmation(editedData, appointmentId);
    } catch (notifErr) {
      console.error('⚠️ Notification failed:', notifErr.message);
      notificationError = notifErr.message;
    }

    res.json({
      success: true,
      message: notificationError
        ? 'Confirmed but notification failed'
        : 'Confirmed and sent',
      notificationError,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 📢 Promo Notification API
// ==================================================
app.post('/api/notification/send-promo', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body)
      return res
        .status(400)
        .json({ success: false, error: 'Missing data' });

    const usersSnap = await db
      .collection('hospitals')
      .doc(HOSPITAL_ID)
      .collection('users')
      .where('approved', '==', true)
      .get();
    let count = 0;
    for (const doc of usersSnap.docs) {
      await saveInAppNotification(
        doc.id,
        { title, body, type: 'promo' },
        { isPromo: true }
      );
      count++;
    }
    res.json({ success: true, sent: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 🏠 Root API — Health check
// ==================================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hospital: HOSPITAL_ID,
    whatsapp: isConnected ? 'connected' : 'disconnected',
    whatsappReady: isWhatsAppReady(),
    whatsappUser: sock?.user?.id || null,
    sessionAgeMinutes: sessionStartTime
      ? Math.floor((Date.now() - sessionStartTime) / 60000)
      : null,
    lastMessageSentAt,
    lastMessageTarget,
    lastMessageError,
    notificationTarget: NOTIFICATION_TARGET,
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// 🔥 Firestore Listener (FIXED)
// ==================================================
const previousStatuses = new Map();

// ✅ Periodic cleanup for previousStatuses (memory leak prevention)
setInterval(() => {
  if (previousStatuses.size > 1000) {
    console.log('🧹 [FIRESTORE] Cleaning previousStatuses (size:', previousStatuses.size, ')');
    previousStatuses.clear();
  }
}, 60 * 60 * 1000); // প্রতি ঘণ্টায়

db.collection(`hospitals/${HOSPITAL_ID}/appointments`).onSnapshot(
  (snapshot) => {
    const changes = snapshot.docChanges();
    if (changes.length > 0) {
      console.log(`\n📡 [FIRESTORE] Snapshot — ${changes.length} change(s)`);
    }

    changes.forEach(async (change) => {
      const docId = change.doc.id;
      const data = change.doc.data();
      const currentStatus = data.status;

      console.log(
        `📡 [FIRESTORE] Change: ${change.type} | docId: ${docId} | status: ${currentStatus}`
      );

      if (change.type === 'added') {
        previousStatuses.set(docId, currentStatus);
        if (data.status === 'pending') {
          console.log('🔔 [FIRESTORE] → Triggering hospital notification');
          await sendHospitalNotification(data, docId);
        }
      }

      if (change.type === 'modified') {
        const prev = previousStatuses.get(docId);

        if (
          prev === 'pending' &&
          currentStatus === 'confirmed' &&
          data.confirmedBy !== 'admin'
        ) {
          console.log('🔔 [FIRESTORE] → Triggering patient confirmation');
          await sendPatientConfirmation(data, docId);
        }

        previousStatuses.set(docId, currentStatus);
      }
    });
  },
  (error) => console.error('❌ [FIRESTORE] listener error:', error.message)
);

// ==================================================
// 🚀 Run Server
// ==================================================
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port: ${PORT}`);
  console.log(`🏥 Hospital: ${HOSPITAL_ID}`);
  console.log(`📱 Notification target: ${NOTIFICATION_TARGET}`);
  console.log(`🧪 Test endpoint: POST /api/test-whatsapp`);
});

connectToWhatsApp();

process.on('SIGINT', () => {
  if (sock)
    try {
      sock.end(undefined);
    } catch (e) {}
  process.exit(0);
});