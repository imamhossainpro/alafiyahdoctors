// src/context/PermissionContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, doc, getDoc, onSnapshot } from '../firebase';
import { useAuth } from './AuthContext';
import { useHospital } from './HospitalContext';
import { calculateEffectivePermissions, hasPermission as hp } from '../utils/permissions';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const { user: authUser } = useAuth();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  // Real-time listener on user document
  useEffect(() => {
    if (!authUser?.uid) {
      setUserData(null);
      setPermissions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'hospitals', hospitalId, 'users', authUser.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setUserData(data);
          setPermissions(calculateEffectivePermissions(data));
        } else {
          setUserData(null);
          setPermissions({});
        }
        setLoading(false);
      },
      (err) => {
        console.error('Permission listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authUser?.uid, hospitalId]);

  const hasPerm = useCallback((key) => {
    return hp(permissions, key);
  }, [permissions]);

  const can = hasPerm; // alias

  const hasAny = useCallback((keys = []) => {
    return keys.some((k) => hp(permissions, k));
  }, [permissions]);

  const hasAll = useCallback((keys = []) => {
    return keys.every((k) => hp(permissions, k));
  }, [permissions]);

  const value = {
    userData,
    permissions,
    loading,
    hasPermission: hasPerm,
    can,
    hasAny,
    hasAll,
    refresh: () => setPermissions(calculateEffectivePermissions(userData)),
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    // Fallback – if not inside provider
    return {
      userData: null,
      permissions: {},
      loading: false,
      hasPermission: () => false,
      can: () => false,
      hasAny: () => false,
      hasAll: () => false,
      refresh: () => {},
    };
  }
  return ctx;
}