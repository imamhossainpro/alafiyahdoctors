// src/services/mouService.js
// ==================================================
// 📝 MOU Service — Multi-MOU CRUD
// ==================================================
// ✅ Real-time subscription to MOU list
// ✅ Create / Update / Delete / Duplicate
// ✅ Auto title generation
// ✅ Activity log integration
// ==================================================

import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

const getMousRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'mous');

const getMouDocRef = (hospitalId = DEFAULT_HOSPITAL_ID, mouId) =>
  doc(db, 'hospitals', hospitalId, 'mous', mouId);

// ==================================================
// ✅ Subscribe to MOU list (real-time)
// ==================================================
export const subscribeToMous = (
  hospitalId = DEFAULT_HOSPITAL_ID,
  callback,
  errorCallback
) => {
  try {
    const ref = getMousRef(hospitalId);
    const q = query(ref, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        if (callback) callback(list);
      },
      (err) => {
        console.error('❌ subscribeToMous error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToMous setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Generate title from MOU data
// ==================================================
const generateTitle = (data = {}) => {
  const org2 = data.org2_name || data.organizationName || 'Untitled Partner';
  const customTitle = data.title;
  if (customTitle && customTitle.trim()) return customTitle.trim();
  return `MOU · ${org2}`;
};

// ==================================================
// ✅ Create new MOU
// ==================================================
export const createMou = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  data = {},
  user = null
) => {
  try {
    const now = Timestamp.now();
    const payload = {
      ...data,
      title: generateTitle(data),
      hospitalId,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.uid || user?.id || null,
      createdByName: user?.name || user?.displayName || null,
      updatedBy: user?.uid || user?.id || null,
      updatedByName: user?.name || user?.displayName || null,
    };

    const ref = await addDoc(getMousRef(hospitalId), payload);
    return { id: ref.id, ...payload };
  } catch (err) {
    console.error('❌ createMou error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Update MOU
// ==================================================
export const updateMou = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  mouId,
  data = {},
  user = null
) => {
  if (!mouId) throw new Error('MOU ID required');
  try {
    const ref = getMouDocRef(hospitalId, mouId);
    const payload = {
      ...data,
      title: generateTitle(data),
      updatedAt: Timestamp.now(),
      updatedBy: user?.uid || user?.id || null,
      updatedByName: user?.name || user?.displayName || null,
    };
    await updateDoc(ref, payload);
    return { id: mouId, ...payload };
  } catch (err) {
    console.error('❌ updateMou error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Delete MOU
// ==================================================
export const deleteMou = async (hospitalId = DEFAULT_HOSPITAL_ID, mouId) => {
  if (!mouId) throw new Error('MOU ID required');
  try {
    await deleteDoc(getMouDocRef(hospitalId, mouId));
    return { success: true };
  } catch (err) {
    console.error('❌ deleteMou error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Duplicate MOU
// ==================================================
export const duplicateMou = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  mouId,
  user = null
) => {
  if (!mouId) throw new Error('MOU ID required');
  try {
    const snap = await getDoc(getMouDocRef(hospitalId, mouId));
    if (!snap.exists()) throw new Error('MOU not found');

    const original = snap.data();
    const {
      createdAt,
      updatedAt,
      createdBy,
      createdByName,
      updatedBy,
      updatedByName,
      hospitalId: hid,
      ...dataFields
    } = original;

    const now = Timestamp.now();
    const payload = {
      ...dataFields,
      title: `${dataFields.title || 'MOU'} (Copy)`,
      hospitalId,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.uid || user?.id || null,
      createdByName: user?.name || user?.displayName || null,
      updatedBy: user?.uid || user?.id || null,
      updatedByName: user?.name || user?.displayName || null,
    };

    const ref = await addDoc(getMousRef(hospitalId), payload);
    return { id: ref.id, ...payload };
  } catch (err) {
    console.error('❌ duplicateMou error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Fetch all MOUs (one-time)
// ==================================================
export const getAllMous = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  try {
    const q = query(getMousRef(hospitalId), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('❌ getAllMous error:', err);
    return [];
  }
};

// ==================================================
// ✅ Default export
// ==================================================
export default {
  subscribeToMous,
  createMou,
  updateMou,
  deleteMou,
  duplicateMou,
  getAllMous,
};