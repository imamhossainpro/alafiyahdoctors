// firebase.js
// ==================================================
// 🔥 Firebase Configuration (Mobile Optimized)
// ==================================================
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ✅ আপনার Firebase Config
const firebaseConfig = {
  apiKey: 'AIzaSyAhAGpQ4ACx-EDePKTxqjKXoS_qN2UoC2M',
  authDomain: 'alafiyahdoctors.firebaseapp.com',
  projectId: 'alafiyahdoctors',
  storageBucket: 'alafiyahdoctors.firebasestorage.app',
  messagingSenderId: '524797545432',
  appId: '1:524797545432:web:c07c1cfc4214a05b0380ad',
  measurementId: 'G-4JVEEPLLS1',
};

const app = initializeApp(firebaseConfig);

// ✅ Auth with AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// ✅ Firestore with Long Polling (mobile-এ WebSocket এর সমস্যা এড়াতে)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// ==================================================
// ✅ Re-export Firestore helpers
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
} from 'firebase/firestore';

// ==================================================
// ✅ Re-export Auth helpers
// ==================================================
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';