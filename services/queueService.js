// services/queueService.js
// ==================================================
// 📊 Queue Service — Real-time serial tracking
// ==================================================
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Counter document reference
// ==================================================
const getCounterRef = (hospitalId, doctorId, dateStr) => {
  const counterId = `${doctorId}_${dateStr}`;
  return doc(db, 'hospitals', hospitalId, 'counters', counterId);
};

// ==================================================
// ✅ Subscribe to real-time counter updates
// ==================================================
export const subscribeToCounter = (
  hospitalId,
  doctorId,
  dateStr,
  callback,
  errorCallback
) => {
  if (!hospitalId || !doctorId || !dateStr) {
    return () => {};
  }

  try {
    const ref = getCounterRef(hospitalId, doctorId, dateStr);

    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback({
            count: data.count || 0,
            currentSerial: data.currentSerial || 0,
            lastUpdated: data.lastUpdated,
            updatedBy: data.updatedBy,
            status: data.status || 'idle',
          });
        } else {
          callback({
            count: 0,
            currentSerial: 0,
            status: 'idle',
          });
        }
      },
      (err) => {
        console.error('❌ Counter subscription error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ Subscribe setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Get counter (one-time)
// ==================================================
export const getCounter = async (hospitalId, doctorId, dateStr) => {
  if (!hospitalId || !doctorId || !dateStr) return null;

  try {
    const snap = await getDoc(getCounterRef(hospitalId, doctorId, dateStr));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error('❌ getCounter error:', err);
    return null;
  }
};

// ==================================================
// ✅ Staff: Call next patient (increment currentSerial)
// ==================================================
export const callNextPatient = async (
  hospitalId,
  doctorId,
  dateStr,
  user
) => {
  if (!hospitalId || !doctorId || !dateStr) {
    throw new Error('Missing required parameters');
  }

  try {
    const ref = getCounterRef(hospitalId, doctorId, dateStr);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error('Counter পাওয়া যায়নি');
    }

    const data = snap.data();
    const currentCount = data.count || 0;
    const currentSerial = data.currentSerial || 0;

    if (currentSerial >= currentCount) {
      throw new Error('সব রোগী ইতিমধ্যে দেখা হয়ে গেছে');
    }

    await updateDoc(ref, {
      currentSerial: currentSerial + 1,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.uid || 'unknown',
      status: 'active',
    });

    return { success: true, currentSerial: currentSerial + 1 };
  } catch (err) {
    console.error('❌ callNextPatient error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Staff: Reset queue (start fresh)
// ==================================================
export const resetQueue = async (hospitalId, doctorId, dateStr, user) => {
  if (!hospitalId || !doctorId || !dateStr) {
    throw new Error('Missing required parameters');
  }

  try {
    const ref = getCounterRef(hospitalId, doctorId, dateStr);
    await setDoc(
      ref,
      {
        currentSerial: 0,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown',
        status: 'idle',
      },
      { merge: true }
    );

    return { success: true };
  } catch (err) {
    console.error('❌ resetQueue error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Staff: Pause queue
// ==================================================
export const pauseQueue = async (hospitalId, doctorId, dateStr, user) => {
  if (!hospitalId || !doctorId || !dateStr) {
    throw new Error('Missing required parameters');
  }

  try {
    const ref = getCounterRef(hospitalId, doctorId, dateStr);
    await updateDoc(ref, {
      status: 'paused',
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.uid || 'unknown',
    });

    return { success: true };
  } catch (err) {
    console.error('❌ pauseQueue error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Staff: Resume queue
// ==================================================
export const resumeQueue = async (hospitalId, doctorId, dateStr, user) => {
  if (!hospitalId || !doctorId || !dateStr) {
    throw new Error('Missing required parameters');
  }

  try {
    const ref = getCounterRef(hospitalId, doctorId, dateStr);
    await updateDoc(ref, {
      status: 'active',
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.uid || 'unknown',
    });

    return { success: true };
  } catch (err) {
    console.error('❌ resumeQueue error:', err);
    throw err;
  }
};

export default {
  subscribeToCounter,
  getCounter,
  callNextPatient,
  resetQueue,
  pauseQueue,
  resumeQueue,
};