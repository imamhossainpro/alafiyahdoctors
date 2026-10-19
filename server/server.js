// server.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Backend Server (Fully Fixed + Chatbot Source)
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
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// ==================================================
// ✅ Load service account
// ==================================================
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
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

const { getChatbotAnswer } = require('./chatbotService');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
const NOTIFICATION_TARGET = '8801886776513';

let sock = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let sessionStartTime = null;
let lastMessageSentAt = null;
let lastMessageError = null;
let lastMessageTarget = null;

function isWhatsAppReady() {
  return isConnected === true && sock !== null && sock.user != null;
}

async function safeSendMessage(jid, payload, label = 'WhatsApp') {
  if (!isWhatsAppReady()) throw new Error(`${label} not ready`);
  const promise = sock.sendMessage(jid, payload);
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), 15000));
  return Promise.race([promise, timeout]);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
  return dateStr;
}

async function saveInAppNotification(userId, notification, data = {}) {
  if (!userId) return null;
  try {
    const notificationsRef = db.collection('hospitals').doc(HOSPITAL_ID).collection('users').doc(userId).collection('notifications');
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

async function sendToDevice(fcmToken, notification, data = {}) {
  if (!fcmToken) return { success: false, error: 'No token' };
  try {
    const message = {
      token: fcmToken,
      notification: { title: notification.title || HOSPITAL_NAME_EN, body: notification.body || '' },
      data: { ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])), clickAction: data.clickAction || 'OPEN_APP' },
      android: { priority: 'high', notification: { channelId: 'alafiyah_default', sound: 'default', priority: 'high', color: '#1c5fa8' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const response = await getMessaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ FCM send error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendSMS(phoneNumber, message) {
  try {
    const apiKey = process.env.AUTOMAS_API_KEY;
    const senderId = process.env.AUTOMAS_SENDER_ID || 'AL AFIYAH';
    const apiUrl = 'https://api.automas.com.bd/smsapiv4';
    if (!apiKey) return false;
    let number = phoneNumber.replace(/[^0-9]/g, '');
    if (number.startsWith('88')) number = number.substring(2);
    if (!number.startsWith('0')) number = '0' + number;
    const isLongMessage = message.length > 160;
    const messageType = isLongMessage ? 'long' : 'text';
    const payload = { api_key: apiKey, senderid: senderId, type: messageType, scheduledDateTime: '', msg: message, contacts: number };
    const response = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    const resp = response.data;
    let resultsArray = null;
    if (resp && Array.isArray(resp.response) && resp.response.length > 0) resultsArray = resp.response;
    else if (Array.isArray(resp) && resp.length > 0) resultsArray = resp;
    if (resultsArray && resultsArray.length > 0 && resultsArray[0].status === 0) return true;
    return false;
  } catch (error) {
    console.error('❌ SMS API error:', error.message);
    return false;
  }
}

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({ version, auth: state, logger: pino({ level: 'silent' }), connectTimeoutMs: 60000, keepAliveIntervalMs: 10000 });
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
        if (shouldReconnect) {
          reconnectAttempts++;
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(3000 * reconnectAttempts, 15000);
            setTimeout(() => connectToWhatsApp(), delay);
          }
        }
      } else if (connection === 'open') {
        if (sock?.user) {
          isConnected = true;
          sessionStartTime = Date.now();
          reconnectAttempts = 0;
          console.log('\n✅ WhatsApp connected!');
        }
      }
    });
  } catch (error) {
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

async function sendHospitalNotification(data, appointmentId) {
  if (!isWhatsAppReady()) {
    lastMessageError = 'WhatsApp not ready at ' + new Date().toISOString();
    return;
  }
  const jid = `${NOTIFICATION_TARGET}@s.whatsapp.net`;
  const formattedDate = formatDateDDMMYYYY(data.bookingDate);
  const englishPatientName = data.nameEn || data.name || '';
  const englishDoctorName = data.doctorNameEn || data.doctorName || '';
  const sourceTag = data.source === 'chatbot' ? '🤖 (AI Chatbot)' : '';

  const msg = `New Booking Alert ${sourceTag}

Patient: ${englishPatientName || '-'}
Mobile: ${data.mobile || '-'}
Serial: ${data.serialNo || '-'}
Doctor: ${englishDoctorName || '-'}
Date: ${formattedDate} (${data.bookingDay || '-'})
Time: ${data.doctorTime || 'As scheduled'}

Status: Pending
Booking ID: ${appointmentId}`;

  try {
    await safeSendMessage(jid, { text: msg }, 'HOSPITAL-NOTIFY');
    lastMessageSentAt = new Date().toISOString();
    lastMessageTarget = jid;
    lastMessageError = null;
  } catch (err) {
    lastMessageError = `${err.message} at ${new Date().toISOString()}`;
    if (err.message.includes('timeout') || err.message.includes('closed') || err.message.includes('not ready')) {
      isConnected = false;
      try { sock?.end(undefined); } catch (e) {}
      setTimeout(() => connectToWhatsApp(), 3000);
    }
  }
}

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

  let formattedMobile = data.mobile || '';
  if (formattedMobile) {
    formattedMobile = formattedMobile.replace(/[^0-9]/g, '');
    if (formattedMobile.startsWith('0')) formattedMobile = '88' + formattedMobile.substring(1);
    else if (!formattedMobile.startsWith('88')) formattedMobile = '88' + formattedMobile;
  }

  if (isWhatsAppReady() && formattedMobile) {
    try {
      const jid = formattedMobile + '@s.whatsapp.net';
      await safeSendMessage(jid, { text: unifiedMessage }, 'PATIENT-WA');
      lastMessageSentAt = new Date().toISOString();
      lastMessageTarget = jid;
    } catch (err) {}
  }

  if (formattedMobile) {
    const smsText = `Assalamu Alaikum. Your appointment with ${englishDoctorName} at Al-Afiyah Hospital is confirmed.
Patient: ${englishPatientName}
Serial: ${serial}
Date: ${formattedDate}
Time: ${arrivalTime}
Contact: ${HOSPITAL_CONTACT}`;
    await sendSMS(formattedMobile, smsText);
  }

  if (data.userId) {
    await saveInAppNotification(data.userId, { title: 'Booking Confirmed', body: `Serial #${serial} · ${englishDoctorName}`, type: 'booking_confirmed' }, { appointmentId });
  }
}

// ==================================================
// 🤖 AI Chatbot Endpoint
// ==================================================
app.post('/api/chatbot', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'প্রশ্ন দিন' });
    const result = await getChatbotAnswer(question);
    res.json({ success: true, answer: result.text, doctors: result.doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'উত্তর তৈরি করতে সমস্যা হয়েছে' });
  }
});

// ==================================================
// 🧠 Chatbot Training Endpoint (Admin)
// ==================================================
app.post('/api/admin/train-chatbot', async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'প্রশ্ন ও উত্তর দিন' });

    await db.collection('hospitals').doc(HOSPITAL_ID).collection('chatbot_knowledge').add({
      question: question.toLowerCase().trim(),
      answer: answer.trim(),
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'সফলভাবে ট্রেইন করা হয়েছে!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// 📝 Chatbot Appointment Booking Endpoint
// ==================================================
app.post('/api/book-appointment', async (req, res) => {
  try {
    const { doctorId, name, mobile, age, gender, bookingDate, source } = req.body;
    if (!doctorId || !name || !mobile) return res.status(400).json({ success: false, error: 'তথ্য অসম্পূর্ণ' });

    // ১. ডাক্তারের তথ্য বের করা
    const deptSnapshot = await db.collection('hospitals').doc('alafiyah_main').collection('departments').get();
    let selectedDoctor = null;
    for (const deptDoc of deptSnapshot.docs) {
      const deptData = deptDoc.data();
      const doc = (deptData.doctors || []).find((d) => d.id === doctorId);
      if (doc) {
        selectedDoctor = { ...doc, deptName: deptData.name };
        break;
      }
    }
    if (!selectedDoctor) return res.status(404).json({ success: false, error: 'ডাক্তার পাওয়া যায়নি' });

    // ২. সিরিয়াল নম্বর জেনারেট করা
    const dateToBook = bookingDate || new Date().toISOString().split('T')[0];
    const counterKey = `${selectedDoctor.id}_${dateToBook}`;
    const counterRef = db.collection('hospitals').doc('alafiyah_main').collection('counters').doc(counterKey);
    const counterSnap = await counterRef.get();

    let serialNo = 1;
    if (counterSnap.exists) {
      serialNo = (counterSnap.data().count || 0) + 1;
      await counterRef.update({ count: serialNo, updatedAt: new Date().toISOString() });
    } else {
      await counterRef.set({ count: serialNo, doctorId: selectedDoctor.id, date: dateToBook });
    }

    // ✅ ২.৫: রোগী ডেটাবেসে আছে কিনা চেক করা (পেশেন্ট টাইপ ঠিক করার জন্য)
    let patientId = null;
    try {
      const patientRef = db.collection('hospitals').doc('alafiyah_main').collection('patients');
      const patientSnap = await patientRef.where('mobile', '==', mobile).limit(1).get();
      
      if (!patientSnap.empty) {
        patientId = patientSnap.docs[0].id;
      } else {
        const newPatientRef = await patientRef.add({
          name: name,
          nameEn: name,
          mobile: mobile,
          age: age || '',
          gender: gender || 'পুরুষ',
          createdAt: new Date().toISOString(),
          visits: []
        });
        patientId = newPatientRef.id;
      }
    } catch (err) {
      console.warn('Patient save error:', err.message);
    }

    // ৩. অ্যাপয়েন্টমেন্ট তৈরি করা
    const appointmentData = {
      name,
      nameEn: name,
      mobile,
      age: age || '',
      gender: gender || 'পুরুষ',
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorDept: selectedDoctor.deptName,
      bookingDate: dateToBook,
      serialNo,
      status: 'pending',
      timestamp: new Date().toISOString(),
      source: source || 'chatbot',
      isNew: true, // ✅ নতুন লাইন: বুকিং হাইলাইট করার জন্য
      patientId: patientId, // ✅ নতুন লাইন: পেশেন্ট টাইপ ঠিক করার জন্য
    };

    const apptRef = await db.collection('hospitals').doc('alafiyah_main').collection('appointments').add(appointmentData);

    // ✅ সরাসরি হোয়াটসঅ্যাপ নোটিফিকেশন পাঠান
    sendHospitalNotification(appointmentData, apptRef.id).catch((err) =>
      console.error('❌ [BOOKING-NOTIFY] Direct notification error:', err.message)
    );

    res.json({
      success: true,
      message: `সফলভাবে বুকিং হয়েছে। আপনার সিরিয়াল নম্বর: ${serialNo}`,
      appointmentId: apptRef.id,
      serialNo,
      source: appointmentData.source,
    });
  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ success: false, error: 'বুকিং করতে সমস্যা হয়েছে' });
  }
});

// ==================================================
// 🧪 TEST ENDPOINT — Manual WhatsApp test
// ==================================================
app.post('/api/test-whatsapp', async (req, res) => {
  const { to, text } = req.body;
  const targetJid = `${to || NOTIFICATION_TARGET}@s.whatsapp.net`;

  if (!isWhatsAppReady()) {
    return res.json({ success: false, reason: 'WhatsApp not ready' });
  }

  try {
    const result = await safeSendMessage(targetJid, { text: text || `🧪 Test message` }, 'TEST');
    res.json({ success: true, messageId: result?.key?.id });
  } catch (err) {
    res.json({ success: false, error: err.message });
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
      credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
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

    let overview = { activeUsers: 0, newUsers: 0, pageViews: 0, sessions: 0, avgSessionDuration: 0 };
    if (overviewResponse && overviewResponse.rows && overviewResponse.rows.length > 0) {
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================================================
// 📢 Queue Next API
// ==================================================
app.post('/api/queue/next', async (req, res) => {
  try {
    const { hospitalId, doctorId, date, nextSerial } = req.body;
    if (!hospitalId || !doctorId || !date) return res.status(400).json({ success: false, error: 'Missing fields' });

    const appointmentsRef = db.collection('hospitals').doc(hospitalId).collection('appointments');
    const snapshot = await appointmentsRef.where('doctorId', '==', doctorId).where('bookingDate', '==', date).where('serialNo', '==', nextSerial).limit(1).get();

    if (snapshot.empty) return res.json({ success: false, error: 'No appointment found' });

    const appointment = snapshot.docs[0].data();
    const userId = appointment.userId;
    if (!userId) return res.json({ success: false, error: 'No user account' });

    const userDoc = await db.collection('hospitals').doc(hospitalId).collection('users').doc(userId).get();
    if (!userDoc.exists) return res.json({ success: false, error: 'User not found' });

    const userData = userDoc.data();
    let fcmTokens = [];
    if (Array.isArray(userData.fcmTokens)) fcmTokens = userData.fcmTokens.map((t) => typeof t === 'string' ? t : t.token);
    else if (userData.fcmToken) fcmTokens = [userData.fcmToken];

    let fcmResult = { success: false, error: 'No FCM token' };
    if (fcmTokens.length > 0) {
      fcmResult = await sendToDevice(fcmTokens[0], { title: 'Your serial is next!', body: `Serial #${nextSerial}` }, { type: 'QUEUE_UPDATE', mySerial: String(nextSerial) });
    }

    await saveInAppNotification(userId, { title: 'Your serial is next!', body: `Serial #${nextSerial}`, type: 'queue_update' }, { serialNo: String(nextSerial) });
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
    const { hospitalId, appointmentId, customSerial, customDoctorTime, customNote } = req.body;
    if (!hospitalId || !appointmentId) return res.status(400).json({ success: false, error: 'Missing IDs' });

    const apptRef = db.collection('hospitals').doc(hospitalId).collection('appointments').doc(appointmentId);
    const apptDoc = await apptRef.get();
    if (!apptDoc.exists) return res.status(404).json({ success: false, error: 'Not found' });

    const data = apptDoc.data();
    const updates = { status: 'confirmed', confirmedAt: new Date().toISOString(), confirmedBy: 'admin' };
    if (customSerial) updates.serialNo = customSerial;
    if (customDoctorTime) updates.doctorTime = customDoctorTime;
    if (customNote) updates.confirmNote = customNote;

    await apptRef.update(updates);

    const editedData = { ...data, serialNo: customSerial || data.serialNo, doctorTime: customDoctorTime || data.doctorTime };

    let notificationError = null;
    try {
      await sendPatientConfirmation(editedData, appointmentId);
    } catch (notifErr) {
      notificationError = notifErr.message;
    }

    res.json({ success: true, message: notificationError ? 'Confirmed but notification failed' : 'Confirmed and sent', notificationError });
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
    if (!title || !body) return res.status(400).json({ success: false, error: 'Missing data' });

    const usersSnap = await db.collection('hospitals').doc(HOSPITAL_ID).collection('users').where('approved', '==', true).get();
    let count = 0;
    for (const doc of usersSnap.docs) {
      await saveInAppNotification(doc.id, { title, body, type: 'promo' }, { isPromo: true });
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
    sessionAgeMinutes: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : null,
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

setInterval(() => {
  if (previousStatuses.size > 1000) {
    previousStatuses.clear();
  }
}, 60 * 60 * 1000);

db.collection(`hospitals/${HOSPITAL_ID}/appointments`).onSnapshot(
  (snapshot) => {
    const changes = snapshot.docChanges();
    changes.forEach(async (change) => {
      const docId = change.doc.id;
      const data = change.doc.data();
      const currentStatus = data.status;

      if (change.type === 'added') {
        previousStatuses.set(docId, currentStatus);
        if (data.status === 'pending') {
          await sendHospitalNotification(data, docId);
        }
      }

      if (change.type === 'modified') {
        const prev = previousStatuses.get(docId);
        if (prev === 'pending' && currentStatus === 'confirmed' && data.confirmedBy !== 'admin') {
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
});

connectToWhatsApp();

process.on('SIGINT', () => {
  if (sock) try { sock.end(undefined); } catch (e) {}
  process.exit(0);
});