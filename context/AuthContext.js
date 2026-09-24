// context/AuthContext.js
// ==================================================
// 🔐 Authentication Context — সম্পূর্ণ
// ==================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { normalizePhone } from '../utils/bengaliDigits';

const AuthContext = createContext();

// ✅ হাসপাতাল ID (web app-এর সাথে মিল)
const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

// ==================================================
// ✅ Helper — enrich user with normalized fields
// ==================================================
const enrichUser = (firebaseUser, userData) => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    ...userData,
    // ✅ Normalized phone (English digits) for Firebase queries
    phoneNormalized: normalizePhone(userData?.phone),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================================================
  // ✅ Firebase Auth State Listener
  // ==================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(
            db,
            'hospitals',
            DEFAULT_HOSPITAL_ID,
            'users',
            firebaseUser.uid
          );
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUser(enrichUser(firebaseUser, data));
            console.log(
              '✅ Auth state: user loaded',
              data.name || firebaseUser.email
            );
          } else {
            console.log(
              '⚠️ Auth state: Firestore-এ user নেই, sign out করছি'
            );
            await signOut(auth);
            setUser(null);
          }
        } else {
          setUser(null);
          console.log('ℹ️ Auth state: user logged out');
        }
      } catch (err) {
        console.error('❌ Auth state error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ==================================================
  // ✅ Login
  // ==================================================
  const login = async (email, password) => {
    setError(null);
    try {
      console.log('🟡 Firebase login শুরু...');

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log('✅ Firebase Auth সফল:', result.user.uid);

      const userRef = doc(
        db,
        'hospitals',
        DEFAULT_HOSPITAL_ID,
        'users',
        result.user.uid
      );
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error('এই ইউজার Firestore-এ নেই। রেজিস্ট্রেশন করুন।');
      }

      const userData = userSnap.data();
      console.log('📄 Firestore user data:', userData);

      // Approved check
      if (userData.approved !== true) {
        await signOut(auth);
        throw new Error(
          '⏳ আপনার অ্যাকাউন্ট এখনো অ্যাডমিন এপ্রুভ করেননি। অপেক্ষা করুন।'
        );
      }

      // Active check
      if (userData.isActive === false) {
        await signOut(auth);
        throw new Error('❌ আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।');
      }

      // ✅ user state set
      setUser(enrichUser(result.user, userData));

      console.log('✅ Login সম্পূর্ণ');
      return { success: true, user: userData };
    } catch (err) {
      let errorMessage = err.message;

      if (err.code === 'auth/user-not-found') {
        errorMessage = '❌ এই ইমেইলে কোনো ইউজার নেই।';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '❌ পাসওয়ার্ড ভুল।';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '❌ ইমেইল সঠিক নয়।';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = '⚠️ অনেকবার চেষ্টা। কিছুক্ষণ পর চেষ্টা করুন।';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = '🌐 ইন্টারনেট সংযোগ নেই।';
      }

      setError(errorMessage);
      console.error('❌ Login error:', err);
      return { success: false, error: errorMessage };
    }
  };

  // ==================================================
  // ✅ Register — WITH DEBUG LOGS
  // ==================================================
  const register = async ({
    name,
    email,
    password,
    designation = '',
    phone = '',
  }) => {
    setError(null);

    // ✅ DEBUG LOG — register-এ data আসছে কিনা
    console.log('🔍 [AuthContext.register] RECEIVED:', {
      name,
      email,
      designation,
      phone,
      phoneType: typeof phone,
      phoneLength: phone?.length,
    });

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(result.user, { displayName: name });

      const userRef = doc(
        db,
        'hospitals',
        DEFAULT_HOSPITAL_ID,
        'users',
        result.user.uid
      );

      // ✅ Normalize phone
      const normalizedPhone = normalizePhone(phone);

      // ✅ DEBUG LOG — normalized value
      console.log('🔍 [AuthContext.register] NORMALIZED PHONE:', {
        raw: phone,
        normalized: normalizedPhone,
      });

      const userData = {
        name: name.trim(),
        email: email.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        phoneNormalized: normalizedPhone,
        role: 'pending',
        approved: false,
        isActive: true,
        hospitalId: DEFAULT_HOSPITAL_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // ✅ DEBUG LOG — what we're about to save
      console.log('🔍 [AuthContext.register] SAVING TO FIRESTORE:', userData);

      await setDoc(userRef, userData);

      console.log('✅ [AuthContext.register] Firestore save SUCCESS');

      // Sign out (user-কে login screen-এ ফিরিয়ে নিয়ে যাবে)
      await signOut(auth);

      console.log('✅ রেজিস্ট্রেশন সফল:', email);
      return { success: true };
    } catch (err) {
      let errorMessage = err.message;

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '❌ এই ইমেইল ইতিমধ্যে ব্যবহার করা হয়েছে।';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '❌ ইমেইল সঠিক নয়।';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = '🌐 ইন্টারনেট সংযোগ নেই।';
      }

      setError(errorMessage);
      console.error('❌ Register error:', err);
      return { success: false, error: errorMessage };
    }
  };

  // ==================================================
  // ✅ Reset Password
  // ==================================================
  const resetPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      console.log('✅ Reset email পাঠানো হয়েছে:', email);
      return { success: true };
    } catch (err) {
      let errorMessage = err.message;

      if (err.code === 'auth/user-not-found') {
        errorMessage = '❌ এই ইমেইলে কোনো ইউজার নেই।';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '❌ ইমেইল সঠিক নয়।';
      }

      setError(errorMessage);
      console.error('❌ Reset error:', err);
      return { success: false, error: errorMessage };
    }
  };

  // ==================================================
  // ✅ Logout
  // ==================================================
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ লগআউট সফল');
      return { success: true };
    } catch (err) {
      console.error('❌ Logout error:', err);
      return { success: false, error: err.message };
    }
  };

  // ==================================================
  // ✅ Role Helpers
  // ==================================================
  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';
  const isEditor = user?.role === 'editor';
  const isViewer = user?.role === 'viewer';
  const isPending = user?.role === 'pending' || user?.approved === false;

  const canManageUsers = isAdmin;
  const canManageDoctors = isAdmin || isSubAdmin || isEditor;
  const canViewAdmin = isAdmin || isSubAdmin;

  // ==================================================
  // ✅ Context Value
  // ==================================================
  const value = {
    user,
    loading,
    error,

    login,
    register,
    resetPassword,
    logout,

    isAdmin,
    isSubAdmin,
    isEditor,
    isViewer,
    isPending,
    canManageUsers,
    canManageDoctors,
    canViewAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================================================
// ✅ Custom Hook
// ==================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}