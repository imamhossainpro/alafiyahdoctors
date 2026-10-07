// src/services/patientService.js
// ==================================================
// 👤 Patient Service — Full Fixed Version
// ==================================================
// ✅ Fix 1: addPatientVisit এখন patient doc-এর visits array-তে append করে
// ✅ Fix 2: Cache-aware fetch (1 min TTL)
// ✅ Fix 3: সব CRUD-এ cache invalidate
// ✅ Fix 4: subscribeToPatients real-time-এ cache sync করে
// ✅ Fix 5: Proper error handling + input validation
// ==================================================
import {
  collection,
  query,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  where,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// ✅ Cache Layer (১ মিনিট TTL)
// ==========================================
let patientsCache = null;
let patientsCacheTimestamp = 0;
let patientsCacheHospitalId = null;
const CACHE_TTL = 60 * 1000; // 1 মিনিট

/**
 * Cache invalidate করুন – কোনো create/update/delete এর পর কল করুন
 */
export const invalidatePatientsCache = () => {
  patientsCache = null;
  patientsCacheTimestamp = 0;
  patientsCacheHospitalId = null;
};

// ==========================================
// ✅ Reference helper (safe)
// ==========================================
const getPatientsRef = (hospitalId) => {
  if (!hospitalId || typeof hospitalId !== 'string') {
    throw new Error('getPatientsRef: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
  }
  return collection(db, 'hospitals', hospitalId, 'patients');
};

// ==========================================
// ✅ Patient CRUD
// ==========================================

/**
 * নতুন পেশেন্ট তৈরি করুন
 */
export const createPatient = async (hospitalId, patientData) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('createPatient: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const ref = getPatientsRef(hospitalId);

    // ✅ নতুন patient এর জন্য visits array ensure করুন
    const newPatient = {
      ...patientData,
      visits: Array.isArray(patientData.visits) ? patientData.visits : [],
      totalVisits: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      hospitalId,
    };

    const docRef = await addDoc(ref, newPatient);

    invalidatePatientsCache();

    return { id: docRef.id, ...newPatient };
  } catch (error) {
    console.error('❌ createPatient error:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: পেশেন্ট ভিজিট যোগ করুন
 * এখন arrayUnion দিয়ে patient doc-এর visits array-তে append করে
 * (আগে এটি নতুন patient doc বানাত — যা ছিল বড় bug)
 */
export const addPatientVisit = async (hospitalId, visitData) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('addPatientVisit: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const { patientId, doctorName, visitDate, appointmentId } = visitData || {};

    if (!patientId) {
      console.warn('⚠️ addPatientVisit: patientId নেই, visit skip করা হলো');
      return null;
    }

    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);

    // ✅ Patient doc exist করে কি না verify
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`⚠️ addPatientVisit: patient ${patientId} পাওয়া যায়নি`);
      return null;
    }

    const existingData = snap.data();
    const currentVisits = Array.isArray(existingData.visits) ? existingData.visits : [];

    const newVisit = {
      doctorName: doctorName || '',
      date: visitDate || new Date().toISOString().split('T')[0],
      appointmentId: appointmentId || null,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(ref, {
      visits: arrayUnion(newVisit),
      totalVisits: currentVisits.length + 1,
      lastVisitDate: newVisit.date,
      updatedAt: Timestamp.now(),
    });

    invalidatePatientsCache();

    return { id: patientId, visit: newVisit };
  } catch (error) {
    console.error('❌ addPatientVisit error:', error);
    throw error;
  }
};

/**
 * মোবাইল নম্বর দিয়ে পেশেন্ট খুঁজুন
 */
export const findPatientByMobile = async (hospitalId, mobileNumber) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('findPatientByMobile: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }
    if (!mobileNumber) return null;

    const ref = getPatientsRef(hospitalId);
    const q = query(ref, where('mobile', '==', mobileNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('❌ findPatientByMobile error:', error);
    return null;
  }
};

/**
 * পেশেন্ট আপডেট করুন
 */
export const updatePatient = async (hospitalId, patientId, data) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('updatePatient: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }
    if (!patientId) throw new Error('Patient ID required');

    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);

    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });

    invalidatePatientsCache();

    return { id: patientId, ...data };
  } catch (error) {
    console.error('❌ updatePatient error:', error);
    throw error;
  }
};

/**
 * পেশেন্ট ডিলিট করুন
 */
export const deletePatient = async (hospitalId, patientId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('deletePatient: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    await deleteDoc(ref);

    invalidatePatientsCache();

    return { success: true };
  } catch (error) {
    console.error('❌ deletePatient error:', error);
    throw error;
  }
};

// ==========================================
// ✅ Data Fetch (with Cache)
// ==========================================

/**
 * ✅ Cache-aware fetchAllPatients
 * - প্রথমবার Firestore থেকে load করবে
 * - পরেরবার (১ মিনিটের মধ্যে) cache থেকে দেবে
 */
export const fetchAllPatients = async (hospitalId, forceRefresh = false) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('fetchAllPatients: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const now = Date.now();

    // ✅ Cache hit
    if (
      !forceRefresh &&
      patientsCache &&
      patientsCacheHospitalId === hospitalId &&
      now - patientsCacheTimestamp < CACHE_TTL
    ) {
      return patientsCache;
    }

    // Cache miss – Firestore থেকে load
    const ref = getPatientsRef(hospitalId);
    const q = query(ref);
    const snapshot = await getDocs(q);
    const patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // ✅ Cache store
    patientsCache = patients;
    patientsCacheTimestamp = now;
    patientsCacheHospitalId = hospitalId;

    return patients;
  } catch (error) {
    console.error('❌ fetchAllPatients error:', error);
    return [];
  }
};

// Alias for Overview.jsx
export const getAllPatients = (hospitalId, forceRefresh = false) =>
  fetchAllPatients(hospitalId, forceRefresh);

/**
 * নির্দিষ্ট পেশেন্টের বিস্তারিত
 */
export const getPatientById = async (hospitalId, patientId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('getPatientById: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    return null;
  } catch (error) {
    console.error('❌ getPatientById error:', error);
    return null;
  }
};

// ==========================================
// ✅ Real-time Listener
// ==========================================

/**
 * সব পেশেন্টের রিয়েল-টাইম লিসেনার
 */
export const subscribeToPatients = (hospitalId, callback, errorCallback) => {
  if (!hospitalId || typeof hospitalId !== 'string') {
    console.warn('⚠️ subscribeToPatients: invalid hospitalId');
    return () => {};
  }

  try {
    const ref = getPatientsRef(hospitalId);
    const q = query(ref, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // ✅ Real-time update-এ cache-ও sync করুন
        patientsCache = patients;
        patientsCacheTimestamp = Date.now();
        patientsCacheHospitalId = hospitalId;

        if (callback) callback(patients);
      },
      (error) => {
        console.error('❌ subscribeToPatients error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToPatients setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

// ==========================================
// ✅ Utilities
// ==========================================

/**
 * পেশেন্ট কাউন্ট
 */
export const getPatientCount = async (hospitalId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('getPatientCount: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const ref = getPatientsRef(hospitalId);
    const snapshot = await getDocs(ref);
    return snapshot.size;
  } catch (error) {
    console.error('❌ getPatientCount error:', error);
    return 0;
  }
};

/**
 * ✅ নতুন helper: নির্দিষ্ট ডাক্তারের সাথে patient-এর visit count
 */
export const getPatientVisitsByDoctor = (patient, doctorName) => {
  if (!patient || !Array.isArray(patient.visits) || !doctorName) return [];
  return patient.visits.filter((v) => v.doctorName === doctorName);
};

// ==========================================
// ✅ Default Export
// ==========================================

export default {
  createPatient,
  addPatientVisit,
  findPatientByMobile,
  updatePatient,
  deletePatient,
  fetchAllPatients,
  getAllPatients,
  getPatientById,
  subscribeToPatients,
  getPatientCount,
  getPatientVisitsByDoctor,
  invalidatePatientsCache,
};