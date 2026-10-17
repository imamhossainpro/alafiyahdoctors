// src/context/PermissionContext.jsx
// ==================================================
// 🔐 Permission Context — Fixed
// ==================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { db, doc, onSnapshot } from '../firebase';
import { useAuth } from './AuthContext';
import { useHospital } from './HospitalContext';
import {
  calculateEffectivePermissions,
  hasPermission as hp,
} from '../utils/permissions';

const PermissionContext = createContext();

export function PermissionProvider({ children }) {
  const { user: authUser } = useAuth();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================================================
  // ✅ Real-time listener on user document
  // ==================================================
  useEffect(() => {
    if (!authUser?.uid) {
      setUserData(null);
      setPermissions({});
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const userRef = doc(db, 'hospitals', hospitalId, 'users', authUser.uid);

    console.log('🔐 [PermissionContext] Subscribing to:', userRef.path);

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setUserData(data);

          // ✅ সরাসরি calculateEffectivePermissions কল করুন
          const calculated = calculateEffectivePermissions(data);
          
          console.log('📋 [PermissionContext] User Data:', {
            role: data.role,
            approved: data.approved,
            isActive: data.isActive,
            grantedCount: Object.values(calculated).filter(v => v === true).length
          });

          setPermissions(calculated);
        } else {
          console.warn('⚠️ [PermissionContext] User document NOT FOUND:', userRef.path);
          setUserData(null);
          setPermissions({});
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ [PermissionContext] Listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authUser?.uid, hospitalId]);

  // ==================================================
  // ✅ Permission check helpers
  // ==================================================
  const hasPerm = useCallback(
    (key) => {
      return hp(permissions, key);
    },
    [permissions]
  );

  const can = hasPerm;

  const hasAny = useCallback(
    (keys = []) => {
      return keys.some((k) => hp(permissions, k));
    },
    [permissions]
  );

  const hasAll = useCallback(
    (keys = []) => {
      return keys.every((k) => hp(permissions, k));
    },
    [permissions]
  );

  // ==================================================
  // ✅ Context value
  // ==================================================
  const value = useMemo(
    () => ({
      userData,
      permissions,
      loading,
      error,
      hasPermission: hasPerm,
      can,
      hasAny,
      hasAll,
      refresh: () => {
        if (userData) {
          setPermissions(calculateEffectivePermissions(userData));
        }
      },
    }),
    [userData, permissions, loading, error, hasPerm, hasAny, hasAll]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    return {
      userData: null,
      permissions: {},
      loading: false,
      error: null,
      hasPermission: () => false,
      can: () => false,
      hasAny: () => false,
      hasAll: () => false,
      refresh: () => {},
    };
  }
  return ctx;
}