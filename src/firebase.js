// src/firebase.js
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
  query,
  where,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// আপনার Firebase Config এখানে দিন
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

// ব্রাউজারের অ্যাড-ব্লক থাকলে নিচের লাইনটি আনকমেন্ট (// সরিয়ে) করে 
// টার্মিনালে `firebase emulators:start` কমান্ড দিয়ে চালু করুন:
// connectFirestoreEmulator(db, 'localhost', 8080);

// Firestore ফাংশনগুলো এক্সপোর্ট করুন
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
};