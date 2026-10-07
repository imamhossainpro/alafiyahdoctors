// src/services/mouService.js
// ==================================================
// 📄 MoU Client Service — Firestore CRUD
// ==================================================
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Collection ref
// ==================================================
const getMouRef = (hospitalId) =>
  collection(db, 'hospitals', hospitalId, 'mouClients');

const getMouDocRef = (hospitalId, clientId) =>
  doc(db, 'hospitals', hospitalId, 'mouClients', clientId);

// ==================================================
// ✅ CREATE
// ==================================================
export const createMouClient = async (hospitalId, data, user) => {
  try {
    if (!hospitalId) throw new Error('Hospital ID required');
    if (!data?.org2_name?.trim()) throw new Error('Client name required');

    const payload = {
      ...data,
      hospitalId,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.uid || user?.id || null,
      createdByName: user?.name || user?.displayName || null,
    };

    const docRef = await addDoc(getMouRef(hospitalId), payload);
    console.log('✅ [mouService] Created:', docRef.id);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('❌ createMouClient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ UPDATE
// ==================================================
export const updateMouClient = async (hospitalId, clientId, data, user) => {
  try {
    if (!hospitalId || !clientId) throw new Error('Missing IDs');
    const ref = getMouDocRef(hospitalId, clientId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || user?.id || null,
      updatedByName: user?.name || user?.displayName || null,
    });
    console.log('✅ [mouService] Updated:', clientId);
    return { id: clientId, ...data };
  } catch (error) {
    console.error('❌ updateMouClient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ SOFT DELETE (archive)
// ==================================================
export const archiveMouClient = async (hospitalId, clientId, user) => {
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    await updateDoc(ref, {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: user?.uid || user?.id || null,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ archiveMouClient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ RESTORE
// ==================================================
export const restoreMouClient = async (hospitalId, clientId) => {
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    await updateDoc(ref, {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ restoreMouClient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ PERMANENT DELETE
// ==================================================
export const permanentlyDeleteMouClient = async (hospitalId, clientId) => {
  try {
    if (!hospitalId || !clientId) throw new Error('Missing IDs');
    await deleteDoc(getMouDocRef(hospitalId, clientId));
    console.log('🗑️ [mouService] Permanently deleted:', clientId);
    return { success: true };
  } catch (error) {
    console.error('❌ permanentlyDeleteMouClient error:', error);
    throw error;
  }
};

// ==================================================
// ✅ GET single
// ==================================================
export const getMouClient = async (hospitalId, clientId) => {
  try {
    const ref = getMouDocRef(hospitalId, clientId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('❌ getMouClient error:', error);
    return null;
  }
};

// ==================================================
// ✅ GET all (one-time)
// ==================================================
export const getAllMouClients = async (hospitalId) => {
  try {
    if (!hospitalId) return [];
    const q = query(getMouRef(hospitalId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getAllMouClients error:', error);
    return [];
  }
};

// ==================================================
// ✅ Real-time subscription
// ==================================================
export const subscribeToMouClients = (
  hospitalId,
  callback,
  errorCallback
) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(getMouRef(hospitalId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (callback) callback(list);
      },
      (err) => {
        console.error('❌ subscribeToMouClients error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToMouClients setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

// ==================================================
// ✅ Duplicate (client copy helper)
// ==================================================
export const duplicateMouClient = async (hospitalId, clientId, user) => {
  try {
    const original = await getMouClient(hospitalId, clientId);
    if (!original) throw new Error('Client not found');

    const { id, createdAt, updatedAt, ...rest } = original;
    const copy = {
      ...rest,
      org2_name: `${rest.org2_name} (Copy)`,
      status: 'draft',
    };

    return await createMouClient(hospitalId, copy, user);
  } catch (error) {
    console.error('❌ duplicateMouClient error:', error);
    throw error;
  }
};

export default {
  createMouClient,
  updateMouClient,
  archiveMouClient,
  restoreMouClient,
  permanentlyDeleteMouClient,
  getMouClient,
  getAllMouClients,
  subscribeToMouClients,
  duplicateMouClient,
};