import { db, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, onSnapshot, deleteDoc } from '../firebase';

// 🔍 মোবাইল নম্বর দিয়ে রোগী খোঁজা
export const findPatientByMobile = async (mobile) => {
  try {
    const q = query(collection(db, 'patients'), where('mobile', '==', mobile));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Find patient error:', error);
    return null;
  }
};

// 📝 নতুন রোগী তৈরি
export const createPatient = async (patientData) => {
  try {
    const newPatient = {
      ...patientData,
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'patients'), newPatient);
    return { id: docRef.id, ...newPatient };
  } catch (error) {
    console.error('Create patient error:', error);
    return null;
  }
};

// ➕ নতুন ভিজিট যোগ করা
export const addPatientVisit = async (patientId, doctorName, date) => {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Patient not found');
    
    const data = docSnap.data();
    const visits = data.visits || [];
    visits.push({ doctorName, date });
    
    await updateDoc(docRef, {
      visits: visits,
      updatedAt: new Date().toISOString()
    });
    return visits;
  } catch (error) {
    console.error('Add patient visit error:', error);
    throw error;
  }
};

// 🏷️ রোগীর ক্যাটাগরি নির্ধারণ (নতুন/রিপোর্ট/ফলোআপ)
export const getPatientCategory = (visits, doctorName, currentDate) => {
  // যদি visits না থাকে বা খালি হয়
  if (!visits || visits.length === 0) return 'নতুন';
  
  // ডাক্তার অনুযায়ী ফিল্টার
  const doctorVisits = visits.filter(v => v.doctorName === doctorName);
  
  // যদি ওই ডাক্তারের কোনো ভিজিট না থাকে
  if (doctorVisits.length === 0) return 'নতুন';
  
  // তারিখ অনুযায়ী সাজানো (সবচেয়ে নতুন আগে)
  const sorted = [...doctorVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastVisit = sorted[0];
  
  // দিনের পার্থক্য বের করা
  const lastDate = new Date(lastVisit.date);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current - lastDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return 'রিপোর্ট';
  } else {
    return 'ফলোআপ';
  }
};

// 👤 রোগীর আইডি দিয়ে ডেটা পাওয়া
export const getPatientById = async (patientId) => {
  if (!patientId) return null;
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Get patient error:', error);
    return null;
  }
};

// 📊 সব রোগীর তালিকা (একবারের জন্য)
export const getAllPatients = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'patients'));
    const patients = [];
    snapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    return patients;
  } catch (error) {
    console.error('Get all patients error:', error);
    return [];
  }
};

// 📊 সব রোগীর তালিকা (রিয়েল-টাইম)
export const subscribeToPatients = (callback) => {
  return onSnapshot(collection(db, 'patients'), (snapshot) => {
    const patients = [];
    snapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    callback(patients);
  });
};

// 🆕 ম্যানুয়ালি রোগীর টাইপ আপডেট (অ্যাডমিনের জন্য)
export const updatePatientCategory = async (patientId, newTotalVisits) => {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Patient not found');
    
    // নতুন টাইপ অনুযায়ী visits অ্যারে অ্যাডজাস্ট করা
    const data = docSnap.data();
    let visits = data.visits || [];
    
    // যদি 'নতুন' সেট করতে চায়, তাহলে visits অ্যারে খালি করে দেব
    // যাতে পরবর্তী বুকিংয়ে নতুন হিসেবে গণ্য হয়
    if (newTotalVisits === 1) {
      // শুধু ম্যানুয়ালি সেট করতে দেব, অটো হিসাব নয়
      // আমরা visits অ্যারে অপরিবর্তিত রাখব, কিন্তু ক্যাটাগরি নির্ধারণের জন্য totalVisits ব্যবহার করব
    }
    
    // totalVisits ফিল্ড যোগ করা (ঐচ্ছিক, কিন্তু রিপোর্টিংয়ে সাহায্য করে)
    await updateDoc(docRef, {
      totalVisits: newTotalVisits,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Update patient category error:', error);
    throw error;
  }
};