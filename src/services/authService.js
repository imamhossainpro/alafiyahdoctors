// src/services/authService.js
// ==================================================
// 🔐 Auth Service — Email, Google, Phone sign-in
// ==================================================
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from '../firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

// ==================================================
// ✅ Email sign-in / sign-up
// ==================================================
export const emailSignIn = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const emailSignUp = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred;
};

// ==================================================
// ✅ Google sign-in
// ==================================================
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result;
};

// ==================================================
// ✅ Phone sign-in (reCAPTCHA + OTP)
// ==================================================

/**
 * Setup recaptcha container
 * @param {string} containerId - DOM element id where recaptcha renders
 */
export const setupRecaptcha = (containerId) => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    window.recaptchaVerifier = null;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // Response expired
    },
  });

  return window.recaptchaVerifier;
};

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - E.164 format (e.g., +8801700000000)
 * @param {string} containerId - reCAPTCHA container id
 * @returns {Object} confirmationResult — save this to verify OTP
 */
export const sendPhoneOTP = async (phoneNumber, containerId) => {
  const verifier = setupRecaptcha(containerId);
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    verifier
  );
  return confirmationResult;
};

/**
 * Verify OTP
 * @param {Object} confirmationResult - returned from sendPhoneOTP
 * @param {string} otp - 6-digit code
 */
export const verifyPhoneOTP = async (confirmationResult, otp) => {
  const result = await confirmationResult.confirm(otp);
  return result;
};

// ==================================================
// ✅ Logout
// ==================================================
export const logOut = async () => {
  await signOut(auth);
};

// ==================================================
// ✅ Ensure user doc exists in Firestore
// ==================================================
export const ensureUserDoc = async (hospitalId, firebaseUser, extra = {}) => {
  if (!hospitalId || !firebaseUser) return null;

  const userRef = doc(db, 'hospitals', hospitalId, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const userData = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || extra.name || '',
      email: firebaseUser.email || '',
      mobile: extra.mobile || firebaseUser.phoneNumber || '',
      mobileVerified: !!firebaseUser.phoneNumber,
      role: extra.role || 'patient',       // ✅ নতুন Google/Phone user → patient
      approved: true,                       // ✅ patients auto-approved
      isActive: true,
      photoURL: firebaseUser.photoURL || '',
      authProvider: extra.authProvider || 'email',
      hospitalId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, userData);
    return userData;
  }

  // Update existing (merge mobile if new)
  const existing = snap.data();
  const updates = { updatedAt: serverTimestamp() };

  if (!existing.mobile && extra.mobile) {
    updates.mobile = extra.mobile;
    updates.mobileVerified = true;
  }

  if (Object.keys(updates).length > 1) {
    await setDoc(userRef, updates, { merge: true });
  }

  return { ...existing, ...updates };
};

// ==================================================
// ✅ Check if user has mobile (for gating patient dashboard)
// ==================================================
export const userHasMobile = async (hospitalId, userId) => {
  if (!hospitalId || !userId) return false;
  try {
    const snap = await getDoc(
      doc(db, 'hospitals', hospitalId, 'users', userId)
    );
    if (!snap.exists()) return false;
    const data = snap.data();
    return !!(data.mobile && data.mobileVerified);
  } catch (err) {
    console.error('❌ userHasMobile error:', err);
    return false;
  }
};

// ==================================================
// ✅ Save mobile number to user doc
// ==================================================
export const saveMobileToUser = async (hospitalId, userId, mobile, verified = false) => {
  if (!hospitalId || !userId || !mobile) {
    throw new Error('hospitalId, userId, mobile required');
  }

  // Normalize mobile (11 digits → 880XXXXXXXXXX)
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  let normalized = cleanMobile;
  if (cleanMobile.startsWith('0')) {
    normalized = '88' + cleanMobile;
  } else if (cleanMobile.startsWith('88')) {
    normalized = cleanMobile;
  } else {
    normalized = '88' + cleanMobile;
  }

  await setDoc(
    doc(db, 'hospitals', hospitalId, 'users', userId),
    {
      mobile: normalized,
      mobileVerified: verified,
      mobileAddedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { mobile: normalized };
};

export default {
  emailSignIn,
  emailSignUp,
  googleSignIn,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
  logOut,
  ensureUserDoc,
  userHasMobile,
  saveMobileToUser,
};