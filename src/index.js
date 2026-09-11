const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onSchedule } = require('firebase-functions/v2/scheduler');

admin.initializeApp();

// ==================================================
// Activity Logs Cleanup – 2 Calendar Month Retention
// ==================================================
// প্রতিদিন ভোর 3টায় (Asia/Dhaka) চলবে
// 2 calendar month এর আগের সব activityLogs ডিলিট করবে
//
// উদাহরণ: আজ যদি 10 September 2026 হয়
// → cutoff = 1 July 2026 (00:00)
// → July-এর আগের সব log delete
// ==================================================
exports.cleanupOldActivityLogs = onSchedule(
  {
    schedule: '0 3 * * *',           // প্রতিদিন ভোর 3টায়
    timeZone: 'Asia/Dhaka',
    region: 'asia-south1',           // আপনার region অনুযায়ী পরিবর্তন করুন (যেমন: us-central1)
    memory: '512MiB',
    timeoutSeconds: 540
  },
  async (event) => {
    const db = admin.firestore();

    // ✅ 2 calendar month cutoff
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

    console.log(`🧹 Cleanup started at: ${now.toISOString()}`);
    console.log(`📅 Cutoff (2 months ago): ${cutoff.toISOString()}`);

    let totalDeleted = 0;
    let totalHospitals = 0;

    try {
      // সব হাসপাতাল iterate
      const hospitalsSnap = await db.collection('hospitals').get();

      for (const hospitalDoc of hospitalsSnap.docs) {
        const hospitalId = hospitalDoc.id;
        totalHospitals++;
        let hospitalDeleted = 0;
        let hasMore = true;

        // Batch processing: একবারে 500 করে delete
        while (hasMore) {
          const q = db.collection('hospitals').doc(hospitalId)
            .collection('activityLogs')
            .where('timestamp', '<', cutoffTimestamp)
            .limit(500);

          const snap = await q.get();
          if (snap.empty) {
            hasMore = false;
            break;
          }

          const batch = db.batch();
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();

          hospitalDeleted += snap.size;
          totalDeleted += snap.size;

          console.log(`  🗑️  ${hospitalId}: ${snap.size} logs deleted (batch)`);

          // যদি 500-এর কম পাওয়া যায়, তাহলে আর বাকি নেই
          if (snap.size < 500) hasMore = false;
        }

        if (hospitalDeleted > 0) {
          console.log(`✅ ${hospitalId}: total ${hospitalDeleted} logs deleted`);
        }
      }

      console.log(`\n🎉 Cleanup complete!`);
      console.log(`📊 Total hospitals processed: ${totalHospitals}`);
      console.log(`📊 Total logs deleted: ${totalDeleted}`);
      console.log(`📅 Cutoff used: ${cutoff.toISOString()}`);

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
  }
);