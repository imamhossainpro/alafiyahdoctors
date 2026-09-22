// services/dataService.js
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const HOSPITAL_ID = 'alafiyah_main'; // আপনার hospital ID

// সব ডিপার্টমেন্ট লোড
export const loadDepartments = async () => {
  const snapshot = await getDocs(
    collection(db, 'hospitals', HOSPITAL_ID, 'departments')
  );
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

// সব প্যানেল লোড
export const loadPanels = async () => {
  const snapshot = await getDocs(
    collection(db, 'hospitals', HOSPITAL_ID, 'panels')
  );
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ফুটার লোড
export const loadFooter = async () => {
  const ref = doc(db, 'hospitals', HOSPITAL_ID, 'footer', 'data');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

// Active panel ডাক্তার লোড
export const loadActivePanel = async (panelId) => {
  const ref = doc(db, 'hospitals', HOSPITAL_ID, 'panels', panelId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};