// functions/src/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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
    throw new functions.https.HttpsError('invalid-argument', 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক!');
  }

  try {
    const hospitalRef = admin.firestore().collection('hospitals').doc();
    const hospitalId = hospitalRef.id;
    await hospitalRef.set({
      name: hospitalName, address: address || '', phone: phone || '',
      isActive: true, subscription: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: 'অ্যাডমিন'
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      hospitalId: hospitalId,
      role: 'admin',
      approved: true
    });

    await admin.firestore().doc(`hospitals/${hospitalId}/users/${userRecord.uid}`).set({
      name: 'অ্যাডমিন', email: adminEmail, role: 'admin', approved: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const defaultDepts = [
      { name: 'মেডিসিন', icon: 'Stethoscope', color: '#1c5fa8', doctors: [] },
      { name: 'সার্জারি', icon: 'Scissors', color: '#d1392f', doctors: [] },
      { name: 'হৃদরোগ', icon: 'Heart', color: '#9c3a9c', doctors: [] }
    ];
    for (const dept of defaultDepts) {
      await admin.firestore().collection(`hospitals/${hospitalId}/departments`).add(dept);
    }

    const weekDays = ['শনিবার','রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার'];
    for (const day of weekDays) {
      await admin.firestore().doc(`hospitals/${hospitalId}/panels/${day}`).set({
        name: day, title: `${day}ের ডক্টরস প্যানেল`, activeDoctorIds: []
      });
    }

    await admin.firestore().doc(`hospitals/${hospitalId}/footer/data`).set({
      hospitalName: hospitalName,
      hospitalSubtitle: 'স্বাস্থ্যসেবায় বিশ্বাস',
      address: address || '',
      website: `${hospitalName.toLowerCase().replace(/\s/g, '')}.com`,
      contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
      phones: [''],
      logo: '/logo.png'
    });

    return { success: true, hospitalId, message: `${hospitalName} সফলভাবে তৈরি হয়েছে!` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});