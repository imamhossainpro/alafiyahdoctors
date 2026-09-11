// src/components/admin/UserAccessManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, getDocs, doc, updateDoc, onSnapshot, serverTimestamp } from '../../firebase';
import { useHospital } from '../../context/HospitalContext';
import { usePermission } from '../../context/PermissionContext';
import { logActivity, LOG_MODULES, LOG_ACTIONS } from '../../services/activityLogService';
import {
  PERMISSION_REGISTRY,
  ROLE_TEMPLATES,
  ALL_PERMISSIONS,
  calculateEffectivePermissions,
  applyDependencies,
  getRoleLabel,
} from '../../utils/permissions';
import PermissionMatrix from './PermissionMatrix';
import { Search, Users, Shield, X, Save, RotateCcw, AlertCircle } from 'lucide-react';

export default function UserAccessManager({ user: currentUser }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { can } = usePermission();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // Real-time users list
  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    const ref = collection(db, 'hospitals', hospitalId, 'users');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Users listener error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [hospitalId]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.id || '').toLowerCase().includes(term) ||
        (u.designation || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (!can('user.view') && currentUser?.role !== 'admin') {
    return (
      <div style={{ background: '#fff', padding: '40px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <AlertCircle size={48} color="#dc2626" />
        <h3 style={{ color: '#dc2626', marginTop: '12px' }}>Access Denied</h3>
        <p style={{ color: '#64748b' }}>আপনার এই পেজ দেখার permission নেই।</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={22} color="#1c5fa8" /> User Access Control
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            প্রতিটি ইউজারের জন্য আলাদা permission নির্ধারণ করুন
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '4px 12px', minWidth: '280px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="নাম / ইমেইল / User ID সার্চ করুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', padding: '8px 10px', fontSize: '14px', width: '100%' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>লোড হচ্ছে...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>নাম</th>
                <th style={{ padding: '12px' }}>User ID</th>
                <th style={{ padding: '12px' }}>Designation</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    কোনো ইউজার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{u.name || u.displayName || 'নাম নেই'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
                      {u.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>{u.designation || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          background: u.role === 'admin' ? '#dbeafe' : u.role === 'sub-admin' ? '#ede9fe' : '#f1f5f9',
                          color: u.role === 'admin' ? '#1e40af' : u.role === 'sub-admin' ? '#6d28d9' : '#475569',
                          padding: '3px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          background: u.approved && u.isActive !== false ? '#dcfce7' : '#fee2e2',
                          color: u.approved && u.isActive !== false ? '#166534' : '#991b1b',
                          padding: '3px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {u.approved && u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedUser(u)}
                        disabled={!can('user.permission_manage') && currentUser?.role !== 'admin'}
                        style={{
                          background: can('user.permission_manage') || currentUser?.role === 'admin' ? '#1c5fa8' : '#94a3b8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          cursor: can('user.permission_manage') || currentUser?.role === 'admin' ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        Manage Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <PermissionMatrix
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setSelectedUser(null)}
          onSaved={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}