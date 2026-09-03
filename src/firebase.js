import { initializeApp } from 'firebase/app';
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
} from 'firebase/firestore';
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAhAGpQ4ACx-EDePKTxqjKXoS_qN2UoC2M",
  authDomain: "alafiyahdoctors.firebaseapp.com",
  projectId: "alafiyahdoctors",
  storageBucket: "alafiyahdoctors.firebasestorage.app",
  messagingSenderId: "524797545432",
  appId: "1:524797545432:web:c07c1cfc4214a05b0380ad",
  measurementId: "G-4JVEEPLLS1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const auth = getAuth(app);

// ✅ session persistence (ট্যাব বন্ধ করলে লগআউট)
setPersistence(auth, browserSessionPersistence)
  .catch((error) => console.error('Auth persistence error:', error));

export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
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
};