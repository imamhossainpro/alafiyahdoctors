// generateEmbeddings.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
require('dotenv').config(); // ✅ .env লোড করার জন্য
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ✅ .env থেকে Key নেওয়া হচ্ছে
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const HOSPITAL_ID = 'alafiyah_main';

async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`;
  try {
    const response = await axios.post(url, {
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text: text }] },
    }, {
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }
    });
    return response.data.embedding.values;
  } catch (error) {
    throw new Error(JSON.stringify(error.response?.data || error.message));
  }
}

const createDoctorText = (doctor, deptName) => {
  return `ডাক্তারের নাম: ${doctor.name}. বিভাগ: ${deptName || ''}. বিশেষত্ব: ${doctor.specialty || ''}. সময়সূচি: ${doctor.timeSlots?.map(s => `${s.start} - ${s.end}`).join(', ') || ''}.`;
};

async function generateAndSaveEmbeddings() {
  const deptSnapshot = await db.collection('hospitals').doc(HOSPITAL_ID).collection('departments').get();
  console.log('🚀 ডেটা প্রসেসিং শুরু হচ্ছে...');
  let count = 0;

  for (const deptDoc of deptSnapshot.docs) {
    const deptData = deptDoc.data();
    const doctors = deptData.doctors || [];
    for (const doctor of doctors) {
      const text = createDoctorText(doctor, deptData.name);
      try {
        const embedding = await getEmbedding(text);
       // ✅ ডাক্তারের সব প্রয়োজনীয় তথ্য সেভ করুন
        await deptDoc.ref.collection('doctors').doc(doctor.id).set({ 
        text, 
        embedding,
        name: doctor.name || 'Unknown',
        specialty: doctor.specialty || '',
        imageUrl: doctor.imageUrl || '',
        timeSlots: doctor.timeSlots || [],
        deptName: deptData.name
        }, { merge: true });
        console.log(`✅ ${doctor.name} এর ভেক্টর তৈরি হয়েছে`);
        count++;
      } catch (err) {
        console.error(`❌ ${doctor.name} ব্যর্থ:`, err.message);
      }
    }
  }
  console.log(`🎉 সম্পন্ন! মোট ${count} জন ডাক্তারের ডেটা সেভ হয়েছে।`);
}

generateAndSaveEmbeddings();