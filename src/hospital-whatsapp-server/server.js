require('dotenv').config();
const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const nodemailer = require('nodemailer');
const axios = require('axios');

// ---------- Firebase Admin ----------
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ serviceAccountKey.json সফলভাবে লোড হয়েছে');
} catch (err) {
  console.error('❌ serviceAccountKey.json ফাইলটি পাওয়া যায়নি!');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// ---------- কনস্ট্যান্ট ----------
const HOSPITAL_ID = 'alafiyah_main'; // আপনার হসপিটাল ডকুমেন্টের আইডি
const HOSPITAL_WHATSAPP = "8801886776512";
let sock = null;
let isConnected = false;

// ---------- ইমেইল ট্রান্সপোর্টার ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------- 📱 এসএমএস পাঠানোর ফাংশন (sms.net.bd) ----------
async function sendSMS(phoneNumber, message) {
  try {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
      console.error('❌ SMS_API_KEY .env ফাইলে সেট করা নেই');
      return false;
    }

    let number = phoneNumber.replace(/[^0-9]/g, '');
    if (number.startsWith('0')) {
      number = '88' + number.substring(1);
    } else if (!number.startsWith('88')) {
      number = '88' + number;
    }

    console.log(`📤 SMS পাঠানোর চেষ্টা: ${number}`);

    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('to', number);
    formData.append('msg', message);
    if (process.env.SMS_SENDER_ID) {
      formData.append('senderid', process.env.SMS_SENDER_ID);
    }

    const response = await axios.post('https://api.sms.net.bd/sendsms', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    console.log(`📥 sms.net.bd রেসপন্স:`, JSON.stringify(response.data, null, 2));

    if (response.data && response.data.error === 0) {
      console.log(`📱 SMS সফলভাবে পাঠানো হয়েছে: ${response.data.msg}`);
      return true;
    } else {
      const errorMsg = response.data?.msg || 'অজানা ত্রুটি';
      console.error(`❌ SMS পাঠাতে ব্যর্থ: ${errorMsg}`);
      return false;
    }
  } catch (error) {
    console.error('❌ SMS API কল করতে সমস্যা:', error.message);
    if (error.response) {
      console.error('   রেসপন্স ডেটা:', error.response.data);
    }
    return false;
  }
}

// ---------- WhatsApp কানেকশন ----------
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
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
      console.log('====================');
      console.log('WhatsApp QR স্ক্যান করুন:');
      qrcode.generate(qr, { small: true });
      console.log('====================');
    }
    if (connection === 'close') {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('সংযোগ বন্ধ হয়েছে, পুনরায় সংযোগ হচ্ছে...', shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      isConnected = true;
      console.log('✅ WhatsApp কানেক্টেড! Server চালু আছে।');
    }
  });
}

// ---------- 🆕 রোগীকে কনফার্মেশন মেসেজ পাঠানোর ফাংশন ----------
async function sendConfirmationMessage(data, appointmentId) {
  const baseUrl = process.env.BASE_URL || 'https://your-hospital.com';
  const checkinLink = `${baseUrl}/checkin/${appointmentId}`;

  const serviceMessage = process.env.HOSPITAL_SERVICES || 
    'আমাদের হাসপাতালে অভিজ্ঞ ডাক্তার, উন্নত চিকিৎসা সেবা ও ২৪/৭ জরুরি বিভাগ রয়েছে।';

  const smsText = `
🩺 আল-আফিয়া হাসপাতাল

প্রিয় ${data.name},
আপনার সিরিয়াল নিশ্চিত হয়েছে!
সিরিয়াল: ${data.serialNo}
ডাক্তার: ${data.doctorName}
তারিখ: ${data.bookingDate}
সময়: ${data.doctorTime || 'উল্লেখিত সময়ে'}

✅ হাসপিটালে এসে চেক-ইন করতে লিংকে ক্লিক করুন:
${checkinLink}

${serviceMessage}

ধন্যবাদ।
  `.trim();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
      <h2 style="color: #1c5fa8;">🩺 আল-আফিয়া হাসপাতাল</h2>
      <p><strong>প্রিয় ${data.name},</strong></p>
      <p>আপনার সিরিয়াল <strong>নিশ্চিত</strong> হয়েছে।</p>
      <ul>
        <li><strong>সিরিয়াল নম্বর:</strong> ${data.serialNo}</li>
        <li><strong>ডাক্তার:</strong> ${data.doctorName}</li>
        <li><strong>তারিখ:</strong> ${data.bookingDate}</li>
        <li><strong>সময়:</strong> ${data.doctorTime || 'উল্লেখিত সময়ে'}</li>
      </ul>
      <p>✅ <strong>হাসপিটালে এসে চেক-ইন করতে</strong> নিচের বাটনে ক্লিক করুন:</p>
      <a href="${checkinLink}" style="display: inline-block; background: #1c5fa8; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">চেক-ইন করুন</a>
      <p style="margin-top: 8px; font-size: 13px; color: #1e293b;">
        🔹 চেক-ইন করার পর আপনি ডাক্তার দেখাতে পারবেন।
      </p>
      <p style="margin-top: 12px; font-size: 13px; color: #475569;">
        ${serviceMessage}
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
        অথবা এই লিংকে যান: <a href="${checkinLink}">${checkinLink}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">ধন্যবাদ।</p>
    </div>
  `;

  // ---------- ১. এসএমএস ----------
  let mobile = data.mobile;
  if (mobile) {
    if (mobile.startsWith('0')) mobile = '88' + mobile.substring(1);
    else if (!mobile.startsWith('88')) mobile = '88' + mobile;

    const smsSent = await sendSMS(mobile, smsText);
    if (smsSent) {
      console.log(`📱 এসএমএস পাঠানো হয়েছে ${mobile} নম্বরে`);
    } else {
      console.log(`⚠️ এসএমএস পাঠানো সম্ভব হয়নি ${mobile} নম্বরে`);
    }
  }

  // ---------- ২. ইমেইল ----------
  if (data.email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: `✅ আপনার সিরিয়াল নিশ্চিত - ${data.serialNo}`,
        html: emailHtml,
      });
      console.log(`📧 ইমেইল পাঠানো হয়েছে ${data.email} এ`);
    } catch (err) {
      console.error('❌ ইমেইল পাঠাতে ব্যর্থ:', err.message);
    }
  }
}

// ---------- 🔥 FIREBASE লিসেনার (হসপিটাল-নির্দিষ্ট পাথে) ----------
const previousStatuses = new Map();

// পাথ: hospitals/alafiyah_main/appointments
const appointmentsPath = `hospitals/${HOSPITAL_ID}/appointments`;

db.collection(appointmentsPath).onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    const docId = change.doc.id;
    const data = change.doc.data();
    const currentStatus = data.status;

    if (change.type === 'added') {
      previousStatuses.set(docId, currentStatus);
    }

    if (change.type === 'modified') {
      const previousStatus = previousStatuses.get(docId);
      if (previousStatus === 'pending' && currentStatus === 'confirmed') {
        console.log(`✅ অ্যাপয়েন্টমেন্ট ${docId} কনফার্ম করা হয়েছে। রোগীকে নোটিফিকেশন পাঠানো হচ্ছে...`);
        await sendConfirmationMessage(data, docId);

        if (isConnected && sock) {
          const jid = HOSPITAL_WHATSAPP + '@s.whatsapp.net';
          const msg = `🩺 অ্যাপয়েন্টমেন্ট কনফার্ম!\n\nনাম: ${data.name}\nমোবাইল: ${data.mobile}\nসিরিয়াল: ${data.serialNo}\nডাক্তার: ${data.doctorName}\nসময়: ${data.doctorTime || 'উল্লেখিত সময়ে'}\n\nরোগীকে নোটিফিকেশন পাঠানো হয়েছে।`;
          try {
            await sock.sendMessage(jid, { text: msg });
            console.log(`📨 হাসপাতালের WhatsApp-এ নোটিফিকেশন পাঠানো হয়েছে।`);
          } catch (err) {
            console.error('❌ WhatsApp নোটিফিকেশন পাঠাতে ব্যর্থ:', err.message);
          }
        }
      }
      previousStatuses.set(docId, currentStatus);
    }

    if (change.type === 'removed') {
      previousStatuses.delete(docId);
    }
  });
});

// ---------- সার্ভার চালু ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend Server চলছে: ${PORT}`);
  console.log(`📁 হসপিটাল আইডি: ${HOSPITAL_ID}`);
  console.log(`📁 অ্যাপয়েন্টমেন্ট পাথ: ${appointmentsPath}`);
});

connectToWhatsApp();