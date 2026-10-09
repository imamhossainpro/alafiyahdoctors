// src/services/logoService.js
// ==================================================
// 🖼️ Logo Service — Hospital MOU logo management
// ==================================================
// ✅ Upload / delete logo to Firebase Storage
// ✅ Real-time metadata subscription
// ✅ URL persistence in Firestore
// ==================================================

import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '../firebase';
import {
  storage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

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
// ✅ Upload new logo
// ==================================================
export const uploadLogo = async (
  hospitalId = DEFAULT_HOSPITAL_ID,
  file,
  user = null
) => {
  if (!file) throw new Error('File required');

  // Validation
  if (!file.type.startsWith('image/')) {
    throw new Error('শুধু ছবি ফাইল আপলোড করুন');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('লোগো সাইজ সর্বোচ্চ 2MB');
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `hospitals/${hospitalId}/mou-logo/logo_${Date.now()}.${ext}`;

  const sRef = storageRef(storage, path);
  await uploadBytes(sRef, file, {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000',
  });

  const url = await getDownloadURL(sRef);

  // Save metadata
  const metaRef = getLogoMetaRef(hospitalId);
  await setDoc(
    metaRef,
    {
      url,
      path,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.uid || user?.id || null,
      uploadedByName: user?.name || user?.displayName || null,
    },
    { merge: true }
  );

  return { url, path };
};

// ==================================================
// ✅ Delete logo
// ==================================================
export const deleteLogo = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  try {
    const snap = await getDoc(getLogoMetaRef(hospitalId));
    if (!snap.exists()) return;

    const { path } = snap.data();

    if (path) {
      try {
        const sRef = storageRef(storage, path);
        await deleteObject(sRef);
      } catch (err) {
        if (err.code !== 'storage/object-not-found') {
          console.warn('⚠️ deleteLogo storage error:', err.message);
        }
      }
    }

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