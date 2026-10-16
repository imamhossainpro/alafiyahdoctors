// src/services/logoService.js
// ==================================================
// 🖼️ Logo Service — Vercel Blob Storage
// ==================================================
// ✅ Upload / delete logo via /api/upload-logo (Vercel Blob)
// ✅ Real-time metadata subscription from Firestore
// ✅ URL persistence in Firestore
// ✅ NO Firebase Storage dependency
// ✅ Logo goes into `logos/` folder (not `doctors/`)
// ✅ Better error handling for Firestore save
// ==================================================

import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

// ✅ Vercel Blob upload endpoint (logo-specific)
const UPLOAD_API = '/api/upload-logo';
const DELETE_API = '/api/delete-logo';

// ==================================================
// ✅ Firestore reference helper
// ==================================================
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
// ✅ Upload logo via Vercel Blob (/api/upload-logo)
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
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('লোগো সাইজ সর্বোচ্চ 2MB');
  }

  try {
    // ✅ FormData তৈরি
    const formData = new FormData();
    formData.append('file', file);

    // ✅ Vercel Blob-এ upload (logos/ folder)
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

    console.log('✅ Logo uploaded to Vercel Blob:', url);

    // ==================================================
    // ✅ Metadata Firestore-এ save (with better error handling)
    // ==================================================
    try {
      const metaRef = getLogoMetaRef(hospitalId);
      await setDoc(
        metaRef,
        {
          url,
          path: pathname || '',
          storage: 'vercel-blob',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.uid || user?.id || null,
          uploadedByName:
            user?.name || user?.displayName || user?.email || null,
        },
        { merge: true }
      );

      console.log('✅ Logo metadata saved to Firestore:', {
        hospitalId,
        path: `hospitals/${hospitalId}/settings/mouLogo`,
        url,
      });
    } catch (firestoreErr) {
      console.error('❌ Firestore save failed:', firestoreErr);

      // ⚠️ Vercel-এ ফাইল আপলোড হয়েছে কিন্তু Firestore-এ সেভ হয়নি
      // এই error টি UI-তে দেখান যাতে user জানতে পারে
      throw new Error(
        `লোগো Vercel-এ আপলোড হয়েছে কিন্তু Firestore-এ সেভ করতে সমস্যা: ${firestoreErr.message}`
      );
    }

    return { url, path: pathname };
  } catch (err) {
    console.error('❌ uploadLogo error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Delete logo (Vercel Blob + Firestore metadata)
// ==================================================
export const deleteLogo = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  try {
    // ---------- ১. Firestore থেকে বর্তমান URL নাও ----------
    const snap = await getDoc(getLogoMetaRef(hospitalId));
    if (!snap.exists()) {
      console.warn('⚠️ deleteLogo: No logo metadata found');
      return;
    }

    const data = snap.data();
    const currentUrl = data.url;

    // ---------- ২. Vercel Blob থেকে ফাইল ডিলিট ----------
    if (currentUrl) {
      try {
        const res = await fetch(DELETE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentUrl }),
        });

        const result = await res.json();

        if (!res.ok) {
          console.warn('⚠️ Vercel Blob delete failed:', result.error);
          // Firestore-এ metadata ঠিকই delete করব
        } else {
          console.log('✅ Logo deleted from Vercel Blob:', currentUrl);
        }
      } catch (blobErr) {
        console.warn('⚠️ Vercel Blob delete error:', blobErr.message);
        // চালিয়ে যান Firestore delete-এ
      }
    }

    // ---------- ৩. Firestore metadata clear ----------
    await setDoc(
      getLogoMetaRef(hospitalId),
      {
        url: null,
        path: null,
        deletedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Logo metadata cleared from Firestore');
  } catch (err) {
    console.error('❌ deleteLogo error:', err);
    throw err;
  }
};

// ==================================================
// ✅ Default export
// ==================================================
export default {
  subscribeToLogo,
  getLogo,
  uploadLogo,
  deleteLogo,
};