import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, db, doc, getDoc } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult();
          const claims = token.claims || {};

          let userData = {};
          let hospitalId = claims.hospitalId || null;
          let role = claims.role || 'viewer';
          let approved = claims.approved || false;

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            userData = data;
            hospitalId = data.hospitalId || hospitalId;
            role = data.role || role;
            approved = data.approved !== undefined ? data.approved : approved;
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || firebaseUser.displayName || firebaseUser.email || 'ইউজার',
            role: role,
            hospitalId: hospitalId,
            approved: approved,
            ...userData
          });
        } catch (error) {
          console.error('AuthContext error:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email || 'ইউজার',
            role: 'viewer',
            hospitalId: 'alafiyah_main',
            approved: false
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}