// functions/src/index.js
// ==================================================
// 🏥 আল-আফিয়া হাসপাতাল — Cloud Functions
// ==================================================
// ✅ onboardHospital           — নতুন হাসপাতাল তৈরি (callable)
// ✅ cleanupOldProfileRequests — পুরনো profile requests মুছে ফেলা (scheduled)
// ✅ cleanupOldActivityLogs    — পুরনো activity logs মুছে ফেলা (scheduled)
// ==================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');

admin.initializeApp();

// ==================================================
// 1️⃣ onboardHospital — নতুন হাসপাতাল তৈরি
// ==================================================
exports.onboardHospital = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'আপনি লগইন করেননি!');
  }
  const callerClaims = context.auth.token;
  if (callerClaims.role !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'শুধুমাত্র সুপার অ্যাডমিন পারবেন!');
  }

  const { hospitalName, adminEmail, adminPassword, address, phone } = data;
  if (!hospitalName || !adminEmail || !adminPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক!');
  }

  try {
    const hospitalRef = admin.firestore().collection('hospitals').doc();
    const hospitalId = hospitalRef.id;

    await hospitalRef.set({
      name: hospitalName,
      address: address || '',
      phone: phone || '',
      isActive: true,
      subscription: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'অ্যাডমিন',
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      hospitalId: hospitalId,
      role: 'admin',
      approved: true,
    });

    await admin.firestore().doc(`hospitals/${hospitalId}/users/${userRecord.uid}`).set({
      name: 'অ্যাডমিন',
      email: adminEmail,
      role: 'admin',
      approved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const defaultDepts = [
      { name: 'মেডিসিন', icon: 'Stethoscope', color: '#1c5fa8', doctors: [] },
      { name: 'সার্জারি', icon: 'Scissors', color: '#d1392f', doctors: [] },
      { name: 'হৃদরোগ', icon: 'Heart', color: '#9c3a9c', doctors: [] },
    ];
    for (const dept of defaultDepts) {
      await admin.firestore().collection(`hospitals/${hospitalId}/departments`).add(dept);
    }

    const weekDays = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];
    for (const day of weekDays) {
      await admin.firestore().doc(`hospitals/${hospitalId}/panels/${day}`).set({
        name: day,
        title: `${day}ের ডক্টরস প্যানেল`,
        activeDoctorIds: [],
      });
    }

    await admin.firestore().doc(`hospitals/${hospitalId}/footer/data`).set({
      hospitalName: hospitalName,
      hospitalSubtitle: 'স্বাস্থ্যসেবায় বিশ্বাস',
      address: address || '',
      website: `${hospitalName.toLowerCase().replace(/\s/g, '')}.com`,
      contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
      phones: [''],
      logo: '/logo.png',
    });

    return {
      success: true,
      hospitalId,
      message: `${hospitalName} সফলভাবে তৈরি হয়েছে!`,
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ==================================================
// 2️⃣ cleanupOldProfileRequests
// ==================================================
// প্রতিদিন ভোর 4টায় (Asia/Dhaka)
// 30+ দিন আগের approved / rejected / cancelled profile requests মুছে ফেলে
// ==================================================
exports.cleanupOldProfileRequests = onSchedule(
  {
    schedule: '0 4 * * *',
    timeZone: 'Asia/Dhaka',
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('🧹 Cleanup profile requests older than', cutoff.toISOString());

    let totalDeleted = 0;
    let totalHospitals = 0;

    try {
      const hospitalsSnap = await db.collection('hospitals').get();

      for (const hospitalDoc of hospitalsSnap.docs) {
        const hospitalId = hospitalDoc.id;
        totalHospitals++;

        const reqRef = db
          .collection('hospitals')
          .doc(hospitalId)
          .collection('profileEditRequests');

        const snap = await reqRef
          .where('status', 'in', ['approved', 'rejected', 'cancelled'])
          .limit(500)
          .get();

        if (snap.empty) continue;

        const batch = db.batch();
        let hospitalDeleted = 0;

        snap.forEach((d) => {
          const data = d.data();
          const ts = data.reviewedAt || data.submittedAt;
          if (!ts) return;

          const t = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
          if (t < cutoff) {
            batch.delete(d.ref);
            hospitalDeleted++;
          }
        });

        if (hospitalDeleted > 0) {
          await batch.commit();
          totalDeleted += hospitalDeleted;
          console.log(`  🗑️  ${hospitalId}: ${hospitalDeleted} requests deleted`);
        }
      }

      console.log(`🎉 Cleanup complete!`);
      console.log(`📊 Total hospitals: ${totalHospitals}`);
      console.log(`📊 Total requests deleted: ${totalDeleted}`);
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
  }
);

// ==================================================
// 3️⃣ cleanupOldActivityLogs
// ==================================================
// প্রতিদিন ভোর 3টায় (Asia/Dhaka)
// 2 calendar month আগের সব activityLogs মুছে ফেলে
// ==================================================
exports.cleanupOldActivityLogs = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Asia/Dhaka',
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

    console.log(`🧹 Activity cleanup started at: ${now.toISOString()}`);
    console.log(`📅 Cutoff (2 months ago): ${cutoff.toISOString()}`);

    let totalDeleted = 0;
    let totalHospitals = 0;

    try {
      const hospitalsSnap = await db.collection('hospitals').get();

      for (const hospitalDoc of hospitalsSnap.docs) {
        const hospitalId = hospitalDoc.id;
        totalHospitals++;
        let hospitalDeleted = 0;
        let hasMore = true;

        while (hasMore) {
          const q = db
            .collection('hospitals')
            .doc(hospitalId)
            .collection('activityLogs')
            .where('timestamp', '<', cutoffTimestamp)
            .limit(500);

          const snap = await q.get();
          if (snap.empty) {
            hasMore = false;
            break;
          }

          const batch = db.batch();
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();

          hospitalDeleted += snap.size;
          totalDeleted += snap.size;

          console.log(`  🗑️  ${hospitalId}: ${snap.size} logs deleted (batch)`);

          if (snap.size < 500) hasMore = false;
        }

        if (hospitalDeleted > 0) {
          console.log(`✅ ${hospitalId}: total ${hospitalDeleted} logs deleted`);
        }
      }

      console.log(`\n🎉 Activity cleanup complete!`);
      console.log(`📊 Total hospitals processed: ${totalHospitals}`);
      console.log(`📊 Total logs deleted: ${totalDeleted}`);
      console.log(`📅 Cutoff used: ${cutoff.toISOString()}`);
    } catch (error) {
      console.error('❌ Activity cleanup error:', error);
      throw error;
    }
  }
);