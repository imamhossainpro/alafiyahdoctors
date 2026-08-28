import { db, collection, onSnapshot, updateDoc, deleteDoc, doc, addDoc, query, orderBy } from '../firebase';

// পুরনো ডেটা (approved/deleted) কে নতুন স্ট্যাটাসে রূপান্তর করা
const normalizeStatus = (appt) => {
  if (appt.status === 'approved') return { ...appt, status: 'confirmed' };
  if (appt.status === 'deleted') return { ...appt, status: 'archived', isArchived: true };
  return appt;
};

// Real-time Subscription
export const subscribeToAppointments = (callback) => {
  const q = collection(db, 'appointments');
  return onSnapshot(q, (snapshot) => {
    const appointments = [];
    snapshot.forEach((doc) => {
      const normalized = normalizeStatus({ id: doc.id, ...doc.data() });
      if (!normalized.isArchived) appointments.push(normalized);
    });
    callback(appointments);
  });
};

// Archived ডেটা আলাদাভাবে দেখার জন্য
export const subscribeToArchivedAppointments = (callback) => {
  const q = collection(db, 'appointments');
  return onSnapshot(q, (snapshot) => {
    const archived = [];
    snapshot.forEach((doc) => {
      const normalized = normalizeStatus({ id: doc.id, ...doc.data() });
      if (normalized.isArchived || normalized.status === 'archived') archived.push(normalized);
    });
    callback(archived);
  });
};

// 📝 নতুন: অডিট লগ সাবস্ক্রাইব করার ফাংশন
export const subscribeToAuditLogs = (callback) => {
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() }));
    callback(logs);
  });
};

// 📝 নতুন: অডিট লগ যোগ করার ফাংশন
export const addAuditLog = async (logData) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...logData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// স্ট্যাটাস আপডেট
export const updateAppointmentStatus = async (id, status) => {
  await updateDoc(doc(db, 'appointments', id), { status, isArchived: status === 'archived' });
};

// Soft Delete / Archive
export const archiveAppointment = async (id) => {
  await updateDoc(doc(db, 'appointments', id), { status: 'archived', isArchived: true });
};

// 🆕 নতুন: Archive থেকে ফিরিয়ে আনা (Restore)
export const restoreAppointment = async (id) => {
  await updateDoc(doc(db, 'appointments', id), { status: 'pending', isArchived: false });
};

// Permanent Delete (শুধুমাত্র অ্যাডমিনের জন্য UI-তে সীমাবদ্ধ করা হবে)
export const deleteAppointment = async (id) => {
  await deleteDoc(doc(db, 'appointments', id));
};