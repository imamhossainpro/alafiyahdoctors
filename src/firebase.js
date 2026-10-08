// src/firebase.js
// ==================================================
// 🔥 Firebase Configuration — Full File
// ==================================================
// ✅ Firestore, Auth, Storage, Analytics
// ✅ Google Sign-In
// ✅ Phone (OTP) Sign-In
// ✅ Email/Password Sign-In
// ✅ ESM exports for all services
// ✅ GA4 tracking helper
// ==================================================
import { initializeApp } from 'firebase/app';

// ---------- Firestore ----------
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';

// ---------- Auth ----------
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  // ✅ Google
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  // ✅ Phone
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  // ✅ Link phone to existing account
  linkWithCredential,
  linkWithPhoneNumber,
} from 'firebase/auth';

// ---------- Storage ----------
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';

// ---------- Analytics ----------
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';

// ==================================================
// ✅ Firebase Config
// ==================================================
const firebaseConfig = {
  apiKey: 'AIzaSyAhAGpQ4ACx-EDePKTxqjKXoS_qN2UoC2M',
  authDomain: 'alafiyahdoctors.firebaseapp.com',
  projectId: 'alafiyahdoctors',
  storageBucket: 'alafiyahdoctors.firebasestorage.app',
  messagingSenderId: '524797545432',
  appId: '1:524797545432:web:c07c1cfc4214a05b0380ad',
  measurementId: 'G-4JVEEPLLS1',
};

// ==================================================
// ✅ Initialize Firebase
// ==================================================
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

const auth = getAuth(app);

// ==================================================
// ✅ Auth Persistence (session-only)
// ==================================================
setPersistence(auth, browserSessionPersistence).catch((error) =>
  console.error('Auth persistence error:', error)
);

// ==================================================
// ✅ Google Analytics 4
// ==================================================
let analytics = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('✅ GA4 Analytics initialized');
      } else {
        console.warn('⚠️ GA4 not supported in this environment');
      }
    })
    .catch((err) => {
      console.error('❌ GA4 initialization error:', err);
    });
}

export { analytics };

// ==================================================
// ✅ Analytics Helper — safe event tracking
// ==================================================
/**
 * GA4-তে কাস্টম ইভেন্ট পাঠান (safe wrapper)
 * @param {string} eventName - GA4-এর allowed event name (snake_case)
 * @param {object} params - event parameters
 */
// ✅ Pending events queue – analytics ready হওয়ার আগে events জমা রাখে
const pendingEvents = [];

export const trackEvent = (eventName, params = {}) => {
  if (!analytics) {
    // Analytics এখনো ready নয় – queue-এ রাখুন
    pendingEvents.push({ eventName, params });
    console.log(`⏳ GA4 event queued: ${eventName}`);
    return;
  }
  try {
    logEvent(analytics, eventName, params);
    console.log(`📊 GA4 event: ${eventName}`, params);
  } catch (err) {
    console.error(`❌ GA4 logEvent error [${eventName}]:`, err);
  }
};

// ✅ Analytics ready হলে queue flush করুন
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('✅ GA4 Analytics initialized');

        // Queue-এ জমা events পাঠান
        if (pendingEvents.length > 0) {
          console.log(`📤 Flushing ${pendingEvents.length} queued GA4 events`);
          pendingEvents.forEach(({ eventName, params }) => {
            try {
              logEvent(analytics, eventName, params);
            } catch (err) {
              console.error(`❌ Failed to send queued event ${eventName}:`, err);
            }
          });
          pendingEvents.length = 0;
        }
      } else {
        console.warn('⚠️ GA4 not supported in this environment');
      }
    })
    .catch((err) => {
      console.error('❌ GA4 initialization error:', err);
    });
}

// ==================================================
// ✅ Exports — Auth
// ==================================================
export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  // ✅ Google
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  // ✅ Phone
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  // ✅ Link phone
  linkWithCredential,
  linkWithPhoneNumber,
};

// ==================================================
// ✅ Exports — Firestore
// ==================================================
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction,
};

// ==================================================
// ✅ Exports — Storage
// ==================================================
export {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
};

// ==================================================
// ✅ Exports — Analytics
// ==================================================
export { logEvent, isSupported };