// src/components/admin/PermissionMatrix.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { db, doc, updateDoc, serverTimestamp } from '../../firebase';
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
import { X, Save, RotateCcw, Search, CheckSquare, Square, AlertCircle } from 'lucide-react';

export default function PermissionMatrix({ user, currentUser, onClose, onSaved }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { can } = usePermission();

  const isAdmin = currentUser?.role === 'admin';

  // Local editable state – permission overrides
  const [permissions, setPermissions] = useState({});
  const [role, setRole] = useState(user.role || 'viewer');
  const [isActive, setIsActive] = useState(user.isActive !== false);
  const [saving, setSaving] = useState(false);
  const [searchPerm, setSearchPerm] = useState('');
  const [message, setMessage] = useState('');
  const [showEffective, setShowEffective] = useState(false);

  // Initialize from user data
  useEffect(() => {
    const effective = calculateEffectivePermissions(user);
    setPermissions(effective);
    setRole(user.role || 'viewer');
    setIsActive(user.isActive !== false);
  }, [user]);

  // Filter permissions by search
  const filteredRegistry = useMemo(() => {
    if (!searchPerm.trim()) return PERMISSION_REGISTRY;
    const term = searchPerm.toLowerCase().trim();
    return PERMISSION_REGISTRY.map((m) => ({
      ...m,
      permissions: m.permissions.filter(
        (p) =>
          p.label.toLowerCase().includes(term) ||
          p.key.toLowerCase().includes(term) ||
          m.module.toLowerCase().includes(term)
      ),
    })).filter((m) => m.permissions.length > 0);
  }, [searchPerm]);

  // Toggle single permission
  const togglePermission = (key) => {
    setPermissions((prev) => {
      const newValue = !prev[key];
      const updated = { ...prev, [key]: newValue };
      // Auto-enable dependencies if turned on
      if (newValue) return applyDependencies(updated);
      return updated;
    });
  };

  // Toggle all permissions in a module
  const toggleModule = (module, selectAll) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      module.permissions.forEach((p) => {
        updated[p.key] = selectAll;
      });
      return selectAll ? applyDependencies(updated) : updated;
    });
  };

  // Select all
  const selectAll = () => {
    const all = {};
    ALL_PERMISSIONS.forEach((k) => { all[k] = true; });
    setPermissions(all);
  };

  // Clear all
  const clearAll = () => {
    const none = {};
    ALL_PERMISSIONS.forEach((k) => { none[k] = false; });
    setPermissions(none);
  };

  // Reset to role template
  const resetToRole = () => {
    const template = ROLE_TEMPLATES[role] || ROLE_TEMPLATES.pending;
    const reset = {};
    ALL_PERMISSIONS.forEach((k) => {
      reset[k] = template.permissions[k] === true;
    });
    setPermissions(reset);
    setMessage('✅ Role template-এ reset হয়েছে (Save করুন)');
    setTimeout(() => setMessage(''), 3000);
  };

  // Change role → re-apply template
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const template = ROLE_TEMPLATES[newRole] || ROLE_TEMPLATES.pending;
    const newPerms = {};
    ALL_PERMISSIONS.forEach((k) => {
      newPerms[k] = template.permissions[k] === true;
    });
    setPermissions(newPerms);
  };

  // Calculate overrides vs role (what to actually save)
  const calculateOverrides = () => {
    const template = ROLE_TEMPLATES[role] || ROLE_TEMPLATES.pending;
    const overrides = {};
    ALL_PERMISSIONS.forEach((k) => {
      const roleValue = template.permissions[k] === true;
      const userValue = permissions[k] === true;
      if (roleValue !== userValue) {
        overrides[k] = userValue;
      }
    });
    return overrides;
  };

  // Save
  const handleSave = async () => {
    if (!isAdmin && !can('user.permission_manage')) {
      setMessage('❌ আপনার permission পরিবর্তন করার access নেই');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const overrides = calculateOverrides();
      const userRef = doc(db, 'hospitals', hospitalId, 'users', user.id);

      // Build diff for activity log
      const oldOverrides = user.permissionOverrides || {};
      const changes = [];
      ALL_PERMISSIONS.forEach((k) => {
        const oldVal = oldOverrides[k] === true;
        const newVal = overrides[k] === true;
        if (oldVal !== newVal) {
          changes.push({ key: k, old: oldVal, new: newVal });
        }
      });

      const roleChanged = role !== user.role;
      const activeChanged = isActive !== (user.isActive !== false);

      await updateDoc(userRef, {
        role,
        isActive,
        permissionOverrides: overrides,
        permissionsUpdatedAt: serverTimestamp(),
        permissionsUpdatedBy: currentUser?.id || currentUser?.uid || null,
      });

      // Activity Log
      try {
        if (roleChanged) {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.SETTINGS,
            action: LOG_ACTIONS.UPDATE,
            recordId: user.id,
            description: `${user.name} এর Role পরিবর্তন: ${getRoleLabel(user.role)} → ${getRoleLabel(role)}`,
            oldValue: { role: user.role },
            newValue: { role },
            user: currentUser,
          });
        }

        if (activeChanged) {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.SETTINGS,
            action: LOG_ACTIONS.UPDATE,
            recordId: user.id,
            description: `${user.name} এর status: ${user.isActive !== false ? 'Active' : 'Inactive'} → ${isActive ? 'Active' : 'Inactive'}`,
            oldValue: { isActive: user.isActive !== false },
            newValue: { isActive },
            user: currentUser,
          });
        }

        if (changes.length > 0) {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.SETTINGS,
            action: 'PERMISSION_UPDATED',
            recordId: user.id,
            description: `${user.name} এর ${changes.length} টি permission পরিবর্তন করা হয়েছে`,
            oldValue: changes.reduce((acc, c) => { acc[c.key] = c.old; return acc; }, {}),
            newValue: changes.reduce((acc, c) => { acc[c.key] = c.new; return acc; }, {}),
            user: currentUser,
          });
        }
      } catch (logErr) {
        console.error('Activity log error:', logErr);
      }

      setMessage('✅ Permissions সফলভাবে সংরক্ষণ করা হয়েছে');
      setTimeout(() => {
        if (onSaved) onSaved();
      }, 800);
    } catch (err) {
      console.error('Save error:', err);
      setMessage('❌ সংরক্ষণ ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px',
          maxWidth: '960px', width: '100%',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>🔐 User Access Control</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {user.name} · <span style={{ fontFamily: 'monospace' }}>{user.id}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={22} />
          </button>
        </div>

        {/* User info + role + status */}
        <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Role</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', background: '#fff', minWidth: '160px' }}
            >
              {Object.entries(ROLE_TEMPLATES).map(([key, tpl]) => (
                <option key={key} value={key}>{tpl.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Status</label>
            <button
              onClick={() => setIsActive(!isActive)}
              style={{
                padding: '8px 20px',
                background: isActive ? '#22c55e' : '#ef4444',
                color: '#fff', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              }}
            >
              {isActive ? '🟢 Active' : '🔴 Inactive'}
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={selectAll} style={{ padding: '6px 12px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✓ সব Select</button>
            <button onClick={clearAll} style={{ padding: '6px 12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✗ সব Clear</button>
            <button onClick={resetToRole} style={{ padding: '6px 12px', background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={13} /> Reset to Role
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '6px', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Permission সার্চ করুন (যেমন: booking, edit, pdf)..."
              value={searchPerm}
              onChange={(e) => setSearchPerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', padding: '8px 10px', fontSize: '13px', width: '100%' }}
            />
          </div>
        </div>

        {/* Permission Matrix */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {filteredRegistry.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
              কোনো permission পাওয়া যায়নি
            </div>
          ) : (
            filteredRegistry.map((mod) => {
              const allSelected = mod.permissions.every((p) => permissions[p.key]);
              const noneSelected = mod.permissions.every((p) => !permissions[p.key]);
              return (
                <div key={mod.module} style={{ marginBottom: '18px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                      {mod.icon} {mod.module}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => toggleModule(mod, true)}
                        style={{ padding: '4px 12px', background: allSelected ? '#22c55e' : '#f1f5f9', color: allSelected ? '#fff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => toggleModule(mod, false)}
                        style={{ padding: '4px 12px', background: noneSelected ? '#ef4444' : '#f1f5f9', color: noneSelected ? '#fff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                    {mod.permissions.map((p) => {
                      const checked = !!permissions[p.key];
                      return (
                        <label
                          key={p.key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 10px',
                            background: checked ? '#f0fdf4' : '#fff',
                            border: `1px solid ${checked ? '#86efac' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(p.key)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#16a34a' }}
                          />
                          <span style={{ fontSize: '13px', color: checked ? '#166534' : '#334155', fontWeight: checked ? '600' : '400' }}>
                            {p.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '13px', color: message.includes('❌') ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
            {message}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' }}
            >
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!isAdmin && !can('user.permission_manage'))}
              style={{
                padding: '10px 24px',
                background: saving ? '#94a3b8' : '#1c5fa8',
                color: '#fff',
                border: 'none', borderRadius: '8px',
                cursor: saving || (!isAdmin && !can('user.permission_manage')) ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: (!isAdmin && !can('user.permission_manage')) ? 0.5 : 1,
              }}
            >
              <Save size={16} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}