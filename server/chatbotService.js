// chatbotService.js
const axios = require('axios');
const { getFirestore } = require('firebase-admin/firestore');
const { getApps } = require('firebase-admin/app');
require('dotenv').config();

// ✅ .env থেকে Key নেওয়া হচ্ছে
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let db;
if (getApps().length > 0) {
  db = getFirestore();
}

const HOSPITAL_ID = 'alafiyah_main';

// ==================================================
// ✅ বুকিং-সংক্রান্ত "কীভাবে" প্রশ্ন চেনার regex
// ==================================================
const BOOKING_QUERY_PATTERNS = [
  /কিভাবে?.*বুক/i,
  /কীভাবে?.*বুক/i,
  /কিভাবে?.*সিরিয়াল/i,
  /কীভাবে?.*সিরিয়াল/i,
  /সিরিয়াল.*কিভাবে?/i,
  /সিরিয়াল.*কীভাবে?/i,
  /বুকিং.*কিভাবে?/i,
  /বুকিং.*কীভাবে?/i,
  /অ্যাপয়েন্টমেন্ট.*কিভাবে?/i,
  /অ্যাপয়েন্টমেন্ট.*কীভাবে?/i,
  /appointment.*how/i,
  /how.*book/i,
  /book.*appointment/i,
  /সিরিয়াল.*নিতে/i,
  /সিরিয়াল.*দিতে/i,
  /কিভাবে?.*অ্যাপয়েন্টমেন্ট/i,
];

function isBookingHowToQuery(question) {
  if (!question) return false;
  return BOOKING_QUERY_PATTERNS.some((re) => re.test(question));
}

// ==================================================
// ✅ বুকিং-সংক্রান্ত প্রশ্নের fixed response
// ==================================================
const BOOKING_HOWTO_RESPONSE =
  'সিরিয়াল নিতে:\n\n' +
  '১. উপরে ডাক্তারের নাম লিখুন বা বিভাগ বলুন (যেমন: "মেডিসিন ডাক্তার")।\n' +
  '২. ডাক্তারের কার্ডের নিচে "সিরিয়াল দিন" বাটনে ক্লিক করুন।\n' +
  '৩. নাম, মোবাইল নম্বর, বয়স দিন।\n' +
  '৪. "বুকিং নিশ্চিত করুন" চাপুন।\n\n' +
  'আপনার সিরিয়াল নম্বর সাথে সাথেই দেখতে পাবেন।';

// ==================================================
// ✅ ১. এমবেডিং তৈরি (Google API)
// ==================================================
async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`;
  try {
    const response = await axios.post(
      url,
      {
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: text }] },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
      }
    );
    return response.data.embedding.values;
  } catch (error) {
    throw new Error(JSON.stringify(error.response?.data || error.message));
  }
}

// ==================================================
// ✅ ২. উত্তর তৈরি (Groq API) — শুধু সাধারণ প্রশ্নে
// ==================================================
async function generateAnswer(prompt) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;

  const systemPrompt = `
আপনি আল-আফিয়া হাসপাতালের তথ্য সহকারী।
কঠোর নিয়ম:
- কখনো বলবেন না আপনি AI, চ্যাটবট, সহকারী বা ভাষা-মডেল।
- কোনো ভূমিকা দেবেন না। "আমি খুঁজছি", "আমি দেখছি", "নিচে দেওয়া হলো" — এসব বাক্য লিখবেন না।
- সর্বোচ্চ ২টি ছোট বাক্যে সরাসরি উত্তর দিন।
- রোগীর ভাষায় (বাংলা/ইংরেজি) উত্তর দিন।
`;

  try {
    const response = await axios.post(
      url,
      {
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 200,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API Error:', error.response?.data || error.message);

    // ✅ NEW: Friendly fallback — raw error নয়
    return 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন বা হাসপাতালে কল করুন: ০১৮৮৬-৭৭৬৫১২';
  }
}

// ==================================================
// ✅ ৩. কোসাইন সিমিলারিটি
// ==================================================
function cosineSimilarity(vecA, vecB) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ==================================================
// ✅ ৪. ডাক্তার কার্ডের ছোট সংকেত বাক্য (AI কথা ছাড়া)
// ==================================================
function buildDoctorIntroText({
  isSpecificDoctorSearch,
  isAskingForToday,
  matchedDeptKeyword,
  count,
}) {
  if (count === 0) {
    return 'এই বিষয়ে কোনো ডাক্তার পাওয়া যায়নি। অন্য নাম বা বিভাগ দিয়ে খুঁজুন।';
  }
  if (isSpecificDoctorSearch) {
    return 'ডাক্তারের তথ্য নিচে দেওয়া হলো।';
  }
  if (isAskingForToday && matchedDeptKeyword) {
    return `আজকের ${matchedDeptKeyword} বিভাগের ডাক্তার:`;
  }
  if (isAskingForToday) {
    return 'আজকের ডাক্তার:';
  }
  return `${count} জন ডাক্তার পাওয়া গেছে:`;
}

// ==================================================
// ✅ ৫. মূল ফাংশন
// ==================================================
async function getChatbotAnswer(userQuestion) {
  try {
    if (!db) throw new Error('ডেটাবেস কানেক্টেড নেই।');

    // ==================================================
    // ✅ NEW: "কীভাবে বুক করবো" প্রশ্নে সরাসরি গাইড (LLM ছাড়া)
    // ==================================================
    if (isBookingHowToQuery(userQuestion)) {
      return {
        text: BOOKING_HOWTO_RESPONSE,
        doctors: [],
      };
    }

    const lowerQuestion = userQuestion.toLowerCase();

    // ✅ আজকের ডাক্তার চাইছে কিনা
    const isAskingForToday =
      lowerQuestion.includes('আজ') ||
      lowerQuestion.includes('today') ||
      lowerQuestion.includes('আজকের');

    // ✅ নির্দিষ্ট বিভাগ চাইছে কিনা
    const departmentsList = [
      'মেডিসিন',
      'গাইনী',
      'সার্জারি',
      'কার্ডিওলজি',
      'অর্থোপেডিক',
      'শিশু',
      'চর্ম',
      'নাক-কান-গলা',
    ];
    const matchedDeptKeyword = departmentsList.find((dept) =>
      lowerQuestion.includes(dept)
    );

    // ✅ আজকের বাংলা দিন
    const daysBn = [
      'রবিবার',
      'সোমবার',
      'মঙ্গলবার',
      'বুধবার',
      'বৃহস্পতিবার',
      'শুক্রবার',
      'শনিবার',
    ];
    const today = new Date();
    const todayBn = daysBn[today.getDay()];

    // ✅ আজকের প্যানেল থেকে ডাক্তার আইডি
    let activeDoctorIds = [];
    try {
      const panelRef = db
        .collection('hospitals')
        .doc(HOSPITAL_ID)
        .collection('panels')
        .doc(todayBn);
      const panelSnap = await panelRef.get();
      if (panelSnap && panelSnap.data) {
        const panelData = panelSnap.data();
        if (panelData) {
          activeDoctorIds = panelData.activeDoctorIds || [];
        }
      }
    } catch (err) {
      console.error('Panel load error:', err.message);
    }

    // ✅ প্রশ্নের ভেক্টর
    const qEmbedding = await getEmbedding(userQuestion);

    // ✅ ডাক্তার ডেটা লোড
    const deptSnapshot = await db
      .collection('hospitals')
      .doc(HOSPITAL_ID)
      .collection('departments')
      .get();
    let allDocs = [];

    for (const deptDoc of deptSnapshot.docs) {
      const deptData = deptDoc.data();
      const doctorsArray = deptData.doctors || [];

      for (const doc of doctorsArray) {
        if (!activeDoctorIds.includes(doc.id)) continue;

        if (matchedDeptKeyword) {
          const isDeptMatch =
            (deptData.name && deptData.name.includes(matchedDeptKeyword)) ||
            (doc.specialty && doc.specialty.includes(matchedDeptKeyword)) ||
            (doc.name && doc.name.includes(matchedDeptKeyword));
          if (!isDeptMatch) continue;
        }

        const subDocSnap = await deptDoc.ref
          .collection('doctors')
          .doc(doc.id)
          .get();
        const subData = subDocSnap.exists ? subDocSnap.data() : null;

        if (subData && subData.embedding) {
          allDocs.push({
            id: doc.id,
            name: doc.name || 'Unknown',
            specialty: doc.specialty || '',
            timeSlots: doc.timeSlots || [],
            imageUrl: doc.imageUrl || '',
            deptName: deptData.name,
            text: subData.text,
            embedding: subData.embedding,
            originalIndex: doctorsArray.findIndex((d) => d.id === doc.id),
          });
        }
      }
    }

    // ✅ ভেক্টর ম্যাচিং
    let matchedDoctors = [];
    let isSpecificDoctorSearch = false;

    if (allDocs.length > 0) {
      const scoredDocs = allDocs.map((doc) => ({
        ...doc,
        score: cosineSimilarity(qEmbedding, doc.embedding),
      }));

      const specificMatches = scoredDocs.filter((doc) => {
        if (doc.name && lowerQuestion.includes(doc.name.toLowerCase()))
          return true;
        const nameParts = (doc.name || '').split(' ');
        return nameParts.some(
          (part) => part.length > 2 && lowerQuestion.includes(part.toLowerCase())
        );
      });

      if (specificMatches.length > 0) {
        isSpecificDoctorSearch = true;
        matchedDoctors = specificMatches
          .sort((a, b) => b.score - a.score)
          .slice(0, 1);
      } else {
        if (isAskingForToday) {
          matchedDoctors = scoredDocs
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .slice(0, 15);
        } else {
          let relevantDocs = scoredDocs.filter((doc) => doc.score > 0.2);
          if (relevantDocs.length === 0) {
            relevantDocs = scoredDocs
              .sort((a, b) => b.score - a.score)
              .slice(0, 3);
          }
          matchedDoctors = relevantDocs
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .slice(0, 5);
        }
      }
    }

    // ==================================================
    // ✅ ডাক্তার পাওয়া গেলে LLM কল হবে না — শুধু সংক্ষিপ্ত টেক্সট
    // ==================================================
    if (matchedDoctors.length > 0) {
      const introText = buildDoctorIntroText({
        isSpecificDoctorSearch,
        isAskingForToday,
        matchedDeptKeyword,
        count: matchedDoctors.length,
      });

      return {
        text: introText,
        doctors: matchedDoctors,
      };
    }

    // ✅ ডাক্তার-সার্চ সংক্রান্ত প্রশ্ন কিন্তু ডাক্তার পাওয়া যায়নি
    const isDoctorQuery =
      matchedDeptKeyword ||
      isAskingForToday ||
      /ডাক্তার|ডাঃ|doctor|dr\b|বিশেষজ্ঞ|স্পেশালিস্ট/i.test(userQuestion);

    if (isDoctorQuery) {
      return {
        text: 'এই বিষয়ে কোনো ডাক্তার পাওয়া যায়নি। অন্য নাম বা বিভাগ দিয়ে খুঁজুন।',
        doctors: [],
      };
    }

    // ==================================================
    // ✅ সাধারণ প্রশ্ন (ঠিকানা, ফোন, সময়, বুকিং গাইড) — সংক্ষিপ্ত LLM উত্তর
    // ==================================================
    const generalPrompt = `
প্রশ্ন: ${userQuestion}

হাসপাতালের তথ্য:
- নাম: আল-আফিয়া হাসপাতাল
- ঠিকানা: বাকলিয়া এক্সেস রোড, বাকলিয়া, চট্টগ্রাম
- ফোন: ০১৮৮৬-৭৭৬৫১২
- সিরিয়াল বুকিং: চ্যাটে ডাক্তারের নাম/বিভাগ লিখুন, তারপর ডাক্তারের কার্ডে "সিরিয়াল দিন" বাটনে ক্লিক করুন।

উপরের তথ্য থেকে সর্বোচ্চ ২ ছোট বাক্যে সরাসরি উত্তর দিন। কোনো ভূমিকা নয়।
    `.trim();

    const answer = await generateAnswer(generalPrompt);

    return {
      text: answer,
      doctors: [],
    };
  } catch (error) {
    console.error('Chatbot Service Error:', error.message);
    throw new Error(error.message);
  }
}

module.exports = { getChatbotAnswer };