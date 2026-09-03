// server/server.js
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Service Account Key লোড করুন (আপনার রুট থেকে)
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// ✅ অনবোর্ডিং এন্ডপয়েন্ট
app.post('/api/onboard-hospital', async (req, res) => {
  try {
    const { superAdminToken, hospitalName, adminEmail, adminPassword, address, phone } = req.body;

    // ১. সুপার অ্যাডমিন টোকেন ভেরিফাই করুন (আপনার ফ্রন্টএন্ড থেকে পাঠাতে হবে)
    if (!superAdminToken) {
      return res.status(401).json({ error: 'অননুমোদিত! সুপার অ্যাডমিন টোকেন দিন।' });
    }

    let claims;
    try {
      const decoded = await admin.auth().verifyIdToken(superAdminToken);
      claims = decoded;
    } catch (e) {
      return res.status(401).json({ error: 'টোকেন সঠিক নয় বা মেয়াদ শেষ!' });
    }

    if (claims.role !== 'super_admin') {
      return res.status(403).json({ error: 'শুধুমাত্র সুপার অ্যাডমিন হাসপাতাল তৈরি করতে পারেন!' });
    }

    // ২. ইনপুট যাচাই
    if (!hospitalName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক!' });
    }

    // ৩. হাসপাতাল ডকুমেন্ট তৈরি
    const hospitalRef = admin.firestore().collection('hospitals').doc();
    const hospitalId = hospitalRef.id;
    await hospitalRef.set({
      name: hospitalName,
      address: address || '',
      phone: phone || '',
      isActive: true,
      subscription: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // ৪. ইউজার তৈরি
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'অ্যাডমিন'
    });

    // ৫. কাস্টম ক্লেইম সেট
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      hospitalId: hospitalId,
      role: 'admin',
      approved: true
    });

    // ৬. ইউজার ডকুমেন্ট তৈরি
    await admin.firestore().doc(`hospitals/${hospitalId}/users/${userRecord.uid}`).set({
      name: 'অ্যাডমিন',
      email: adminEmail,
      role: 'admin',
      approved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // ৭. ডিফল্ট ডিপার্টমেন্ট
    const defaultDepts = [
      { name: 'মেডিসিন', icon: 'Stethoscope', color: '#1c5fa8', doctors: [] },
      { name: 'সার্জারি', icon: 'Scissors', color: '#d1392f', doctors: [] },
      { name: 'হৃদরোগ', icon: 'Heart', color: '#9c3a9c', doctors: [] }
    ];
    for (const dept of defaultDepts) {
      await admin.firestore().collection(`hospitals/${hospitalId}/departments`).add(dept);
    }

    // ৮. ডিফল্ট প্যানেল
    const weekDays = ['শনিবার','রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার'];
    for (const day of weekDays) {
      await admin.firestore().doc(`hospitals/${hospitalId}/panels/${day}`).set({
        name: day,
        title: `${day}ের ডক্টরস প্যানেল`,
        activeDoctorIds: []
      });
    }

    // ৯. ডিফল্ট ফুটার
    await admin.firestore().doc(`hospitals/${hospitalId}/footer/data`).set({
      hospitalName: hospitalName,
      hospitalSubtitle: 'স্বাস্থ্যসেবায় বিশ্বাস',
      address: address || '',
      website: `${hospitalName.toLowerCase().replace(/\s/g, '')}.com`,
      contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
      phones: [''],
      logo: '/logo.png'
    });

    res.status(200).json({ success: true, hospitalId, message: `${hospitalName} তৈরি হয়েছে!` });

  } catch (error) {
    console.error('❌ অনবোর্ডিং ব্যর্থ:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server চালু হয়েছে: http://localhost:${PORT}`);
});