// src/services/doctorOverrideService.js
// ==================================================
// 🚫 Doctor Override Service — Chamber OFF / One-time Add
// ==================================================
import { db, doc, setDoc, deleteDoc, getDocs, collection, query, where, onSnapshot, serverTimestamp } from '../firebase';

const getDocRef = (hospitalId, doctorId, date) => 
  doc(db, 'hospitals', hospitalId, 'doctorOverrides', `${doctorId}_${date}`);

export const setChamberOff = async (hospitalId, doctorId, date, user) => {
  const ref = getDocRef(hospitalId, doctorId, date);
  await setDoc(ref, {
    type: 'off',
    doctorId,
    date,
    createdAt: serverTimestamp(),
    createdBy: user?.uid || null,
  });
};

export const clearChamberOff = async (hospitalId, doctorId, date) => {
  await deleteDoc(getDocRef(hospitalId, doctorId, date));
};

export const addOneTimeDoctor = async (hospitalId, doctorId, date, doctorSnapshot, user) => {
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

export const removeOneTimeDoctor = async (hospitalId, doctorId, date) => {
  await deleteDoc(getDocRef(hospitalId, doctorId, date));
};

export const getOverridesForDate = async (hospitalId, date) => {
  const q = query(collection(db, 'hospitals', hospitalId, 'doctorOverrides'), where('date', '==', date));
  const snap = await getDocs(q);
  const offIds = new Set();
  const addEntries = [];
  
  snap.forEach((d) => {
    const data = d.data();
    if (data.type === 'off') offIds.add(data.doctorId);
    if (data.type === 'add') addEntries.push({ id: d.id, ...data });
  });
  
  return { offIds, addEntries };
};

export const subscribeToOffDoctors = (hospitalId, date, callback) => {
  if (!hospitalId || !date) return () => {};
  const q = query(
    collection(db, 'hospitals', hospitalId, 'doctorOverrides'), 
    where('date', '==', date), 
    where('type', '==', 'off')
  );
  return onSnapshot(q, (snap) => {
    const ids = new Set();
    snap.forEach((d) => ids.add(d.data().doctorId));
    callback(ids);
  });
};

export const getOneTimeDoctorsForDate = async (hospitalId, date) => {
  const q = query(collection(db, 'hospitals', hospitalId, 'doctorOverrides'), where('date', '==', date), where('type', '==', 'add'));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
};