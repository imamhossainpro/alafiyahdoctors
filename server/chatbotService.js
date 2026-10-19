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

// ✅ নির্দিষ্ট কিছু প্রশ্নের জন্য ফিক্সড উত্তর
const FIXED_RESPONSES = {
  address: 'আমাদের ঠিকানা:\n📍 বাকলিয়া এক্সেস রোড, বাকলিয়া, চট্টগ্রাম।\n\nনিচের লিংকে ক্লিক করে গুগল ম্যাপে আমাদের অবস্থান দেখতে পারেন।',
  phone: 'আল-আফিয়া হাসপাতালের হেল্পলাইন:\n📞 ০১৮৮৬-৭৭৬৫১২\n\nযেকোনো প্রয়োজনে কল করুন।',
  test: 'চট্টগ্রামে সাশ্রয়ী মূল্যে উন্নতমানের স্বাস্থ্যসেবা পেতে চলে আসুন আল-আফিয়াহ হসপিটাল অ্যান্ড ডায়াগনস্টিক সেন্টার-এ।\n\nএখানে পাচ্ছেন সকল ধরনের প্যাথলজি পরীক্ষা, রেডিওলজি, আল্ট্রাসনোগ্রাফি, এক্স-রে ও ইকোসহ বিভিন্ন ডায়াগনস্টিক সেবা। পাশাপাশি থাকছে আকর্ষণীয় ডিসকাউন্টের সুবিধা।',
  booking: 'সিরিয়াল নিতে:\n১. ডাক্তারের নাম বা বিভাগ লিখুন (যেমন: "মেডিসিন ডাক্তার")।\n২. ডাক্তারের কার্ডের নিচে "সিরিয়াল দিন" বাটনে ক্লিক করুন।\n৩. নাম, মোবাইল নম্বর দিন।\n৪. "বুকিং নিশ্চিত করুন" চাপুন।',
};

// ✅ ১. এমবেডিং তৈরি (Google API)
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

// ✅ ২. উত্তর তৈরি (Groq API) - অজানা প্রশ্নের জন্য
async function generateAnswer(prompt) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;

  const systemPrompt = `
আপনি আল-আফিয়া হাসপাতালের একজন সহকারী।
কঠোর নিয়ম:
- কখনো বলবেন না আপনি AI, চ্যাটবট বা ভাষা-মডেল।
- কোনো ভূমিকা দেবেন না। সরাসরি উত্তর দিন।
- সর্বোচ্চ ২টি ছোট বাক্যে উত্তর দিন।
- রোগীর ভাষায় (বাংলা/ইংরেজি) উত্তর দিন।
- হাসপাতালের ঠিকানা: বাকলিয়া এক্সেস রোড, চট্টগ্রাম।
- ফোন: ০১৮৮৬-৭৭৬৫১২।
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
    return 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন বা হাসপাতালে কল করুন: ০১৮৮৬-৭৭৬৫১২';
  }
}

// ✅ ৩. কোসাইন সিমিলারিটি (ডাক্তার সার্চের জন্য)
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ✅ ৪. মূল ফাংশন
async function getChatbotAnswer(userQuestion) {
  try {
    if (!db) throw new Error('ডেটাবেস কানেক্টেড নেই।');

    const lowerQuestion = userQuestion.toLowerCase();

    // ✅ ১. ফিক্সড উত্তর চেক (ঠিকানা, ফোন, টেস্ট, বুকিং)
    if (lowerQuestion.includes('ঠিকানা') || lowerQuestion.includes('লোকেশন') || lowerQuestion.includes('location') || lowerQuestion.includes('ম্যাপ')) {
      return { text: FIXED_RESPONSES.address, doctors: [] };
    }
    if (lowerQuestion.includes('ফোন') || lowerQuestion.includes('মোবাইল') || lowerQuestion.includes('যোগাযোগ') || lowerQuestion.includes('কল')) {
      return { text: FIXED_RESPONSES.phone, doctors: [] };
    }
    if (lowerQuestion.includes('টেস্ট') || lowerQuestion.includes('মূল্য') || lowerQuestion.includes('প্যাথলজি') || lowerQuestion.includes('ডায়াগনস্টিক')) {
      return { text: FIXED_RESPONSES.test, doctors: [] };
    }
    if (lowerQuestion.includes('সিরিয়াল') || lowerQuestion.includes('বুক')) {
      return { text: FIXED_RESPONSES.booking, doctors: [] };
    }

    // ✅ ২. দিন/তারিখ বুঝতে চেষ্টা করা (আজ, আগামীকাল, নির্দিষ্ট তারিখ)
    let targetDate = new Date(); // ডিফল্ট আজকের তারিখ
    const daysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

    if (lowerQuestion.includes('কাল') || lowerQuestion.includes('tomorrow') || lowerQuestion.includes('আগামীকাল')) {
      targetDate.setDate(targetDate.getDate() + 1); // ১ দিন পর
    } else if (lowerQuestion.includes('পরশু')) {
      targetDate.setDate(targetDate.getDate() + 2); // ২ দিন পর
    } else {
      // নির্দিষ্ট তারিখ খোঁজা (যেমন: "২৫ অক্টোবর", "25 october")
      const dateMatch = lowerQuestion.match(/(\d{1,2})\s*(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i) || 
                        lowerQuestion.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
      
      const isoMatch = lowerQuestion.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        let monthKeyword = dateMatch[2].toLowerCase();
        let monthIndex = monthsBn.findIndex(m => m.toLowerCase().includes(monthKeyword) || monthKeyword.includes(m.toLowerCase()));
        
        if (monthIndex === -1) {
           const enMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
           monthIndex = enMonths.indexOf(monthKeyword.substring(0, 3));
        }
        if (monthIndex !== -1) {
          targetDate.setMonth(monthIndex, day);
        }
      } else if (isoMatch) {
        targetDate = new Date(isoMatch[1], parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
      }
    }

    const targetDayBn = daysBn[targetDate.getDay()];
    const isAskingForSpecificDate = 
      lowerQuestion.includes('কাল') || 
      lowerQuestion.includes('আগামীকাল') || 
      lowerQuestion.includes('পরশু') || 
      lowerQuestion.includes('tomorrow') || 
      lowerQuestion.match(/(\d{1,2})\s*(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i) !== null;

    const isAskingForToday = lowerQuestion.includes('আজ') || lowerQuestion.includes('today') || lowerQuestion.includes('আজকের');
    const departmentsList = ['মেডিসিন', 'গাইনী', 'সার্জারি', 'কার্ডিওলজি', 'অর্থোপেডিক', 'শিশু', 'চর্ম', 'নাক-কান-গলা'];
    const matchedDeptKeyword = departmentsList.find(dept => lowerQuestion.includes(dept));

    // প্যানেল লোড (নির্দিষ্ট দিনের জন্য)
    let activeDoctorIds = [];
    try {
      const panelRef = db.collection('hospitals').doc(HOSPITAL_ID).collection('panels').doc(targetDayBn);
      const panelSnap = await panelRef.get();
      if (panelSnap.exists) {
        activeDoctorIds = panelSnap.data().activeDoctorIds || [];
      }
    } catch (err) {
      console.error("Panel load error:", err.message);
    }

    const qEmbedding = await getEmbedding(userQuestion);
    const deptSnapshot = await db.collection('hospitals').doc(HOSPITAL_ID).collection('departments').get();
    let allDocs = [];

    for (const deptDoc of deptSnapshot.docs) {
      const deptData = deptDoc.data();
      const doctorsArray = deptData.doctors || [];

      for (const doc of doctorsArray) {
        if (!activeDoctorIds.includes(doc.id)) continue;

        if (matchedDeptKeyword) {
          const isDeptMatch = (deptData.name && deptData.name.includes(matchedDeptKeyword)) || 
                              (doc.specialty && doc.specialty.includes(matchedDeptKeyword)) ||
                              (doc.name && doc.name.includes(matchedDeptKeyword));
          if (!isDeptMatch) continue;
        }

        const subDocSnap = await deptDoc.ref.collection('doctors').doc(doc.id).get();
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
            originalIndex: doctorsArray.findIndex(d => d.id === doc.id) 
          });
        }
      }
    }

    let matchedDoctors = [];
    let isSpecificDoctorSearch = false;

    if (allDocs.length > 0) {
      const scoredDocs = allDocs.map(doc => ({ 
        ...doc, 
        score: cosineSimilarity(qEmbedding, doc.embedding) 
      }));

      const specificMatches = scoredDocs.filter(doc => {
         if (doc.name && lowerQuestion.includes(doc.name.toLowerCase())) return true;
         const nameParts = (doc.name || '').split(' ');
         return nameParts.some(part => part.length > 2 && lowerQuestion.includes(part.toLowerCase()));
      });

      if (specificMatches.length > 0) {
        isSpecificDoctorSearch = true;
        matchedDoctors = specificMatches.sort((a, b) => b.score - a.score).slice(0, 1); 
      } else {
        if (isAskingForSpecificDate || isAskingForToday) {
          matchedDoctors = scoredDocs.sort((a, b) => a.originalIndex - b.originalIndex).slice(0, 15); 
        } else {
          let relevantDocs = scoredDocs.filter(doc => doc.score > 0.2);
          if (relevantDocs.length === 0) {
            relevantDocs = scoredDocs.sort((a, b) => b.score - a.score).slice(0, 3);
          }
          matchedDoctors = relevantDocs.sort((a, b) => a.originalIndex - b.originalIndex).slice(0, 5);
        }
      }
    }

    // ✅ ডাক্তার পাওয়া গেলে
    if (matchedDoctors.length > 0) {
      let responseText = `${matchedDoctors.length} জন ডাক্তার পাওয়া গেছে:`;
      if (isSpecificDoctorSearch) {
        responseText = `ডাক্তারের তথ্য নিচে দেওয়া হলো।`;
      } else if (isAskingForSpecificDate) {
        const dateStr = targetDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
        responseText = matchedDeptKeyword 
          ? `${dateStr} তারিখে ${matchedDeptKeyword} বিভাগের ডাক্তার:` 
          : `${dateStr} তারিখের ডাক্তার:`;
      } else if (isAskingForToday) {
        responseText = matchedDeptKeyword ? `আজকের ${matchedDeptKeyword} বিভাগের ডাক্তার:` : `আজকের ডাক্তার:`;
      }

      return { text: responseText, doctors: matchedDoctors };
    }

    // ✅ ডাক্তার না পাওয়া গেলে
    if (matchedDeptKeyword || isAskingForToday || isAskingForSpecificDate || /ডাক্তার|ডাঃ|doctor|dr\b/i.test(userQuestion)) {
      return { text: 'এই বিষয়ে কোনো ডাক্তার পাওয়া যায়নি। অন্য নাম বা বিভাগ দিয়ে খুঁজুন।', doctors: [] };
    }

    // ✅ সাধারণ প্রশ্ন (Groq LLM)
    const generalPrompt = `প্রশ্ন: ${userQuestion}\nউপরের তথ্য থেকে সংক্ষেপে উত্তর দিন।`;
    const answer = await generateAnswer(generalPrompt);

    return { text: answer, doctors: [] };

  } catch (error) {
    console.error('Chatbot Service Error:', error.message);
    throw new Error(error.message); 
  }
}

module.exports = { getChatbotAnswer };