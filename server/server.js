// server/server.js
import 'dotenv/config';
import express from 'express';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ==================================================
// ✅ Firebase Credentials Loader
// ==================================================
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('✅ Firebase service account loaded from ENV');
  } catch (err) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT env parse error:', err.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require('./serviceAccountKey.json');
    console.log('✅ Firebase service account loaded from FILE');
  } catch (err) {
    console.error('❌ No Firebase credentials found!');
    console.error('👉 Set FIREBASE_SERVICE_ACCOUNT env variable OR add serviceAccountKey.json');
    process.exit(1);
  }
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ==================================================
// Express App
// ==================================================
const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// ---------- কনস্ট্যান্ট ----------
const HOSPITAL_ID = 'alafiyah_main';
const HOSPITAL_WHATSAPP = '8801889885094';
let sock = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

let currentQRDataUrl = null;
let lastQRGeneratedAt = null;

// ---------- ইমেইল ট্রান্সপোর্টার ----------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==================================================
// 📱 SMS পাঠানোর ফাংশন (sms.net.bd)
// ==================================================
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

    const response = await axios.post(
      'https://api.sms.net.bd/sendsms',
      formData.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      }
    );

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

// ==================================================
// ✅ WhatsApp কানেকশন
// ==================================================
async function connectToWhatsApp() {
  try {
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

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQRDataUrl = await QRCode.toDataURL(qr, {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          lastQRGeneratedAt = new Date();

          const domain = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : 'https://<your-service>.up.railway.app';

          console.log('\n====================');
          console.log('📱 WhatsApp QR Code প্রস্তুত!');
          console.log(`👉 Browser এ যান: ${domain}/qr`);
          console.log('====================\n');
        } catch (err) {
          console.error('❌ QR generation error:', err.message);
        }
      }

      if (connection === 'close') {
        isConnected = false;
        currentQRDataUrl = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`\n🔌 সংযোগ বন্ধ | statusCode: ${statusCode} | reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          reconnectAttempts++;
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(3000 * reconnectAttempts, 15000);
            console.log(`🔄 ${delay / 1000} সেকেন্ড পরে পুনরায় সংযোগ...`);
            setTimeout(() => connectToWhatsApp(), delay);
          }
        } else {
          console.log('\n❌ WhatsApp লগআউট হয়েছে! নতুন QR scan করতে হবে।\n');
        }
      } else if (connection === 'open') {
        isConnected = true;
        currentQRDataUrl = null;
        reconnectAttempts = 0;
        console.log('\n✅ WhatsApp কানেক্টেড! Server চালু আছে।');
        console.log(`📞 হাসপাতাল WhatsApp: ${HOSPITAL_WHATSAPP}\n`);
      }
    });
  } catch (error) {
    console.error('❌ connectToWhatsApp error:', error.message);
    setTimeout(() => connectToWhatsApp(), 5000);
  }
}

// ==================================================
// 🆕 TRIGGER 1: হাসপাতালের WhatsApp-এ নতুন বুকিং notification
// (রোগী form submit করলেই চলবে)
// ==================================================
async function sendHospitalNotification(data, appointmentId) {
  if (!isConnected || !sock) {
    console.log(
      `⚠️ WhatsApp কানেক্টেড নেই! isConnected=${isConnected}, sock=${!!sock}`
    );
    return;
  }

  const jid = HOSPITAL_WHATSAPP + '@s.whatsapp.net';

  const msg = `🩺 *নতুন সিরিয়াল বুকিং!*

👤 *রোগীর নাম:* ${data.name || '-'}
📱 *মোবাইল:* ${data.mobile || '-'}
🎂 *বয়স:* ${data.age || '-'}
⚧ *লিঙ্গ:* ${data.gender || '-'}

🎫 *সিরিয়াল:* ${data.serialNo || '-'}
👨‍⚕️ *ডাক্তার:* ${data.doctorName || '-'}
🏥 *বিভাগ:* ${data.doctorDept || '-'}
📅 *তারিখ:* ${data.bookingDate || '-'} (${data.bookingDay || '-'})
⏰ *সময়:* ${data.doctorTime || 'উল্লেখিত সময়ে'}

📍 *ঠিকানা:* ${data.address || '-'}
📢 *রেফারেল:* ${data.referralSource || '-'}

━━━━━━━━━━━━━━━━━
⚠️ *Status:* Pending
🆕 Booking ID: ${appointmentId}
🕒 ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}

👉 Admin confirm করলে রোগীকে SMS/Email যাবে।`;

  try {
    await sock.sendMessage(jid, { text: msg });
    console.log(`📨 হাসপাতালের WhatsApp-এ নতুন বুকিং নোটিফিকেশন পাঠানো হয়েছে।\n`);
  } catch (err) {
    console.error('❌ WhatsApp নোটিফিকেশন পাঠাতে ব্যর্থ:', err.message);
  }
}

// ==================================================
// 🆕 TRIGGER 2: Admin Confirm করলে রোগীকে SMS + Email
// (pending → confirmed হলে চলবে)
// ==================================================
async function sendPatientConfirmation(data, appointmentId) {
  const baseUrl = process.env.BASE_URL || 'https://your-hospital.com';
  const checkinLink = `${baseUrl}/checkin/${appointmentId}`;

  const serviceMessage =
    process.env.HOSPITAL_SERVICES ||
    'আমাদের হাসপাতালে অভিজ্ঞ ডাক্তার, উন্নত চিকিৎসা সেবা ও ২৪/৭ জরুরি বিভাগ রয়েছে।';

  const smsText = `
🩺 আল-আফিয়া হাসপাতাল

প্রিয় ${data.name},
আপনার সিরিয়াল নিশ্চিত হয়েছে!
সিরিয়াল: ${data.serialNo}
ডাক্তার: ${data.doctorName}
তারিখ: ${data.bookingDate}
সময়: ${data.doctorTime || 'উল্লেখিত সময়ে'}

✅ হাসপিটালে এসে চেক-ইন করতে লিংকে ক্লিক করুন:
${checkinLink}

${serviceMessage}

ধন্যবাদ।
  `.trim();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px;">
      <h2 style="color: #1c5fa8;">🩺 আল-আফিয়া হাসপাতাল</h2>
      <p><strong>প্রিয় ${data.name},</strong></p>
      <p>আপনার সিরিয়াল <strong>নিশ্চিত</strong> হয়েছে।</p>
      <ul>
        <li><strong>সিরিয়াল নম্বর:</strong> ${data.serialNo}</li>
        <li><strong>ডাক্তার:</strong> ${data.doctorName}</li>
        <li><strong>তারিখ:</strong> ${data.bookingDate}</li>
        <li><strong>সময়:</strong> ${data.doctorTime || 'উল্লেখিত সময়ে'}</li>
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
      console.log(`📱 রোগীকে এসএমএস পাঠানো হয়েছে ${mobile} নম্বরে`);
    } else {
      console.log(`⚠️ রোগীকে এসএমএস পাঠানো সম্ভব হয়নি ${mobile} নম্বরে`);
    }
  }

  // ---------- ২. ইমেইল ----------
  if (data.email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: `✅ আপনার সিরিয়াল নিশ্চিত - ${data.serialNo}`,
        html: emailHtml,
      });
      console.log(`📧 রোগীকে ইমেইল পাঠানো হয়েছে ${data.email} এ`);
    } catch (err) {
      console.error('❌ ইমেইল পাঠাতে ব্যর্থ:', err.message);
    }
  }
}

// ==================================================
// 🖼️ QR Code HTML Page
// ==================================================
app.get('/qr', (req, res) => {
  if (isConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>WhatsApp Connected</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; margin: 0;
                 background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
          .box { text-align: center; padding: 40px; background: #fff;
                 border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                 max-width: 420px; }
          h1 { font-size: 26px; color: #166534; margin: 0 0 12px 0; }
          p { color: #475569; font-size: 15px; }
          .icon { font-size: 64px; margin-bottom: 12px; }
        </style>
        </head>
        <body>
          <div class="box">
            <div class="icon">✅</div>
            <h1>WhatsApp Connected!</h1>
            <p>নতুন বুকিং হলেই হাসপাতালের WhatsApp এ message যাবে।</p>
          </div>
        </body>
      </html>
    `);
  }

  if (!currentQRDataUrl) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta http-equiv="refresh" content="3"><title>Waiting...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; margin: 0;
                 background: linear-gradient(135deg, #fef3c7, #fed7aa); }
          .box { text-align: center; padding: 40px; }
          h1 { color: #92400e; }
          .spinner { display: inline-block; width: 40px; height: 40px;
            border: 4px solid #fcd34d; border-top-color: #92400e;
            border-radius: 50%; animation: spin 1s linear infinite;
            margin-bottom: 16px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
        </head>
        <body>
          <div class="box">
            <div class="spinner"></div>
            <h1>⏳ QR Code তৈরি হচ্ছে...</h1>
            <p>Page ৩ সেকেন্ড পরে auto-refresh হবে।</p>
          </div>
        </body>
      </html>
    `);
  }

  const generatedTime = lastQRGeneratedAt
    ? lastQRGeneratedAt.toLocaleString('bn-BD')
    : '';

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Scan WhatsApp QR</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Hind Siliguri', Arial, sans-serif;
                 display: flex; flex-direction: column;
                 align-items: center; justify-content: center;
                 min-height: 100vh; margin: 0;
                 background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                 padding: 20px; }
          .card { background: #fff; padding: 32px; border-radius: 20px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                  text-align: center; max-width: 500px; width: 100%; }
          h1 { color: #1c5fa8; font-size: 22px; margin: 0 0 8px 0; }
          .subtitle { color: #475569; font-size: 14px; margin: 6px 0 0 0; }
          .qr-wrapper { background: #fff; padding: 16px;
                        border: 2px dashed #cbd5e1; border-radius: 14px;
                        margin: 22px 0; display: inline-block; }
          .qr-wrapper img { display: block; width: 320px; max-width: 100%;
                            height: auto; }
          .steps { background: #f8fafc; border-radius: 12px;
                   padding: 16px 20px; text-align: left;
                   font-size: 14px; color: #334155; margin-top: 16px; }
          .steps strong { color: #1c5fa8; display: block;
                          margin-bottom: 8px; font-size: 15px; }
          .steps ol { margin: 0; padding-left: 22px; }
          .steps li { margin: 8px 0; line-height: 1.5; }
          .info { margin-top: 16px; font-size: 12px; color: #94a3b8;
                  text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>📱 WhatsApp QR Code</h1>
          <p class="subtitle">হাসপাতালের WhatsApp দিয়ে scan করুন</p>

          <div class="qr-wrapper">
            <img src="${currentQRDataUrl}" alt="WhatsApp QR Code" />
          </div>

          <div class="steps">
            <strong>📋 কীভাবে scan করবেন:</strong>
            <ol>
              <li>মোবাইলে <b>WhatsApp</b> খুলুন</li>
              <li><b>Settings</b> → <b>Linked Devices</b></li>
              <li><b>Link a Device</b> ক্লিক করুন</li>
              <li>এই QR code টি scan করুন</li>
            </ol>
          </div>

          <p class="info">
            ${generatedTime ? `⏱ QR তৈরি: ${generatedTime}` : ''}
            <br>
            🔄 Scan হয়ে গেলে এই page reload করলে "Connected" দেখাবে।
          </p>
        </div>
      </body>
    </html>
  `);
});

// ==================================================
// 🏠 Root endpoint
// ==================================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hospital: HOSPITAL_ID,
    whatsapp: isConnected ? 'connected' : 'disconnected',
    qrAvailable: !!currentQRDataUrl,
    qrUrl: '/qr',
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// 🔥 FIREBASE লিসেনার – Dual Trigger
// ==================================================
const previousStatuses = new Map();
const appointmentsPath = `hospitals/${HOSPITAL_ID}/appointments`;

console.log(`\n🔍 Firestore listener চালু হচ্ছে: ${appointmentsPath}`);
console.log(`📢 Trigger 1: নতুন বুকিং → হাসপাতালের WhatsApp`);
console.log(`📢 Trigger 2: Admin Confirm → রোগীকে SMS + Email\n`);

db.collection(appointmentsPath).onSnapshot(
  (snapshot) => {
    console.log(`📊 Snapshot: ${snapshot.docChanges().length} changes`);

    snapshot.docChanges().forEach(async (change) => {
      const docId = change.doc.id;
      const data = change.doc.data();
      const currentStatus = data.status;

      // ==================================================
      // 🆕 TRIGGER 1: NEW BOOKING → হাসপাতালের WhatsApp
      // ==================================================
      if (change.type === 'added') {
        previousStatuses.set(docId, currentStatus);

        const createdAt = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt
          ? new Date(data.createdAt)
          : null;

        const now = new Date();
        const secondsSinceCreation = createdAt
          ? (now.getTime() - createdAt.getTime()) / 1000
          : 999;

        const isFreshBooking = secondsSinceCreation < 60;

        console.log(
          `➕ নতুন appointment: ${docId} | status: ${currentStatus} | age: ${Math.round(secondsSinceCreation)}s`
        );

        if (isFreshBooking) {
          console.log(`\n✅ নতুন বুকিং → হাসপাতালের WhatsApp এ পাঠাচ্ছি...`);
          try {
            await sendHospitalNotification(data, docId);
          } catch (err) {
            console.error('❌ sendHospitalNotification error:', err.message);
          }
        } else {
          console.log(`⏭️ পুরোনো booking (${Math.round(secondsSinceCreation)}s), skip\n`);
        }
      }

      // ==================================================
      // ✅ TRIGGER 2: PENDING → CONFIRMED → রোগীকে SMS + Email
      // ==================================================
      if (change.type === 'modified') {
        const previousStatus = previousStatuses.get(docId);
        console.log(
          `🔄 Modified: ${docId} | prev: ${previousStatus} → curr: ${currentStatus}`
        );

        // শুধু pending → confirmed হলে
        if (previousStatus === 'pending' && currentStatus === 'confirmed') {
          console.log(
            `\n✅ Admin booking confirm করেছে! রোগীকে SMS + Email পাঠাচ্ছি...`
          );

          try {
            await sendPatientConfirmation(data, docId);
            console.log(`✅ রোগীকে notification পাঠানো সম্পন্ন\n`);
          } catch (err) {
            console.error('❌ sendPatientConfirmation error:', err.message);
          }
        }

        previousStatuses.set(docId, currentStatus);
      }

      // ---------- ➖ Removed ----------
      if (change.type === 'removed') {
        previousStatuses.delete(docId);
        console.log(`➖ Appointment removed: ${docId}`);
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
  console.log(`🚀 Backend Server চলছে: ${PORT}`);
  console.log(`📁 হসপিটাল আইডি: ${HOSPITAL_ID}`);
  console.log(`📁 অ্যাপয়েন্টমেন্ট পাথ: ${appointmentsPath}`);
  console.log(`📞 হাসপাতাল WhatsApp: ${HOSPITAL_WHATSAPP}`);
  console.log(`🔗 QR page: http://localhost:${PORT}/qr\n`);
});

connectToWhatsApp();

// ---------- Graceful Shutdown ----------
process.on('SIGINT', () => {
  console.log('\n\n🛑 Server বন্ধ হচ্ছে...');
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