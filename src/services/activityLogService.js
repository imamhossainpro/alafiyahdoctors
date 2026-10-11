// src/services/activityLogService.js
// ==================================================
// 📋 Activity Log Service — Enhanced
// ==================================================
// ✅ Captures: userId, userName, userEmail, userRole, userDesignation
// ✅ Rich diff: oldValue, newValue, changedFields
// ✅ Metadata: userAgent, timestamp (both ISO + serverTimestamp)
// ✅ Search, filter helpers
// ✅ Statistics & retention
// ==================================================
import {
  db,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getCountFromServer,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from '../firebase';

// ==================================================
// ✅ Constants
// ==================================================
export const LOG_MODULES = {
  BOOKING: 'Booking List',
  MARKETING: 'Marketing Report',
  LOCATION: 'Location Manager',
  PATIENT: 'Patient Management',
  SETTINGS: 'Settings',
  USER: 'User Management',
  DISPLAY: 'Display Settings',
  AUTH: 'Authentication',
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
  UNASSIGN: 'UNASSIGN',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

// ==================================================
// ✅ Sensitive data sanitize (recursive + array aware)
// ==================================================
const BLOCKED_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'credential',
  'privateKey',
  'refreshToken',
  'accessToken',
];

const sanitize = (val, depth = 0) => {
  if (depth > 5) return '[deep-object]';
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;

  // Firestore Timestamp — convert to ISO
  if (val.toDate && typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      return val;
    }
  }

  if (Array.isArray(val)) {
    return val.map((v) => sanitize(v, depth + 1));
  }

  try {
    const copy = {};
    Object.keys(val).forEach((key) => {
      if (BLOCKED_KEYS.includes(key)) return; // skip sensitive
      copy[key] = sanitize(val[key], depth + 1);
    });
    return copy;
  } catch {
    return String(val);
  }
};

// ==================================================
// ✅ Diff Calculator — changed fields detect
// ==================================================
const calculateChangedFields = (oldVal, newVal) => {
  if (!oldVal || !newVal) return null;
  if (typeof oldVal !== 'object' || typeof newVal !== 'object') return null;

  const changed = {};
  const allKeys = new Set([
    ...Object.keys(oldVal || {}),
    ...Object.keys(newVal || {}),
  ]);

  allKeys.forEach((key) => {
    const o = oldVal?.[key];
    const n = newVal?.[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changed[key] = { old: o, new: n };
    }
  });

  return Object.keys(changed).length > 0 ? changed : null;
};

// ==================================================
// ✅ MAIN: logActivity
// ==================================================
/**
 * Centralized activity logger
 *
 * @param {Object} params
 * @param {string} params.hospitalId
 * @param {string} params.module       - LOG_MODULES value
 * @param {string} params.action       - LOG_ACTIONS value
 * @param {string} [params.recordId]   - Target document ID
 * @param {string} [params.description]
 * @param {*}      [params.oldValue]
 * @param {*}      [params.newValue]
 * @param {Object} params.user         - { uid, id, name, displayName, email, role, designation }
 * @param {Object} [params.metadata]   - Extra metadata
 */
export const logActivity = async ({
  hospitalId,
  module,
  action,
  recordId = null,
  description = '',
  oldValue = null,
  newValue = null,
  user,
  metadata = {},
}) => {
  if (!hospitalId || !user || !module || !action) {
    console.warn('⚠️ [logActivity] missing required args', {
      hasHospital: !!hospitalId,
      hasUser: !!user,
      hasModule: !!module,
      hasAction: !!action,
    });
    return null;
  }

  try {
    // ✅ User identity
    const userId = user.uid || user.id || null;
    const userName =
      user.name ||
      user.displayName ||
      user.email ||
      'অজানা ইউজার';
    const userEmail = user.email || null;
    const userRole = user.role || 'unknown';
    const userDesignation = user.designation || null;

    // ✅ Sanitize values
    const cleanOld = sanitize(oldValue);
    const cleanNew = sanitize(newValue);

    // ✅ Changed fields (for rich diff)
    const changedFields = calculateChangedFields(cleanOld, cleanNew);

    // ✅ Browser metadata (safe in web only)
    const ua =
      typeof navigator !== 'undefined' ? navigator.userAgent : null;

    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'activityLogs'
    );

    const docRef = await addDoc(ref, {
      // Identity
      userId,
      userName,
      userEmail,
      userRole,
      userDesignation,

      // Activity
      module,
      action,
      recordId,
      description,

      // Diff
      oldValue: cleanOld,
      newValue: cleanNew,
      changedFields, // ✅ NEW

      // Extra metadata
      metadata: {
        userAgent: ua,
        ...metadata,
      },

      // Timestamps
      timestamp: serverTimestamp(),               // ✅ server time
      clientTimestamp: new Date().toISOString(),  // ✅ fallback for offline
    });

    return docRef.id;
  } catch (error) {
    console.error('❌ [logActivity] error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Real-time listener (with filter support)
// ==================================================
/**
 * @param {string} hospitalId
 * @param {Function} callback
 * @param {Function} errorCallback
 * @param {number} limitCount
 */
export const subscribeToActivityLogs = (
  hospitalId,
  callback,
  errorCallback,
  limitCount = 200
) => {
  if (!hospitalId) return () => {};

  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'activityLogs'
    );
    const q = query(
      ref,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snap) => {
        const logs = snap.docs.map((d) => {
          const data = d.data();

          // ✅ Normalize timestamp for UI
          let tsISO = data.clientTimestamp || null;
          if (data.timestamp?.toDate) {
            tsISO = data.timestamp.toDate().toISOString();
          } else if (data.timestamp?.seconds) {
            tsISO = new Date(data.timestamp.seconds * 1000).toISOString();
          }

          return {
            id: d.id,
            ...data,
            timestampISO: tsISO,
            timestampDisplay: data.timestamp, // original for compatibility
          };
        });

        if (callback) callback(logs);
      },
      (err) => {
        console.error('❌ [subscribeToActivityLogs]:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ [subscribeToActivityLogs] setup:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Fetch logs (one-time, with filters)
// ==================================================
/**
 * @param {string} hospitalId
 * @param {Object} filters - { userId, module, action, startDate, endDate, limitCount }
 */
export const fetchActivityLogs = async (hospitalId, filters = {}) => {
  if (!hospitalId) return [];

  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'activityLogs'
    );

    const constraints = [];

    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters.module) {
      constraints.push(where('module', '==', filters.module));
    }
    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters.startDate) {
      constraints.push(
        where('timestamp', '>=', Timestamp.fromDate(new Date(filters.startDate)))
      );
    }
    if (filters.endDate) {
      constraints.push(
        where('timestamp', '<=', Timestamp.fromDate(new Date(filters.endDate)))
      );
    }

    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(filters.limitCount || 500));

    const q = query(ref, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('❌ [fetchActivityLogs]:', error);
    return [];
  }
};

// ==================================================
// ✅ User-wise activity summary
// ==================================================
export const getUserActivitySummary = async (hospitalId, daysBack = 30) => {
  if (!hospitalId) return [];

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const logs = await fetchActivityLogs(hospitalId, {
      startDate: cutoff,
      limitCount: 5000,
    });

    const summary = {};
    logs.forEach((log) => {
      const key = log.userId || 'unknown';
      if (!summary[key]) {
        summary[key] = {
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          userRole: log.userRole,
          totalActions: 0,
          byModule: {},
          byAction: {},
          lastActivity: log.timestamp,
        };
      }
      summary[key].totalActions++;
      summary[key].byModule[log.module] =
        (summary[key].byModule[log.module] || 0) + 1;
      summary[key].byAction[log.action] =
        (summary[key].byAction[log.action] || 0) + 1;
    });

    return Object.values(summary).sort(
      (a, b) => b.totalActions - a.totalActions
    );
  } catch (error) {
    console.error('❌ [getUserActivitySummary]:', error);
    return [];
  }
};

// ==================================================
// ✅ Retention
// ==================================================
export const getRetentionCutoff = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
};

// ==================================================
// ✅ Batched cleanup
// ==================================================
export const cleanupOldLogs = async (hospitalId, batchSize = 500) => {
  if (!hospitalId) return { deleted: 0 };

  try {
    const cutoff = Timestamp.fromDate(getRetentionCutoff());
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'activityLogs'
    );
    const q = query(
      ref,
      where('timestamp', '<', cutoff),
      limit(batchSize)
    );
    const snap = await getDocs(q);

    if (snap.empty) return { deleted: 0 };

    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    return { deleted: snap.size };
  } catch (error) {
    console.error('❌ [cleanupOldLogs]:', error);
    return { deleted: 0, error: error.message };
  }
};

// ==================================================
// ✅ Stats helpers
// ==================================================
export const getLogCount = async (hospitalId) => {
  if (!hospitalId) return 0;
  try {
    const ref = collection(
      db,
      'hospitals',
      hospitalId,
      'activityLogs'
    );
    const snap = await getCountFromServer(ref);
    return snap.data().count;
  } catch (error) {
    console.error('❌ [getLogCount]:', error);
    return 0;
  }
};

// ==================================================
// ✅ Default export
// ==================================================
export default {
  logActivity,
  subscribeToActivityLogs,
  fetchActivityLogs,
  getUserActivitySummary,
  cleanupOldLogs,
  getRetentionCutoff,
  getLogCount,
  LOG_MODULES,
  LOG_ACTIONS,
};