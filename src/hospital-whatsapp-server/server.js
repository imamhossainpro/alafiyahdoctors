const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001; // 3001 ব্যবহার করুন, যাতে 3000 এর সাথে কনফ্লিক্ট না হয়
app.use(express.json());

// FIREBASE ADMIN সেটআপ
const serviceAccount = require('./serviceAccountKey.json'); 
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// হাসপাতালের WhatsApp নম্বর
const HOSPITAL_WHATSAPP = "8801886776512"; 

// গ্লোবাল ভেরিয়েবল (সকেট ও কানেকশন স্ট্যাটাস)
let sock = null;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        // Reconnect attempts
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

// 🔥 FIREBASE লিসেনার (এখন ফাংশনের বাইরে - মাত্র একবারই চলবে)
db.collection('appointments').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
            const data = change.doc.data();
            
            // সংযোগ খোলা আছে কিনা চেক করুন
            if (!isConnected || !sock) {
                console.log('WhatsApp এখনো সংযুক্ত হয়নি, মেসেজ পাঠানো হয়নি (পরে আবার চেষ্টা করা হবে)');
                return;
            }

            const jid = HOSPITAL_WHATSAPP + '@s.whatsapp.net';
            const messageText = `🩺 নতুন বুকিং!\n\nনাম: ${data.name}\nমোবাইল: ${data.mobile}\nঠিকানা: ${data.address}\nডাক্তার: ${data.doctorName}\nসিরিয়াল: ${data.serialNo}\n\nঅনুগ্রহ করে রোগীকে সিরিয়াল ও সময় জানিয়ে দিন।`;

            try {
                await sock.sendMessage(jid, { text: messageText });
                console.log(`✅ সিরিয়াল ${data.serialNo} এর মেসেজ পাঠানো হয়েছে!`);
            } catch (error) {
                console.error('WhatsApp পাঠানোর সময় এরর:', error.message);
            }
        }
    });
});

// সার্ভার চালু
app.listen(PORT, () => {
    console.log(`Backend Server চলছে: ${PORT}`);
});

// Baileys কানেকশন শুরু করুন
connectToWhatsApp();