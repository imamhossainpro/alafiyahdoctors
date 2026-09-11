// src/services/appointmentService.js
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// রেফারেন্স হেল্পার
// ==========================================
const getAppointmentsRef = (hospitalId) =>
  collection(db, 'hospitals', hospitalId, 'appointments');

const getAppointmentDocRef = (hospitalId, appointmentId) =>
  doc(db, 'hospitals', hospitalId, 'appointments', appointmentId);

// ==========================================
// ১. CREATE
// ==========================================
export const createAppointment = async (hospitalId, data) => {
  try {
    if (!hospitalId) throw new Error('Hospital ID is required');
    const ref = getAppointmentsRef(hospitalId);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: data.status || 'pending',
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      hospitalId,
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('❌ createAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ২. UPDATE (general purpose)
// ==========================================
export const updateAppointment = async (hospitalId, appointmentId, data) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { id: appointmentId, ...data };
  } catch (error) {
    console.error('❌ updateAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ৩. STATUS UPDATE
// ==========================================
export const updateAppointmentStatus = async (
  hospitalId,
  appointmentId,
  status,
  note = ''
) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      status,
      statusNote: note,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ updateAppointmentStatus error:', error);
    throw error;
  }
};

// ==========================================
// ৪. CANCEL
// ==========================================
export const cancelAppointment = async (
  hospitalId,
  appointmentId,
  reason = ''
) => {
  try {
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ cancelAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ৫. ARCHIVE (in-place update – no duplicate doc)
// ==========================================
export const archiveAppointment = async (hospitalId, appointmentId, user) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      isArchived: true,
      archivedAt: Timestamp.now(),
      archivedBy: user?.uid || user?.id || null,
      archivedByName: user?.name || user?.displayName || null,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ archiveAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ৬. RESTORE (in-place update)
// ==========================================
export const restoreAppointment = async (hospitalId, appointmentId, user) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archivedByName: null,
      restoredAt: Timestamp.now(),
      restoredBy: user?.uid || user?.id || null,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ restoreAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ৭. PERMANENT DELETE (only for archived records)
// ==========================================
export const permanentlyDeleteArchived = async (hospitalId, appointmentId) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Appointment not found');
    if (snap.data().isArchived !== true) {
      throw new Error('শুধুমাত্র আর্কাইভ করা বুকিং স্থায়ীভাবে মুছা যাবে');
    }
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('❌ permanentlyDeleteArchived error:', error);
    throw error;
  }
};

// ==========================================
// ৮. SOFT DELETE (legacy helper – kept for compatibility)
// ==========================================
export const deleteAppointment = async (hospitalId, appointmentId) => {
  try {
    if (!hospitalId || !appointmentId) {
      throw new Error('Hospital ID and Appointment ID are required');
    }
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error('❌ deleteAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ৯. GET APPOINTMENTS (one-time fetch with filters)
// ==========================================
export const getAppointments = async (hospitalId, filters = {}) => {
  try {
    if (!hospitalId) return [];
    let q = query(getAppointmentsRef(hospitalId));

    if (filters.status) q = query(q, where('status', '==', filters.status));
    if (filters.doctorId) q = query(q, where('doctorId', '==', filters.doctorId));
    if (filters.isArchived === true) {
      q = query(q, where('isArchived', '==', true));
    } else if (filters.isArchived === false) {
      q = query(q, where('isArchived', '==', false));
    }

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      q = query(q, where('appointmentDate', '>=', start), where('appointmentDate', '<', end));
    }

    q = query(q, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getAppointments error:', error);
    return [];
  }
};

// ==========================================
// ১০. GET TODAY'S APPOINTMENTS
// ==========================================
export const getTodayAppointments = async (hospitalId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      getAppointmentsRef(hospitalId),
      where('appointmentDate', '>=', today),
      where('appointmentDate', '<', tomorrow),
      orderBy('appointmentDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getTodayAppointments error:', error);
    return [];
  }
};

// ==========================================
// ১১. GET ARCHIVED APPOINTMENTS (server-side filtered)
// ==========================================
export const getArchivedAppointments = async (hospitalId) => {
  try {
    if (!hospitalId) return [];
    const q = query(
      getAppointmentsRef(hospitalId),
      where('isArchived', '==', true),
      orderBy('archivedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ getArchivedAppointments error:', error);
    return [];
  }
};

// ==========================================
// ১২. REALTIME – সব appointments
//     (client-side filter: active vs archived)
// ==========================================
export const subscribeToAppointments = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) {
    console.warn('⚠️ subscribeToAppointments: hospitalId missing');
    return () => {};
  }
  try {
    const ref = getAppointmentsRef(hospitalId);
    const q = query(ref, orderBy('createdAt', 'desc'));
    console.log('🔍 Subscribing to appointments at:', ref.path);

    return onSnapshot(
      q,
      (snapshot) => {
        const appointments = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        console.log(`📊 Appointments snapshot: ${appointments.length} টি`);
        if (callback) callback(appointments);
      },
      (error) => {
        console.error('❌ subscribeToAppointments error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToAppointments setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

// ==========================================
// ১৩. REALTIME – শুধু archived
// ==========================================
export const subscribeToArchivedAppointments = (
  hospitalId,
  callback,
  errorCallback
) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(
      getAppointmentsRef(hospitalId),
      where('isArchived', '==', true),
      orderBy('archivedAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const archived = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (callback) callback(archived);
      },
      (error) => {
        console.error('❌ subscribeToArchivedAppointments error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToArchivedAppointments setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

// ==========================================
// ১৪. COUNT HELPER
// ==========================================
export const getAppointmentCount = async (hospitalId, status = null) => {
  try {
    let q = query(getAppointmentsRef(hospitalId));
    if (status) q = query(q, where('status', '==', status));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ getAppointmentCount error:', error);
    return 0;
  }
};

// ==========================================
// ১৫. LEGACY addAuditLog – silent no-op
// ==========================================
// আগে এই function legacy `audit_logs` collection এ লিখত,
// যা Firestore rules এ block হয়ে "Missing or insufficient permissions" error দিত।
// এখন centralized logging activityLogService.logActivity() দিয়ে হয়।
export const addAuditLog = async () => {
  return;
};

// ==========================================
// ডিফল্ট এক্সপোর্ট
// ==========================================
export default {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  archiveAppointment,
  restoreAppointment,
  permanentlyDeleteArchived,
  deleteAppointment,
  getAppointments,
  getTodayAppointments,
  getArchivedAppointments,
  subscribeToAppointments,
  subscribeToArchivedAppointments,
  getAppointmentCount,
  addAuditLog,
};