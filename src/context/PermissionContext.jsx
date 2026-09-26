// src/context/PermissionContext.jsx
// ==================================================
// 🔐 Permission Context — Fixed
// ==================================================
// ✅ Real-time listener on user document
// ✅ Auto-approve when permissions are managed
// ✅ Debug logs + Error handling
// ✅ Auto refresh on permission change
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

          // ✅ Debug logs
          console.log('📋 [PermissionContext] User Data:', {
            role: data.role,
            approved: data.approved,
            isActive: data.isActive,
            overridesCount: Object.keys(data.permissionOverrides || {}).length,
          });

          // ⚠️ Only warn — do NOT block permissions based on `approved`.
          // Admin must explicitly set `isActive: false` to disable a user.
          if (data.approved !== true) {
            console.warn(
              '⚠️ [PermissionContext] User NOT approved — but permissions will still be computed from role/overrides'
            );
          }

          if (data.isActive === false) {
            console.warn(
              '⚠️ [PermissionContext] User is INACTIVE — permissions will be emptied'
            );
          }

          setUserData(data);

          // ✅ If user is inactive, empty permissions. Otherwise compute normally.
          const calculated =
            data.isActive === false
              ? {}
              : calculateEffectivePermissions(data);

          const grantedCount = Object.values(calculated).filter(
            (v) => v === true
          ).length;
          console.log(
            `📋 [PermissionContext] Granted: ${grantedCount}/${Object.keys(calculated).length}`
          );

          setPermissions(calculated);
        } else {
          console.warn(
            '⚠️ [PermissionContext] User document NOT FOUND:',
            userRef.path
          );
          setUserData(null);
          setPermissions({});
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ [PermissionContext] Listener error:', err);
        console.error('   → সম্ভবত Firestore Rules-এ read permission নেই');
        console.error('   → Firebase Console → Firestore → Rules check করুন');
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
      const result = hp(permissions, key);
      return result;
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
      refresh: () =>
        setPermissions(calculateEffectivePermissions(userData)),
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