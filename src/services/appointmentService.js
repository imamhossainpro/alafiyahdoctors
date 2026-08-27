import { db, collection, onSnapshot, updateDoc, deleteDoc, doc } from '../firebase';

// রিয়েল-টাইমে ডেটা লোড
export const subscribeToAppointments = (callback) => {
  const q = collection(db, 'appointments');
  return onSnapshot(q, (snapshot) => {
    const appointments = [];
    snapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    callback(appointments);
  });
};

// স্ট্যাটাস আপডেট
export const updateAppointmentStatus = async (id, status) => {
  await updateDoc(doc(db, 'appointments', id), { status });
};

// ডিলিট
export const deleteAppointment = async (id) => {
  await deleteDoc(doc(db, 'appointments', id));
};