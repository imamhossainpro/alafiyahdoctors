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

const getPatientsRef = (hospitalId) => collection(db, 'hospitals', hospitalId, 'patients');

// ==========================================
// ১. পেশেন্ট ক্রিয়েট / আপডেট / ডিলিট / খোঁজ
// ==========================================

export const createPatient = async (hospitalId, patientData) => {
  try {
    if (!hospitalId) throw new Error('Hospital ID is required');
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

export const addPatientVisit = async (hospitalId, visitData) => {
  try {
    if (!hospitalId) throw new Error('Hospital ID is required');
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

export const findPatientByMobile = async (hospitalId, mobileNumber) => {
  try {
    if (!hospitalId || !mobileNumber) return null;
    const q = query(getPatientsRef(hospitalId), where('mobile', '==', mobileNumber));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('❌ findPatientByMobile error:', error);
    return null;
  }
};

export const updatePatient = async (hospitalId, patientId, data) => {
  try {
    if (!hospitalId || !patientId) throw new Error('Hospital ID and Patient ID are required');
    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
    return { id: patientId, ...data };
  } catch (error) {
    console.error('❌ updatePatient error:', error);
    throw error;
  }
};

export const deletePatient = async (hospitalId, patientId) => {
  try {
    const ref = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('❌ deletePatient error:', error);
    throw error;
  }
};

// ==========================================
// ২. ডেটা ফেচ (One-time)
// ==========================================

export const fetchAllPatients = async (hospitalId) => {
  try {
    if (!hospitalId) return [];
    const q = query(getPatientsRef(hospitalId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ fetchAllPatients error:', error);
    return [];
  }
};

// Alias for Overview.jsx
export const getAllPatients = fetchAllPatients;

export const getPatientById = async (hospitalId, patientId) => {
  try {
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
// ৩. রিয়েল-টাইম লিসেনার
// ==========================================

export const subscribeToPatients = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(getPatientsRef(hospitalId), orderBy('createdAt', 'desc'));
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
// ৪. ইউটিলিটি
// ==========================================

export const getPatientCount = async (hospitalId) => {
  try {
    const snapshot = await getDocs(getPatientsRef(hospitalId));
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