import { db, collection, onSnapshot, updateDoc, deleteDoc, doc, addDoc, query, orderBy } from '../firebase';

const normalizeStatus = (appt) => {
  if (appt.status === 'approved') return { ...appt, status: 'confirmed' };
  if (appt.status === 'deleted') return { ...appt, status: 'archived', isArchived: true };
  return appt;
};

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

export const subscribeToAuditLogs = (callback) => {
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = [];
    snapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() }));
    callback(logs);
  });
};

export const addAuditLog = async (logData) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      ...logData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const updateAppointmentStatus = async (id, status) => {
  await updateDoc(doc(db, 'appointments', id), { status, isArchived: status === 'archived' });
};

export const archiveAppointment = async (id) => {
  await updateDoc(doc(db, 'appointments', id), { status: 'archived', isArchived: true });
};

export const restoreAppointment = async (id) => {
  await updateDoc(doc(db, 'appointments', id), { status: 'pending', isArchived: false });
};

export const deleteAppointment = async (id) => {
  await deleteDoc(doc(db, 'appointments', id));
};