// src/services/mouService.js
// ==================================================
// 📄 MOU Service — Firestore CRUD
// ==================================================
// Path: hospitals/{hospitalId}/mous/{mouId}
// ==================================================
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Reference helpers
// ==================================================
const getMousRef = (hospitalId) => {
  if (!hospitalId || typeof hospitalId !== 'string') {
    throw new Error('mouService: hospitalId অবশ্যই একটি স্ট্রিং হতে হবে।');
  }
  return collection(db, 'hospitals', hospitalId, 'mous');
};

const getMouDocRef = (hospitalId, mouId) =>
  doc(db, 'hospitals', hospitalId, 'mous', mouId);

// ==================================================
// ✅ Auto-generate MOU id
// ==================================================
const makeMouId = () =>
  'mou_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ==================================================
// ✅ CREATE
// ==================================================
export const createMou = async (hospitalId, data, user) => {
  try {
    if (!hospitalId) throw new Error('hospitalId is required');
    if (!data) throw new Error('data is required');

    const mouId = makeMouId();
    const ref = getMouDocRef(hospitalId, mouId);

    // Title: Institution 2-এর নাম (fallback: "Untitled MOU")
    const title = (data.org2_name || '').trim() || 'Untitled MOU';

    await setDoc(ref, {
      ...data,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid || null,
      createdByName: user?.name || user?.displayName || null,
      hospitalId,
    });

    return { id: mouId, ...data, title };
  } catch (error) {
    console.error('❌ createMou error:', error);
    throw error;
  }
};

// ==================================================
// ✅ UPDATE
// ==================================================
export const updateMou = async (hospitalId, mouId, data, user) => {
  try {
    if (!hospitalId || !mouId) throw new Error('hospitalId & mouId required');
    const ref = getMouDocRef(hospitalId, mouId);

    const title = (data.org2_name || '').trim() || 'Untitled MOU';

    await updateDoc(ref, {
      ...data,
      title,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || null,
      updatedByName: user?.name || user?.displayName || null,
    });

    return { id: mouId, ...data, title };
  } catch (error) {
    console.error('❌ updateMou error:', error);
    throw error;
  }
};

// ==================================================
// ✅ DELETE
// ==================================================
export const deleteMou = async (hospitalId, mouId) => {
  try {
    if (!hospitalId || !mouId) throw new Error('hospitalId & mouId required');
    await deleteDoc(getMouDocRef(hospitalId, mouId));
    return { success: true };
  } catch (error) {
    console.error('❌ deleteMou error:', error);
    throw error;
  }
};

// ==================================================
// ✅ GET one
// ==================================================
export const getMou = async (hospitalId, mouId) => {
  try {
    if (!hospitalId || !mouId) return null;
    const snap = await getDoc(getMouDocRef(hospitalId, mouId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('❌ getMou error:', error);
    return null;
  }
};

// ==================================================
// ✅ GET all (one-time)
// ==================================================
export const getAllMous = async (hospitalId) => {
  try {
    if (!hospitalId) return [];
    const q = query(getMousRef(hospitalId), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getAllMous error:', error);
    return [];
  }
};

// ==================================================
// ✅ SUBSCRIBE (real-time)
// ==================================================
export const subscribeToMous = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) {
    console.warn('⚠️ subscribeToMous: hospitalId নেই');
    return () => {};
  }
  try {
    const q = query(getMousRef(hospitalId), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const mous = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (callback) callback(mous);
      },
      (error) => {
        console.error('❌ subscribeToMous error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToMous setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

// ==================================================
// ✅ DUPLICATE
// ==================================================
export const duplicateMou = async (hospitalId, mouId, user) => {
  try {
    const original = await getMou(hospitalId, mouId);
    if (!original) throw new Error('Original MOU not found');

    const { id, createdAt, updatedAt, createdBy, createdByName, updatedBy, updatedByName, ...data } = original;

    return await createMou(hospitalId, data, user);
  } catch (error) {
    console.error('❌ duplicateMou error:', error);
    throw error;
  }
};

export default {
  createMou,
  updateMou,
  deleteMou,
  getMou,
  getAllMous,
  subscribeToMous,
  duplicateMou,
};