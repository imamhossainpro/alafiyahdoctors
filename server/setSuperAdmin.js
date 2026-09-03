// server/setSuperAdmin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔥 আপনার নিজের UID বসান
const USER_UID = 'K2UY6lfxGKWsHjtuxURSyGggmbC2'; // Firebase Console → Authentication → Users → আপনার UID কপি করুন

async function setSuperAdmin() {
  try {
    await admin.auth().setCustomUserClaims(USER_UID, {
      hospitalId: 'alafiyah_main',
      role: 'super_admin',
      approved: true
    });
    console.log(`✅ ইউজার ${USER_UID} কে সুপার অ্যাডমিন বানানো হয়েছে!`);
  } catch (error) {
    console.error('❌ ব্যর্থ:', error);
  }
}

setSuperAdmin();