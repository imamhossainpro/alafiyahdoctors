// src/services/authService.js
// ==================================================
// 🔐 Auth Service — Email / Google sign-in
// ==================================================
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// ==================================================
// ✅ Email Sign-In
// ==================================================
export const emailSignIn = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

// ==================================================
// ✅ Email Sign-Up
// ==================================================
export const emailSignUp = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  if (name && name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred;
};

// ==================================================
// ✅ Google Sign-In (popup)
// ==================================================
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(auth, provider);
};

// ==================================================
// ✅ Sign Out
// ==================================================
export const logOut = async () => {
  await signOut(auth);
};

// ==================================================
// ✅ Ensure User Doc Exists in Firestore
// --------------------------------------------------
// ✅ নতুন user → role: 'patient', approved: true
// ✅ পুরনো user → merge করে ফেরত দেয়
// ==================================================
export const ensureUserDoc = async (hospitalId, firebaseUser, extra = {}) => {
  if (!hospitalId || !firebaseUser) return null;

  const userRef = doc(db, 'hospitals', hospitalId, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  // ---------- Existing user ----------
  if (snap.exists()) {
    const existing = snap.data();
    const updates = {};

    // Mobile না থাকলে যোগ করুন
    if (!existing.mobile && extra.mobile) {
      updates.mobile = extra.mobile;
      updates.mobileVerified = true;
    }

    // photoURL যোগ করুন (Google avatar)
    if (!existing.photoURL && firebaseUser.photoURL) {
      updates.photoURL = firebaseUser.photoURL;
    }

    // name খালি থাকলে Firebase থেকে নিন
    if (!existing.name && firebaseUser.displayName) {
      updates.name = firebaseUser.displayName;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await updateDoc(userRef, updates);
      return { ...existing, ...updates };
    }

    return existing;
  }

  // ---------- New user ----------
  // ✅ role: 'patient' — auto approved
  const newUser = {
    uid: firebaseUser.uid,
    name:
      firebaseUser.displayName ||
      extra.name ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : ''),
    email: firebaseUser.email || '',
    mobile: extra.mobile || firebaseUser.phoneNumber || '',
    mobileVerified: !!firebaseUser.phoneNumber,
    role: 'patient',                    // ✅ রোগী role
    approved: true,                      // ✅ auto-approved
    isActive: true,
    photoURL: firebaseUser.photoURL || '',
    authProvider: extra.authProvider || 'email',
    hospitalId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(userRef, newUser);
  console.log('✅ New patient user created:', firebaseUser.uid);
  return newUser;
};

// ==================================================
// ✅ Check if user has mobile
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
// ✅ Save mobile number
// ==================================================
export const saveMobileToUser = async (
  hospitalId,
  userId,
  mobile,
  verified = false
) => {
  if (!hospitalId || !userId || !mobile) {
    throw new Error('hospitalId, userId, mobile required');
  }

  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  let normalized = cleanMobile;
  if (cleanMobile.startsWith('0')) {
    normalized = '88' + cleanMobile;
  } else if (!cleanMobile.startsWith('88')) {
    normalized = '88' + cleanMobile;
  }

  await updateDoc(
    doc(db, 'hospitals', hospitalId, 'users', userId),
    {
      mobile: normalized,
      mobileVerified: verified,
      mobileAddedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  return { mobile: normalized };
};

export default {
  emailSignIn,
  emailSignUp,
  googleSignIn,
  logOut,
  ensureUserDoc,
  userHasMobile,
  saveMobileToUser,
};