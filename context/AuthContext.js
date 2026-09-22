// context/AuthContext.js
// ==================================================
// 🔐 অথেনটিকেশন কনটেক্সট
// ইউজার লগইন/লগআউট + ইউজার ডেটা লোড
// ==================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Firestore থেকে ইউজার ডেটা আনো
          const userDoc = await getDoc(
            doc(db, 'hospitals', DEFAULT_HOSPITAL_ID, 'users', firebaseUser.uid)
          );

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...data,
            });
            console.log('✅ ইউজার লোড হয়েছে:', data.name || firebaseUser.email);
          } else {
            // ডকুমেন্ট না থাকলে default user
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'viewer',
              approved: false,
              hospitalId: DEFAULT_HOSPITAL_ID,
            });
            console.log('⚠️ Firestore-এ ইউজার নেই, default ব্যবহার হচ্ছে');
          }
        } catch (error) {
          console.error('❌ Auth error:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'viewer',
            hospitalId: DEFAULT_HOSPITAL_ID,
          });
        }
      } else {
        setUser(null);
        console.log('ℹ️ ইউজার লগইন নেই');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      console.log('✅ লগআউট হয়েছে');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}