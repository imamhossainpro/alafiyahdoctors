// src/services/mouService.js
// ==================================================
// 📝 MOU Service — Multi-MOU CRUD + Client Manager
// ==================================================
// ✅ সব ডেটা একই `mous` collection-এ থাকে
// ✅ Multi-MOU CRUD (পুরনো MOUGenerator)
// ✅ MoU Client Manager CRUD (নতুন MoUClientManager)
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

// ✅ একটাই collection: `mous`
const getMousRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  collection(db, 'hospitals', hospitalId, 'mous');

const getMouDocRef = (hospitalId = DEFAULT_HOSPITAL_ID, mouId) =>
  doc(db, 'hospitals', hospitalId, 'mous', mouId);

// ==================================================
// ✅ Multi-MOU CRUD (পুরনো MOUGenerator-এর জন্য)
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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

const generateTitle = (data = {}) => {
  const org2 = data.org2_name || data.organizationName || 'Untitled Partner';
  const customTitle = data.title;
  if (customTitle && customTitle.trim()) return customTitle.trim();
  return `MOU · ${org2}`;
};

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
      createdAt, updatedAt, createdBy, createdByName,
      updatedBy, updatedByName, hospitalId: hid, ...dataFields
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
// ✅ MOU Client Manager CRUD (একই `mous` collection)
// ==================================================

// ✅ Subscribe — MoUClientManager-এর জন্য
export const subscribeToMouClients = (
  hospitalId = DEFAULT_HOSPITAL_ID,
  callback,
  errorCallback
) => {
  try {
    const ref = getMousRef(hospitalId); // ✅ একই collection
    const q = query(ref, orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (callback) callback(list);
      },
      (err) => {
        console.error('❌ subscribeToMouClients error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToMouClients setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

export const createMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  data = {},
  user = null
) => {
  try {
    const now = Timestamp.now();
    const payload = {
      ...data,
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archivedByName: null,
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
    console.error('❌ createMouClient error:', err);
    throw err;
  }
};

export const updateMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId,
  data = {},
  user = null
) => {
  if (!clientId) throw new Error('Client ID required');
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    const payload = {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy: user?.uid || user?.id || null,
      updatedByName: user?.name || user?.displayName || null,
    };
    await updateDoc(ref, payload);
    return { id: clientId, ...payload };
  } catch (err) {
    console.error('❌ updateMouClient error:', err);
    throw err;
  }
};

export const archiveMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId,
  user = null
) => {
  if (!clientId) throw new Error('Client ID required');
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    await updateDoc(ref, {
      isArchived: true,
      archivedAt: Timestamp.now(),
      archivedBy: user?.uid || user?.id || null,
      archivedByName: user?.name || user?.displayName || null,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (err) {
    console.error('❌ archiveMouClient error:', err);
    throw err;
  }
};

export const restoreMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId
) => {
  if (!clientId) throw new Error('Client ID required');
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    await updateDoc(ref, {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archivedByName: null,
      restoredAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (err) {
    console.error('❌ restoreMouClient error:', err);
    throw err;
  }
};

export const permanentlyDeleteMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId
) => {
  if (!clientId) throw new Error('Client ID required');
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Client not found');
    if (snap.data().isArchived !== true) {
      throw new Error('শুধুমাত্র আর্কাইভ করা client স্থায়ীভাবে মুছা যাবে');
    }
    await deleteDoc(ref);
    return { success: true };
  } catch (err) {
    console.error('❌ permanentlyDeleteMouClient error:', err);
    throw err;
  }
};

export const duplicateMouClient = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId,
  user = null
) => {
  if (!clientId) throw new Error('Client ID required');
  try {
    const snap = await getDoc(getMouDocRef(hospitalId, clientId));
    if (!snap.exists()) throw new Error('Client not found');

    const original = snap.data();
    const {
      createdAt, updatedAt, createdBy, createdByName,
      updatedBy, updatedByName, archivedAt, archivedBy,
      archivedByName, restoredAt, hospitalId: hid, ...dataFields
    } = original;

    const now = Timestamp.now();
    const payload = {
      ...dataFields,
      org2_name: `${dataFields.org2_name || 'Untitled'} (Copy)`,
      status: 'draft',
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archivedByName: null,
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
    console.error('❌ duplicateMouClient error:', err);
    throw err;
  }
};

export const getMouClientById = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  clientId
) => {
  if (!clientId) return null;
  try {
    const snap = await getDoc(getMouDocRef(hospitalId, clientId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('❌ getMouClientById error:', err);
    return null;
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
  subscribeToMouClients,
  createMouClient,
  updateMouClient,
  archiveMouClient,
  restoreMouClient,
  permanentlyDeleteMouClient,
  duplicateMouClient,
  getMouClientById,
};