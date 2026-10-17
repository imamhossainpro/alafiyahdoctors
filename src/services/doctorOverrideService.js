// src/services/doctorOverrideService.js
// ==================================================
// 🚫 Doctor Override Service — Chamber OFF / One-time Add
// ==================================================
// ✅ Firestore rules অনুযায়ী read=public, write=staff
// ✅ Error callback সহ (silent fail বন্ধ)
// ✅ BD timezone-safe
// ✅ idempotent (একই ডেটা দুবার লিখলে problem নেই)
// ==================================================
import {
  db,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from '../firebase';

const getDocRef = (hospitalId, doctorId, date) =>
  doc(db, 'hospitals', hospitalId, 'doctorOverrides', `${doctorId}_${date}`);

// ==================================================
// ✅ Chamber OFF set
// ==================================================
export const setChamberOff = async (hospitalId, doctorId, date, user) => {
  if (!hospitalId || !doctorId || !date) {
    throw new Error('hospitalId, doctorId, date required');
  }
  const ref = getDocRef(hospitalId, doctorId, date);
  await setDoc(ref, {
    type: 'off',
    doctorId,
    date,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || null,
  });
};

// ==================================================
// ✅ Chamber OFF clear
// ==================================================
export const clearChamberOff = async (hospitalId, doctorId, date) => {
  if (!hospitalId || !doctorId || !date) {
    throw new Error('hospitalId, doctorId, date required');
  }
  await deleteDoc(getDocRef(hospitalId, doctorId, date));
};

// ==================================================
// ✅ One-time doctor add
// ==================================================
export const addOneTimeDoctor = async (
  hospitalId,
  doctorId,
  date,
  doctorSnapshot,
  user
) => {
  if (!hospitalId || !doctorId || !date || !doctorSnapshot) {
    throw new Error('hospitalId, doctorId, date, doctorSnapshot required');
  }
  const ref = getDocRef(hospitalId, doctorId, date);
  await setDoc(ref, {
    type: 'add',
    doctorId,
    date,
    doctorSnapshot,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || null,
  });
};

// ==================================================
// ✅ One-time doctor remove
// ==================================================
export const removeOneTimeDoctor = async (hospitalId, doctorId, date) => {
  if (!hospitalId || !doctorId || !date) {
    throw new Error('hospitalId, doctorId, date required');
  }
  await deleteDoc(getDocRef(hospitalId, doctorId, date));
};

// ==================================================
// ✅ Get all overrides for a date (one-time fetch)
// ==================================================
export const getOverridesForDate = async (hospitalId, date) => {
  if (!hospitalId || !date) return { offIds: new Set(), addEntries: [] };

  try {
    const q = query(
      collection(db, 'hospitals', hospitalId, 'doctorOverrides'),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    const offIds = new Set();
    const addEntries = [];

    snap.forEach((d) => {
      const data = d.data();
      if (data.type === 'off') offIds.add(data.doctorId);
      if (data.type === 'add') addEntries.push({ id: d.id, ...data });
    });

    console.log(`📋 [Overrides] ${date}: ${offIds.size} off, ${addEntries.length} add`);
    return { offIds, addEntries };
  } catch (err) {
    console.error('❌ getOverridesForDate error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Real-time subscribe to OFF doctors
// ==================================================
export const subscribeToOffDoctors = (
  hospitalId,
  date,
  callback,
  errorCallback
) => {
  if (!hospitalId || !date) return () => {};

  const q = query(
    collection(db, 'hospitals', hospitalId, 'doctorOverrides'),
    where('date', '==', date),
    where('type', '==', 'off')
  );

  return onSnapshot(
    q,
    (snap) => {
      const ids = new Set();
      snap.forEach((d) => ids.add(d.data().doctorId));
      console.log(`📋 [OffDoctors realtime] ${date}:`, [...ids]);
      callback(ids);
    },
    (err) => {
      console.error('❌ subscribeToOffDoctors error:', err);
      errorCallback?.(err);
    }
  );
};

// ==================================================
// ✅ Real-time subscribe to ONE-TIME ADD doctors
// ==================================================
export const subscribeToOneTimeDoctors = (
  hospitalId,
  date,
  callback,
  errorCallback
) => {
  if (!hospitalId || !date) return () => {};

  const q = query(
    collection(db, 'hospitals', hospitalId, 'doctorOverrides'),
    where('date', '==', date),
    where('type', '==', 'add')
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      console.log(`📋 [OneTimeDoctors realtime] ${date}:`, list.length);
      callback(list);
    },
    (err) => {
      console.error('❌ subscribeToOneTimeDoctors error:', err);
      errorCallback?.(err);
    }
  );
};

// ==================================================
// ✅ Get one-time doctors (one-time fetch)
// ==================================================
export const getOneTimeDoctorsForDate = async (hospitalId, date) => {
  if (!hospitalId || !date) return [];

  try {
    const q = query(
      collection(db, 'hospitals', hospitalId, 'doctorOverrides'),
      where('date', '==', date),
      where('type', '==', 'add')
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.error('❌ getOneTimeDoctorsForDate error:', err);
    throw err;
  }
};