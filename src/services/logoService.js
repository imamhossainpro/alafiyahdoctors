// src/services/logoService.js
// ==================================================
// 🖼️ Logo Service — Vercel Blob Storage
// ==================================================
// ✅ Upload / delete logo via /api/upload (Vercel Blob)
// ✅ Real-time metadata subscription from Firestore
// ✅ URL persistence in Firestore
// ✅ NO Firebase Storage dependency
// ==================================================

import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

// ✅ Vercel Blob upload endpoint (relative path)
const UPLOAD_API = '/api/upload';

const getLogoMetaRef = (hospitalId = DEFAULT_HOSPITAL_ID) =>
  doc(db, 'hospitals', hospitalId, 'settings', 'mouLogo');

// ==================================================
// ✅ Real-time logo metadata subscription
// ==================================================
export const subscribeToLogo = (
  hospitalId = DEFAULT_HOSPITAL_ID,
  callback,
  errorCallback
) => {
  try {
    const ref = getLogoMetaRef(hospitalId);
    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        if (callback) callback(data);
      },
      (err) => {
        console.error('❌ subscribeToLogo error:', err);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.error('❌ subscribeToLogo setup error:', err);
    if (errorCallback) errorCallback(err);
    return () => {};
  }
};

// ==================================================
// ✅ Get logo (one-time)
// ==================================================
export const getLogo = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  try {
    const snap = await getDoc(getLogoMetaRef(hospitalId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('❌ getLogo error:', err);
    return null;
  }
};

// ==================================================
// ✅ Upload logo via Vercel Blob (/api/upload)
// ==================================================
export const uploadLogo = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  file,
  user = null
) => {
  if (!file) throw new Error('File required');

  // ✅ Validation
  if (!file.type.startsWith('image/')) {
    throw new Error('শুধু ছবি ফাইল আপলোড করুন');
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error('লোগো সাইজ সর্বোচ্চ 3MB');
  }

  try {
    // ✅ FormData তৈরি
    const formData = new FormData();
    formData.append('file', file);

    // ✅ Vercel Blob-এ upload
    const res = await fetch(UPLOAD_API, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    const url = data.url;
    const pathname = data.pathname;

    if (!url) {
      throw new Error('Upload response-এ URL নেই');
    }

    // ✅ Metadata Firestore-এ save
    const metaRef = getLogoMetaRef(hospitalId);
    await setDoc(
      metaRef,
      {
        url,
        path: pathname || '',
        storage: 'vercel-blob',
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.uid || user?.id || null,
        uploadedByName: user?.name || user?.displayName || null,
      },
      { merge: true }
    );

    return { url, path: pathname };
  } catch (err) {
    console.error('❌ uploadLogo error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Delete logo metadata
// ==================================================
// Note: Vercel Blob delete করতে হলে server-side API লাগে।
// আপাতত শুধু Firestore থেকে URL remove করা হচ্ছে।
// ==================================================
export const deleteLogo = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  try {
    const snap = await getDoc(getLogoMetaRef(hospitalId));
    if (!snap.exists()) return;

    await setDoc(
      getLogoMetaRef(hospitalId),
      {
        url: null,
        path: null,
        deletedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('❌ deleteLogo error:', err);
    throw err;
  }
};

export default {
  subscribeToLogo,
  getLogo,
  uploadLogo,
  deleteLogo,
};