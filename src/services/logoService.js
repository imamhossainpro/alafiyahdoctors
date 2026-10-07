// src/services/logoService.js
// ==================================================
// 🖼️ Logo Service — Vercel Blob + Firestore metadata
// ==================================================
// ✅ Vercel Blob-এ ফাইল store হয়
// ✅ Firestore-এ শুধু URL + metadata store হয়
// Path: hospitals/{hospitalId}/settings/logo
// ==================================================
import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from '../firebase';

// ==================================================
// ✅ Upload logo → Vercel Blob
// ==================================================
export const uploadLogo = async (hospitalId, file, user) => {
  if (!hospitalId || !file) throw new Error('hospitalId এবং file প্রয়োজন');

  // Validation
  if (!file.type.startsWith('image/')) {
    throw new Error('শুধু image ফাইল আপলোড করুন (PNG, JPG, SVG)');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('লোগোর সাইজ সর্বোচ্চ 2MB হতে পারবে');
  }

  // ✅ Vercel API-তে POST
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload-logo', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Logo upload failed');
  }

  const { url, pathname } = data;

  // ✅ Firestore-এ metadata save
  const metaRef = doc(db, 'hospitals', hospitalId, 'settings', 'logo');
  await setDoc(
    metaRef,
    {
      url,
      pathname,
      provider: 'vercel-blob',           // ← কোন storage থেকে এসেছে সেটা track
      uploadedAt: serverTimestamp(),
      uploadedBy: user?.uid || null,
      uploadedByName: user?.name || user?.displayName || null,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
    { merge: true }
  );

  return { url, pathname };
};

// ==================================================
// ✅ Get logo (one-time)
// ==================================================
export const getLogo = async (hospitalId) => {
  if (!hospitalId) return null;
  try {
    const snap = await getDoc(
      doc(db, 'hospitals', hospitalId, 'settings', 'logo')
    );
    if (!snap.exists()) return null;
    return snap.data();
  } catch (err) {
    console.error('❌ getLogo error:', err);
    return null;
  }
};

// ==================================================
// ✅ Subscribe to logo changes (real-time)
// ==================================================
export const subscribeToLogo = (hospitalId, callback, errorCallback) => {
  if (!hospitalId) return () => {};
  try {
    const metaRef = doc(db, 'hospitals', hospitalId, 'settings', 'logo');
    return onSnapshot(
      metaRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data());
        } else {
          callback(null);
        }
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
// ✅ Delete logo (Firestore metadata + optional API call)
// ==================================================
// ⚠️ Vercel Blob থেকে ফাইল ডিলিট করতে আলাদা API লাগবে,
// যদি না করেন — শুধু Firestore থেকে metadata সরালেই
// watermark আর দেখাবে না (Blob-এ ফাইল থেকে যাবে, কিন্তু access হবে না)
// ==================================================
export const deleteLogo = async (hospitalId) => {
  if (!hospitalId) throw new Error('hospitalId প্রয়োজন');
  try {
    const metaRef = doc(db, 'hospitals', hospitalId, 'settings', 'logo');
    const snap = await getDoc(metaRef);

    // Blob delete API call (ঐচ্ছিক — যদি `api/delete-logo.js` বানান)
    if (snap.exists()) {
      const { url } = snap.data();
      if (url) {
        try {
          await fetch('/api/delete-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
        } catch (err) {
          console.warn('⚠️ Blob delete API failed (non-critical):', err.message);
        }
      }
    }

    // Firestore-এ null করে দিই
    await setDoc(
      metaRef,
      { url: null, pathname: null, deletedAt: serverTimestamp() },
      { merge: true }
    );

    return { success: true };
  } catch (err) {
    console.error('❌ deleteLogo error:', err);
    throw err;
  }
};

export default {
  uploadLogo,
  getLogo,
  subscribeToLogo,
  deleteLogo,
};