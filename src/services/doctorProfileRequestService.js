// src/services/doctorProfileRequestService.js
import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export const EDITABLE_FIELDS = [
  'name', 'nameEn', 'quals', 'specialty', 'workplace', 'imageUrl', 'timeSlots',
];

const sanitizeChanges = (changes) => {
  const clean = {};
  EDITABLE_FIELDS.forEach((f) => {
    if (changes[f] !== undefined) clean[f] = changes[f];
  });
  return clean;
};

// ==================================================
// ✅ Submit — with BATCH delete of old pending requests
// ==================================================
export const submitProfileEditRequest = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  doctorId,
  changes,
  user
) => {
  if (!doctorId) throw new Error('doctorId required');

  const clean = sanitizeChanges(changes);
  if (Object.keys(clean).length === 0) {
    throw new Error('No valid fields to update');
  }

  // ✅ Delete old pending (batch — proper await)
  const existingSnap = await getDocs(
    query(
      collection(db, 'hospitals', hospitalId, 'profileEditRequests'),
      where('doctorId', '==', doctorId),
      where('status', '==', 'pending')
    )
  );

  if (!existingSnap.empty) {
    const batch = writeBatch(db);
    existingSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  const payload = {
    doctorId,
    changes: clean,
    status: 'pending',
    submittedBy: user?.uid || null,
    submittedByName: user?.name || user?.displayName || 'Doctor',
    submittedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: '',
  };

  const ref = await addDoc(
    collection(db, 'hospitals', hospitalId, 'profileEditRequests'),
    payload
  );

  return { id: ref.id, ...payload };
};

// ==================================================
// ✅ Subscribe — Doctor (own) / Admin (all)
// ==================================================
export const subscribeToMyRequests = (hospitalId = DEFAULT_HOSPITAL_ID, doctorId, callback, errorCallback) => {
  if (!doctorId) return () => {};
  const q = query(
    collection(db, 'hospitals', hospitalId, 'profileEditRequests'),
    where('doctorId', '==', doctorId)
  );
  return onSnapshot(q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.submittedAt?.toDate?.()?.getTime?.() || 0) - (a.submittedAt?.toDate?.()?.getTime?.() || 0));
      callback?.(list);
    },
    (err) => { console.error(err); errorCallback?.(err); }
  );
};

export const subscribeToAllRequests = (hospitalId = DEFAULT_HOSPITAL_ID, callback, errorCallback) => {
  const q = query(collection(db, 'hospitals', hospitalId, 'profileEditRequests'));
  return onSnapshot(q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.submittedAt?.toDate?.()?.getTime?.() || 0) - (a.submittedAt?.toDate?.()?.getTime?.() || 0));
      callback?.(list);
    },
    (err) => { console.error(err); errorCallback?.(err); }
  );
};

// ==================================================
// ✅ Approve — with TRANSACTION + user doc sync
// ==================================================
export const approveRequest = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  requestId,
  adminUser
) => {
  const reqRef = doc(db, 'hospitals', hospitalId, 'profileEditRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error('Request not found');

  const reqData = reqSnap.data();
  if (reqData.status !== 'pending') {
    throw new Error('Request already ' + reqData.status);
  }

  const { doctorId, changes, submittedBy } = reqData;

  // ✅ Find dept
  const deptsSnap = await getDocs(collection(db, 'hospitals', hospitalId, 'departments'));
  let targetDeptRef = null;
  let targetDoctorId = null;

  for (const deptDoc of deptsSnap.docs) {
    const doctors = deptDoc.data().doctors || [];
    if (doctors.some((d) => d.id === doctorId)) {
      targetDeptRef = deptDoc.ref;
      targetDoctorId = doctorId;
      break;
    }
  }
  if (!targetDeptRef) throw new Error('Doctor not found in departments');

  // ✅ TRANSACTION — safe concurrent approve
  await runTransaction(db, async (tx) => {
    const freshReq = await tx.get(reqRef);
    if (freshReq.data().status !== 'pending') {
      throw new Error('Request already processed');
    }

    const freshDept = await tx.get(targetDeptRef);
    const doctors = [...(freshDept.data().doctors || [])];
    const idx = doctors.findIndex((d) => d.id === targetDoctorId);
    if (idx === -1) throw new Error('Doctor disappeared from department');

    doctors[idx] = {
      ...doctors[idx],
      ...changes,
      id: doctors[idx].id, // protect id
    };

    tx.update(targetDeptRef, { doctors });
    tx.update(reqRef, {
      status: 'approved',
      reviewedBy: adminUser?.uid || null,
      reviewedByName: adminUser?.name || 'Admin',
      reviewedAt: serverTimestamp(),
    });
  });

  // ✅ Sync user doc name (outside transaction — non-critical)
  if (submittedBy && (changes.name || changes.nameEn)) {
    try {
      const userRef = doc(db, 'hospitals', hospitalId, 'users', submittedBy);
      const updates = {};
      if (changes.name) updates.name = changes.name;
      if (changes.nameEn) updates.nameEn = changes.nameEn;
      await updateDoc(userRef, updates);
    } catch (e) {
      console.warn('User doc sync failed (non-critical):', e.message);
    }
  }

  return { success: true };
};

// ==================================================
// ✅ Reject
// ==================================================
export const rejectRequest = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  requestId,
  adminUser,
  reason = ''
) => {
  const reqRef = doc(db, 'hospitals', hospitalId, 'profileEditRequests', requestId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) throw new Error('Request not found');
  if (snap.data().status !== 'pending') throw new Error('Already processed');

  await updateDoc(reqRef, {
    status: 'rejected',
    reviewedBy: adminUser?.uid || null,
    reviewedByName: adminUser?.name || 'Admin',
    reviewedAt: serverTimestamp(),
    reviewNote: reason,
  });
  return { success: true };
};

export const deleteRequest = async (hospitalId = DEFAULT_HOSPITAL_ID, requestId) => {
  await deleteDoc(doc(db, 'hospitals', hospitalId, 'profileEditRequests', requestId));
  return { success: true };
};

export default {
  submitProfileEditRequest,
  subscribeToMyRequests,
  subscribeToAllRequests,
  approveRequest,
  rejectRequest,
  deleteRequest,
  EDITABLE_FIELDS,
};