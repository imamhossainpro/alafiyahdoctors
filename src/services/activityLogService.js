import { 
  db, collection, addDoc, query, where, orderBy, limit, 
  onSnapshot, getDocs, Timestamp, serverTimestamp, writeBatch
} from '../firebase';

export const LOG_MODULES = {
  BOOKING: 'Booking List',
  MARKETING: 'Marketing Report',
  LOCATION: 'Location Manager',
  PATIENT: 'Patient Management',
  SETTINGS: 'Settings'
};

export const LOG_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  PATIENT_TYPE_CHANGE: 'PATIENT_TYPE_CHANGE',
  MARKETING_OFFICER_CHANGE: 'MARKETING_OFFICER_CHANGE',
  LOCATION_CHANGE: 'LOCATION_CHANGE',
  ASSIGN: 'ASSIGN',
  UNASSIGN: 'UNASSIGN'
};

// ✅ Sensitive data strip
const sanitize = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (val.toDate && typeof val.toDate === 'function') return val; // Firestore Timestamp
  try {
    const copy = Array.isArray(val) ? [...val] : { ...val };
    const blocked = ['password', 'token', 'secret', 'apiKey', 'credential', 'privateKey'];
    blocked.forEach(k => { if (k in copy) delete copy[k]; });
    return copy;
  } catch { return String(val); }
};

/**
 * ✅ Centralized activity log
 * Automatically captures: user identity + server timestamp
 */
export const logActivity = async ({
  hospitalId,
  module,
  action,
  recordId = null,
  description = '',
  oldValue = null,
  newValue = null,
  user
}) => {
  if (!hospitalId || !user || !module || !action) {
    console.warn('⚠️ logActivity: missing required args');
    return null;
  }
  try {
    const ref = collection(db, 'hospitals', hospitalId, 'activityLogs');
    const docRef = await addDoc(ref, {
      userId: user.uid || user.id || null,
      userName: user.name || user.displayName || user.email || 'অজানা',
      userEmail: user.email || null,
      userRole: user.role || 'unknown',
      module,
      action,
      recordId,
      description,
      oldValue: sanitize(oldValue),
      newValue: sanitize(newValue),
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('❌ logActivity error:', error);
    throw error;
  }
};

/**
 * ✅ Real-time listener
 */
export const subscribeToActivityLogs = (hospitalId, callback, errorCallback, limitCount = 200) => {
  if (!hospitalId) return () => {};
  try {
    const ref = collection(db, 'hospitals', hospitalId, 'activityLogs');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(limitCount));
    return onSnapshot(
      q,
      (snap) => {
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (callback) callback(logs);
      },
      (err) => {
        console.error('❌ subscribeToActivityLogs:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToActivityLogs setup:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

/**
 * ✅ 2 Calendar-month retention cutoff
 * 10 Sept 2026 → cutoff = 1 July 2026 (00:00)
 */
export const getRetentionCutoff = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
};

/**
 * ✅ Batched cleanup (used by Cloud Function or manual admin trigger)
 */
export const cleanupOldLogs = async (hospitalId, batchSize = 500) => {
  if (!hospitalId) return { deleted: 0 };
  try {
    const cutoff = Timestamp.fromDate(getRetentionCutoff());
    const ref = collection(db, 'hospitals', hospitalId, 'activityLogs');
    const q = query(ref, where('timestamp', '<', cutoff), limit(batchSize));
    const snap = await getDocs(q);
    if (snap.empty) return { deleted: 0 };
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return { deleted: snap.size };
  } catch (error) {
    console.error('❌ cleanupOldLogs:', error);
    return { deleted: 0, error: error.message };
  }
};

export default { logActivity, subscribeToActivityLogs, cleanupOldLogs, getRetentionCutoff, LOG_MODULES, LOG_ACTIONS };