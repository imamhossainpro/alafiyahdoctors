// functions/src/cleanupProfileRequests.js
// ==================================================
// 🧹 Auto cleanup old profile edit requests (30+ days)
// ==================================================
// প্রতিদিন ভোর 4টায় (Asia/Dhaka) চলে
// 30+ দিন আগের approved/rejected/cancelled রিকোয়েস্ট মুছে ফেলে
// ==================================================
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

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
          .collection('hospitals').doc(hospitalId)
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