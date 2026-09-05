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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// রেফারেন্স হেল্পার
// ==========================================

const getAppointmentsRef = (hospitalId) => collection(db, 'hospitals', hospitalId, 'appointments');
const getAppointmentDocRef = (hospitalId, appointmentId) => doc(db, 'hospitals', hospitalId, 'appointments', appointmentId);
const getArchivedRef = (hospitalId) => collection(db, 'hospitals', hospitalId, 'archivedAppointments');
const getArchivedDocRef = (hospitalId, archivedId) => doc(db, 'hospitals', hospitalId, 'archivedAppointments', archivedId);
const getAuditLogsRef = (hospitalId) => collection(db, 'hospitals', hospitalId, 'audit_logs');

// ==========================================
// ১. অ্যাপয়েন্টমেন্ট ক্রিয়েট / আপডেট / স্ট্যাটাস আপডেট / ডিলিট / আর্কাইভ / রিস্টোর
// ==========================================

/**
 * নতুন অ্যাপয়েন্টমেন্ট তৈরি করুন
 */
export const createAppointment = async (hospitalId, data) => {
  try {
    if (!hospitalId) throw new Error('Hospital ID is required');
    const ref = getAppointmentsRef(hospitalId);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: data.status || 'pending',
      hospitalId,
    });
    await addAuditLog(hospitalId, {
      action: 'appointment_created',
      message: `নতুন অ্যাপয়েন্টমেন্ট তৈরি: ${data.patientName || 'অজানা'}`,
      appointmentId: docRef.id,
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('❌ createAppointment error:', error);
    throw error;
  }
};

/**
 * অ্যাপয়েন্টমেন্ট আপডেট করুন
 */
export const updateAppointment = async (hospitalId, appointmentId, data) => {
  try {
    if (!hospitalId || !appointmentId) throw new Error('Hospital ID and Appointment ID are required');
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    await addAuditLog(hospitalId, {
      action: 'appointment_updated',
      message: `অ্যাপয়েন্টমেন্ট আপডেট: ${appointmentId}`,
      appointmentId,
    });
    return { id: appointmentId, ...data };
  } catch (error) {
    console.error('❌ updateAppointment error:', error);
    throw error;
  }
};

/**
 * অ্যাপয়েন্টমেন্টের স্ট্যাটাস আপডেট করুন (updateAppointmentStatus) – AppointmentsTable-এ ব্যবহৃত
 */
export const updateAppointmentStatus = async (hospitalId, appointmentId, status, note = '') => {
  try {
    if (!hospitalId || !appointmentId) throw new Error('Hospital ID and Appointment ID are required');
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      status,
      statusNote: note,
      updatedAt: Timestamp.now(),
    });
    await addAuditLog(hospitalId, {
      action: 'appointment_status_updated',
      message: `স্ট্যাটাস পরিবর্তন: ${appointmentId} → ${status}`,
      appointmentId,
      status,
      note,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ updateAppointmentStatus error:', error);
    throw error;
  }
};

/**
 * অ্যাপয়েন্টমেন্ট ডিলিট করুন (স্থায়ীভাবে)
 */
export const deleteAppointment = async (hospitalId, appointmentId) => {
  try {
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await deleteDoc(ref);
    await addAuditLog(hospitalId, {
      action: 'appointment_deleted',
      message: `অ্যাপয়েন্টমেন্ট ডিলিট: ${appointmentId}`,
      appointmentId,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ deleteAppointment error:', error);
    throw error;
  }
};

/**
 * অ্যাপয়েন্টমেন্ট আর্কাইভ করুন (archiveAppointment)
 */
export const archiveAppointment = async (hospitalId, appointmentId) => {
  try {
    if (!hospitalId || !appointmentId) throw new Error('Hospital ID and Appointment ID are required');
    
    const sourceRef = getAppointmentDocRef(hospitalId, appointmentId);
    const docSnap = await getDoc(sourceRef);
    if (!docSnap.exists()) throw new Error('Appointment not found');
    const data = docSnap.data();
    
    const archivedRef = getArchivedRef(hospitalId);
    await addDoc(archivedRef, {
      ...data,
      archivedAt: Timestamp.now(),
      originalId: appointmentId,
    });
    
    await deleteDoc(sourceRef);
    
    await addAuditLog(hospitalId, {
      action: 'appointment_archived',
      message: `অ্যাপয়েন্টমেন্ট আর্কাইভ: ${appointmentId}`,
      appointmentId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ archiveAppointment error:', error);
    throw error;
  }
};

/**
 * আর্কাইভ থেকে অ্যাপয়েন্টমেন্ট পুনরুদ্ধার করুন (restoreAppointment)
 */
export const restoreAppointment = async (hospitalId, archivedId) => {
  try {
    if (!hospitalId || !archivedId) throw new Error('Hospital ID and Archived ID are required');
    
    const archivedRef = getArchivedDocRef(hospitalId, archivedId);
    const archivedSnap = await getDoc(archivedRef);
    if (!archivedSnap.exists()) throw new Error('Archived appointment not found');
    const data = archivedSnap.data();
    
    const appointmentsRef = getAppointmentsRef(hospitalId);
    await addDoc(appointmentsRef, {
      ...data,
      restoredAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    await deleteDoc(archivedRef);
    
    await addAuditLog(hospitalId, {
      action: 'appointment_restored',
      message: `অ্যাপয়েন্টমেন্ট পুনরুদ্ধার: ${archivedId}`,
      archivedId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ restoreAppointment error:', error);
    throw error;
  }
};

/**
 * অ্যাপয়েন্টমেন্ট বাতিল করুন (status change)
 */
export const cancelAppointment = async (hospitalId, appointmentId, reason = '') => {
  try {
    const ref = getAppointmentDocRef(hospitalId, appointmentId);
    await updateDoc(ref, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: Timestamp.now(),
    });
    await addAuditLog(hospitalId, {
      action: 'appointment_cancelled',
      message: `অ্যাপয়েন্টমেন্ট বাতিল: ${appointmentId}`,
      appointmentId,
      reason,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ cancelAppointment error:', error);
    throw error;
  }
};

// ==========================================
// ২. অডিট লগ (addAuditLog)
// ==========================================

export const addAuditLog = async (hospitalId, logData) => {
  try {
    if (!hospitalId) return;
    const ref = getAuditLogsRef(hospitalId);
    await addDoc(ref, {
      ...logData,
      timestamp: Timestamp.now(),
      hospitalId,
    });
  } catch (error) {
    console.error('❌ addAuditLog error:', error);
  }
};

// ==========================================
// ৩. ডেটা ফেচ (One-time)
// ==========================================

export const getAppointments = async (hospitalId, filters = {}) => {
  try {
    if (!hospitalId) return [];
    let q = query(getAppointmentsRef(hospitalId));
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.doctorId) {
      q = query(q, where('doctorId', '==', filters.doctorId));
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ getAppointments error:', error);
    return [];
  }
};

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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ getTodayAppointments error:', error);
    return [];
  }
};

export const getArchivedAppointments = async (hospitalId) => {
  try {
    if (!hospitalId) return [];
    const q = query(getArchivedRef(hospitalId), orderBy('archivedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ getArchivedAppointments error:', error);
    return [];
  }
};

// ==========================================
// ৪. রিয়েল-টাইম লিসেনার
// ==========================================

export const subscribeToAppointments = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(getAppointmentsRef(hospitalId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

export const subscribeToAuditLogs = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(getAuditLogsRef(hospitalId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (callback) callback(logs);
      },
      (error) => {
        console.error('❌ subscribeToAuditLogs error:', error);
        if (errorCallback) errorCallback(error);
      }
    );
  } catch (error) {
    console.error('❌ subscribeToAuditLogs setup error:', error);
    if (errorCallback) errorCallback(error);
    return () => {};
  }
};

export const subscribeToArchivedAppointments = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) return () => {};
  try {
    const q = query(getArchivedRef(hospitalId), orderBy('archivedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const archived = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
// ৫. ইউটিলিটি
// ==========================================

export const getAppointmentCount = async (hospitalId, status = null) => {
  try {
    let q = query(getAppointmentsRef(hospitalId));
    if (status) {
      q = query(q, where('status', '==', status));
    }
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ getAppointmentCount error:', error);
    return 0;
  }
};

// ==========================================
// ডিফল্ট এক্সপোর্ট
// ==========================================

export default {
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  archiveAppointment,
  restoreAppointment,
  cancelAppointment,
  addAuditLog,
  getAppointments,
  getTodayAppointments,
  getArchivedAppointments,
  subscribeToAppointments,
  subscribeToAuditLogs,
  subscribeToArchivedAppointments,
  getAppointmentCount,
};