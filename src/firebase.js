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
} from 'firebase/firestore';

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