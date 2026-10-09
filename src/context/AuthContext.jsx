// src/context/AuthContext.jsx
// ==================================================
// 🔐 Authentication Context
// ==================================================
// ✅ User data + permissions load
// ✅ Real-time user document listener
// ✅ Logout function (only manual + user error)
// ✅ Session persistence without unwanted logout
// ==================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();
const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // ✅ Firebase Auth state listener
  // ==================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔐 [AuthContext] User signed in:', firebaseUser.uid);

          const userDoc = await getDoc(
            doc(
              db,
              'hospitals',
              DEFAULT_HOSPITAL_ID,
              'users',
              firebaseUser.uid
            )
          );

          if (userDoc.exists()) {
            const data = userDoc.data();

            // ⚠️ Inactive user → signOut (only when explicitly disabled)
            if (data.isActive === false) {
              console.warn('⚠️ [AuthContext] User is inactive — signing out');
              await auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }

            console.log('📋 [AuthContext] User data loaded:', {
              role: data.role,
              approved: data.approved,
              isActive: data.isActive,
            });

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...data,
            });
          } else {
            console.warn('⚠️ [AuthContext] User document not found');
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'viewer',
              approved: false,
              hospitalId: DEFAULT_HOSPITAL_ID,
            });
          }
        } catch (error) {
          console.error('❌ [AuthContext] Auth error:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'viewer',
            hospitalId: DEFAULT_HOSPITAL_ID,
          });
        }
      } else {
        console.log('🔐 [AuthContext] User signed out');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==================================================
  // ✅ Real-time listener on own user document
  // (to reflect permission changes without logout)
  // ==================================================
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(
      db,
      'hospitals',
      DEFAULT_HOSPITAL_ID,
      'users',
      user.uid
    );

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          // ⚠️ Only sign out if explicitly disabled by admin
          if (data.isActive === false) {
            console.warn('⚠️ [AuthContext] User disabled — signing out');
            auth.signOut();
            setUser(null);
            return;
          }

          console.log('🔄 [AuthContext] User doc updated:', {
            role: data.role,
            overridesCount: Object.keys(data.permissionOverrides || {})
              .length,
          });

          setUser((prev) => ({
            uid: prev?.uid,
            email: prev?.email,
            ...data,
          }));
        }
      },
      (err) => {
        console.error('❌ [AuthContext] User doc listener error:', err);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // ==================================================
  // ✅ Logout — manual only (or user disabled)
  // ==================================================
  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      console.log('✅ Logout success');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}