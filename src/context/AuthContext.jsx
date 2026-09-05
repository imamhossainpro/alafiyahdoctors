// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();
const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // hospital পাথে ইউজার ডেটা পড়ুন
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
          } else {
            // ডকুমেন্ট না থাকলে (পুরনো root ইউজার) ডিফল্ট তৈরি করুন
            // আপনি চাইলে root থেকেও পড়তে পারেন, কিন্তু আমি সুপারিশ করি hospital পাথে কপি করুন
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'viewer',
              approved: false,
              hospitalId: DEFAULT_HOSPITAL_ID,
            });
          }
        } catch (error) {
          console.error('Auth error:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'viewer',
            hospitalId: DEFAULT_HOSPITAL_ID,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}