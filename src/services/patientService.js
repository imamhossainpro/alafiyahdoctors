// src/services/patientService.js
// ==================================================
// 🏥 Patient Service — CRUD + Visits + Cache
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==================================================
// ✅ Cache Layer (১ মিনিট TTL)
// ==================================================
let patientsCache = null;
let patientsCacheTimestamp = 0;
let patientsCacheHospitalId = null;
const CACHE_TTL = 60 * 1000;

export const invalidatePatientsCache = () => {
  patientsCache = null;
  patientsCacheTimestamp = 0;
  patientsCacheHospitalId = null;
};

// ==================================================
// ✅ Reference helper
// ==================================================
const getPatientsRef = (hospitalId) => {
  if (!hospitalId || typeof hospitalId !== 'string') {
    throw new Error('getPatientsRef: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
  }
  return collection(db, 'hospitals', hospitalId, 'patients');
};

const getPatientDocRef = (hospitalId, patientId) => {
  if (!hospitalId || !patientId) {
    throw new Error('getPatientDocRef: hospitalId and patientId required');
  }
  return doc(db, 'hospitals', hospitalId, 'patients', patientId);
};

// ==================================================
// ✅ Create patient
// ==================================================
export const createPatient = async (hospitalId, patientData) => {
  try {
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

    invalidatePatientsCache();
    return { id: docRef.id, ...patientData };
  } catch (error) {
    console.error('❌ createPatient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Add patient visit (sub-collection)
// ==================================================
export const addPatientVisit = async (hospitalId, visitData) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('addPatientVisit: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
    }

    const { patientId, ...rest } = visitData;
    if (!patientId) {
      throw new Error('addPatientVisit: patientId required');
    }

    // ✅ visits সাব-কালেকশনে লিখুন
    const visitsRef = collection(
      db,
      'hospitals',
      hospitalId,
      'patients',
      patientId,
      'visits'
    );

    const docRef = await addDoc(visitsRef, {
      ...rest,
      patientId,
      visitDate: rest.visitDate || Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      hospitalId,
      type: 'visit',
    });

    // ✅ patient doc-এর updatedAt আপডেট
    try {
      await updateDoc(getPatientDocRef(hospitalId, patientId), {
        updatedAt: Timestamp.now(),
        lastVisit: rest.visitDate || new Date().toISOString(),
      });
    } catch (updateErr) {
      console.warn('⚠️ Patient updatedAt update failed (non-critical):', updateErr.message);
    }

    invalidatePatientsCache();
    return { id: docRef.id, ...rest };
  } catch (error) {
    console.error('❌ addPatientVisit error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Find patient by mobile
// ==================================================
export const findPatientByMobile = async (hospitalId, mobileNumber) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('findPatientByMobile: hospitalId must be string');
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

// ==================================================
// ✅ Update patient
// ==================================================
export const updatePatient = async (hospitalId, patientId, data) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('updatePatient: hospitalId must be string');
    }
    if (!patientId) throw new Error('Patient ID required');

    const ref = getPatientDocRef(hospitalId, patientId);
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

// ==================================================
// ✅ Delete patient
// ==================================================
export const deletePatient = async (hospitalId, patientId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('deletePatient: hospitalId must be string');
    }
    const ref = getPatientDocRef(hospitalId, patientId);
    await deleteDoc(ref);

    invalidatePatientsCache();
    return { success: true };
  } catch (error) {
    console.error('❌ deletePatient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Fetch all patients (cached)
// ==================================================
export const fetchAllPatients = async (hospitalId, forceRefresh = false) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('fetchAllPatients: hospitalId must be string');
    }

    const now = Date.now();
    if (
      !forceRefresh &&
      patientsCache &&
      patientsCacheHospitalId === hospitalId &&
      now - patientsCacheTimestamp < CACHE_TTL
    ) {
      return patientsCache;
    }

    const ref = getPatientsRef(hospitalId);
    const q = query(ref);
    const snapshot = await getDocs(q);
    const patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    patientsCache = patients;
    patientsCacheTimestamp = now;
    patientsCacheHospitalId = hospitalId;

    return patients;
  } catch (error) {
    console.error('❌ fetchAllPatients error:', error);
    return [];
  }
};

export const getAllPatients = (hospitalId, forceRefresh = false) =>
  fetchAllPatients(hospitalId, forceRefresh);

// ==================================================
// ✅ Get patient by ID
// ==================================================
export const getPatientById = async (hospitalId, patientId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('getPatientById: hospitalId must be string');
    }
    const ref = getPatientDocRef(hospitalId, patientId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    return null;
  } catch (error) {
    console.error('❌ getPatientById error:', error);
    return null;
  }
};

// ==================================================
// ✅ Real-time listener
// ==================================================
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

// ==================================================
// ✅ Get patient count
// ==================================================
export const getPatientCount = async (hospitalId) => {
  try {
    if (!hospitalId || typeof hospitalId !== 'string') {
      throw new Error('getPatientCount: hospitalId must be string');
    }
    const ref = getPatientsRef(hospitalId);
    const snapshot = await getDocs(ref);
    return snapshot.size;
  } catch (error) {
    console.error('❌ getPatientCount error:', error);
    return 0;
  }
};

// ==================================================
// ✅ Get patient visits
// ==================================================
export const getPatientVisits = async (hospitalId, patientId) => {
  try {
    if (!hospitalId || !patientId) return [];
    const visitsRef = collection(
      db,
      'hospitals',
      hospitalId,
      'patients',
      patientId,
      'visits'
    );
    const q = query(visitsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getPatientVisits error:', error);
    return [];
  }
};

// ==================================================
// Default export
// ==================================================
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
  getPatientVisits,
  invalidatePatientsCache,
};