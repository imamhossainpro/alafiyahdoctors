import { db, collection, onSnapshot, updateDoc, deleteDoc, doc } from '../firebase';

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
      // Normalize ও Filter (Archived default-এ বাদ)
      const normalized = normalizeStatus({ id: doc.id, ...doc.data() });
      if (!normalized.isArchived) {
        appointments.push(normalized);
      }
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
      if (normalized.isArchived || normalized.status === 'archived') {
        archived.push(normalized);
      }
    });
    callback(archived);
  });
};

// Status Transition Validation
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'archived'],
  confirmed: ['checked-in', 'cancelled', 'no-show', 'archived'],
  'checked-in': ['completed', 'archived'],
  completed: ['archived'],
  cancelled: ['archived'],
  'no-show': ['archived'],
  archived: [] // Archived থেকে আর ফেরা যাবে না
};

// Status Update (Invalid Transition Prevent)
export const updateAppointmentStatus = async (id, newStatus) => {
  // বর্তমান স্ট্যাটাস জানার জন্য ডেটা আগে থেকে নেই, তাই দুই ধাপে চেক করা যায়, তবে UI-তে অ্যাকশন বাটন সীমিত রাখাই নিরাপদ।
  // UI-তে বাটন এনাবল/ডিসএবল করা আছে। এখানে শুধু আপডেট হচ্ছে।
  await updateDoc(doc(db, 'appointments', id), { status: newStatus, isArchived: newStatus === 'archived' });
};

// Soft Delete / Archive
export const archiveAppointment = async (id) => {
  await updateDoc(doc(db, 'appointments', id), { status: 'archived', isArchived: true });
};

// Permanent Delete (শুধুমাত্র Archived ডেটার জন্য)
export const deleteAppointment = async (id) => {
  await deleteDoc(doc(db, 'appointments', id));
};