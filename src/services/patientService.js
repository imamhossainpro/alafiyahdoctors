// src/services/patientService.js
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// ১. রেফারেন্স হেল্পার (নিরাপদ)
// ==========================================

/**
 * পেশেন্ট কালেকশনের রেফারেন্স তৈরি করে
 * @param {string} hospitalId - হাসপিটালের আইডি (string হতে হবে)
 * @returns {CollectionReference}
 */
const getPatientsRef = (hospitalId) => {
  // ✅ hospitalId যাচাই
  if (!hospitalId || typeof hospitalId !== 'string') {
    throw new Error('getPatientsRef: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
  }
  return collection(db, 'hospitals', hospitalId, 'patients');
};

// ==========================================
// ২. পেশেন্ট ক্রিয়েট / আপডেট / ডিলিট
// ==========================================

/**
 * নতুন পেশেন্ট তৈরি করুন (createPatient)
 */
export const createPatient = async (hospitalId, patientData) => {
  try {
    // ✅ hospitalId যাচাই
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('createPatient: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }
    const ref = getPatientsRef(hospitalId);
    const docRef = await addDoc(ref, {
      ...patientData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      hospitalId,
    });
    return { id: docRef.id, ...patientData };
  } catch (error) {
    console.error('❌ createPatient error:', error);
    throw error;
  }
};

/**
 * পেশেন্ট ভিজিট যোগ করুন (addPatientVisit)
 */
export const addPatientVisit = async (hospitalId, visitData) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('addPatientVisit: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }
    const ref = getPatientsRef(hospitalId);
    const docRef = await addDoc(ref, {
      ...visitData,
      visitDate: visitData.visitDate || Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      hospitalId,
      type: 'visit',
    });
    return { id: docRef.id, ...visitData };
  } catch (error) {
    console.error('❌ addPatientVisit error:', error);
    throw error;
  }
};

/**
 * মোবাইল নম্বর দিয়ে পেশেন্ট খুঁজুন (findPatientByMobile)
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
    return { success: true };
  } catch (error) {
    console.error('❌ deletePatient error:', error);
    throw error;
  }
};

// ==========================================
// ৩. ডেটা ফেচ (One-time)
// ==========================================

/**
 * সব পেশেন্ট ফেচ করুন (fetchAllPatients)
 */
export const fetchAllPatients = async (hospitalId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('fetchAllPatients: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }
    const ref = getPatientsRef(hospitalId);
    const q = query(ref);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ fetchAllPatients error:', error);
    return [];
  }
};

// Alias for Overview.jsx
export const getAllPatients = (hospitalId) => fetchAllPatients(hospitalId);

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
// ৪. রিয়েল-টাইম লিসেনার
// ==========================================

/**
 * সব পেশেন্টের রিয়েল-টাইম লিসেনার
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
// ৫. ইউটিলিটি
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

// ==========================================
// ডিফল্ট এক্সপোর্ট
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
};