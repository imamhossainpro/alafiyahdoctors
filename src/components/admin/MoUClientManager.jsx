// src/components/admin/MoUClientManager.jsx
// ==================================================
// 📄 MoU Client Manager — Main list + CRUD orchestration
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Archive,
  RotateCcw,
  FileText,
  Building2,
  Phone,
  Mail,
  User,
  Percent,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArchiveRestore,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import {
  subscribeToMouClients,
  createMouClient,
  updateMouClient,
  archiveMouClient,
  restoreMouClient,
  permanentlyDeleteMouClient,
  duplicateMouClient,
} from '../../services/mouService';
import {
  logActivity,
  LOG_MODULES,
  LOG_ACTIONS,
} from '../../services/activityLogService';
import {
  CLIENT_TYPES,
  CLIENT_STATUSES,
  getClientTypeInfo,
  getStatusInfo,
  formatDateLong,
} from '../../utils/mouDefaults';
import MoUForm from './MoUForm';
import MoUPreviewModal from './MoUPreviewModal';

// ==================================================
// ✅ CSS
// ==================================================
const ManagerCSS = `
.moum-container {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
}

/* Header */
.moum-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap;
  margin-bottom: 20px;
}
.moum-header-left { min-width: 0; flex: 1; }
.moum-title {
  margin: 0;
  font-size: 20px; font-weight: 800; color: #1e293b;
  display: flex; align-items: center; gap: 8px;
}
.moum-sub {
  margin: 4px 0 0 0;
  font-size: 13px; color: #64748b;
}
.moum-header-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}

/* Buttons */
.moum-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}
.moum-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.moum-btn-primary {
  background: #1c5fa8; color: #fff;
  box-shadow: 0 3px 10px rgba(28, 95, 168, 0.3);
}
.moum-btn-primary:hover:not(:disabled) {
  background: #154a82; transform: translateY(-1px);
}
.moum-btn-secondary {
  background: #f1f5f9; color: #334155;
  border: 1px solid #cbd5e1;
}
.moum-btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}
.moum-btn-icon {
  padding: 7px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.moum-btn-icon:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.moum-btn-icon.danger:hover:not(:disabled) {
  background: #fee2e2; color: #dc2626; border-color: #fecaca;
}
.moum-btn-icon.success:hover:not(:disabled) {
  background: #dcfce7; color: #16a34a; border-color: #bbf7d0;
}
.moum-btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

/* Filter bar */
.moum-filters {
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.moum-search {
  display: flex; align-items: center; gap: 6px;
  background: #fff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 12px;
  flex: 1;
  min-width: 200px;
}
.moum-search input {
  border: none; outline: none;
  background: transparent;
  padding: 4px 0;
  font-size: 13.5px;
  width: 100%;
  font-family: inherit;
  color: #1e293b;
}
.moum-select {
  padding: 8px 12px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  font-family: inherit;
  color: #1e293b;
  cursor: pointer;
}
.moum-count-badge {
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 700;
  color: #1c5fa8;
  background: #dbeafe;
  padding: 5px 12px;
  border-radius: 20px;
}

/* List */
.moum-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
@media (max-width: 500px) {
  .moum-list { grid-template-columns: 1fr; }
}

/* Card */
.moum-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s;
  position: relative;
}
.moum-card:hover {
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}
.moum-card.archived {
  opacity: 0.68;
  background: #f9fafb;
  border-style: dashed;
}

.moum-card-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px;
}
.moum-card-type {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.moum-card-status {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.moum-card-name {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.4;
  word-break: break-word;
}

.moum-card-info {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12.5px;
  color: #475569;
}
.moum-card-info-row {
  display: flex; align-items: center; gap: 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.moum-card-info-row svg { flex-shrink: 0; color: #94a3b8; }

.moum-card-discounts {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 8px 0 4px 0;
  border-top: 1px dashed #e2e8f0;
  margin-top: 4px;
}
.moum-chip {
  font-size: 11.5px;
  font-weight: 700;
  background: #f0fdf4;
  color: #166534;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #bbf7d0;
}

.moum-card-actions {
  display: flex; gap: 6px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
}

/* Empty / loading */
.moum-empty {
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  grid-column: 1 / -1;
}
.moum-empty-icon { font-size: 48px; margin-bottom: 12px; }
.moum-empty-title {
  font-size: 16px; font-weight: 700; color: #475569;
  margin-bottom: 6px;
}
.moum-empty-sub { font-size: 13px; color: #94a3b8; }

.moum-loading {
  padding: 60px 20px;
  text-align: center;
  color: #64748b;
}
.moum-loading-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Delete confirm */
.moum-confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 10001;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.moum-confirm {
  background: #fff;
  border-radius: 14px;
  max-width: 440px;
  width: 100%;
  padding: 24px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
}
.moum-confirm h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1e293b;
  display: flex; align-items: center; gap: 8px;
}
.moum-confirm p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}
.moum-confirm-actions {
  display: flex; gap: 10px; justify-content: flex-end;
}
.moum-btn-danger {
  background: #dc2626; color: #fff;
}
.moum-btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

/* Toast */
.moum-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  z-index: 10002;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  display: flex; align-items: center; gap: 8px;
  animation: moum-slide-up 0.3s ease;
}
.moum-toast.success { background: #16a34a; }
.moum-toast.error { background: #dc2626; }

@keyframes moum-slide-up {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
`;

// ==================================================
// ✅ Helper: relative time for updatedAt
// ==================================================
const formatTs = (ts) => {
  if (!ts) return '';
  try {
    if (ts?.toDate) return ts.toDate().toLocaleDateString('bn-BD');
    if (typeof ts === 'string') return new Date(ts).toLocaleDateString('bn-BD');
    return '';
  } catch {
    return '';
  }
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function MoUClientManager({ user: propUser }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const { can } = usePermission();

  // ---------- Permissions ----------
  const canView = can('mou.view') || user?.role === 'admin';
  const canCreate = can('mou.create') || user?.role === 'admin';
  const canEdit = can('mou.edit') || user?.role === 'admin';
  const canDelete = can('mou.delete') || user?.role === 'admin';
  const canPrint = can('mou.print') || user?.role === 'admin';
  const canExportPDF = can('mou.export_pdf') || user?.role === 'admin';

  // ---------- State ----------
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [formModal, setFormModal] = useState(null);   // { mode: 'create' | 'edit', client? }
  const [previewModal, setPreviewModal] = useState(null); // client object
  const [confirmModal, setConfirmModal] = useState(null); // { type, client }
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // ==================================================
  // ✅ Toast helper
  // ==================================================
  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2800);
  };

  // ==================================================
  // ✅ Realtime subscribe
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    const unsub = subscribeToMouClients(
      hospitalId,
      (list) => {
        setClients(list || []);
        setLoading(false);
      },
      (err) => {
        console.error('❌ MoU subscription error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [hospitalId]);

  // ==================================================
  // ✅ Filtered list
  // ==================================================
  const filtered = useMemo(() => {
    let list = clients;

    // archived filter
    list = list.filter((c) =>
      showArchived ? c.isArchived === true : c.isArchived !== true
    );

    // type filter
    if (filterType !== 'all') {
      list = list.filter((c) => c.clientType === filterType);
    }

    // status filter
    if (filterStatus !== 'all') {
      list = list.filter((c) => c.status === filterStatus);
    }

    // search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          (c.org2_name || '').toLowerCase().includes(term) ||
          (c.org2_short_name || '').toLowerCase().includes(term) ||
          (c.org2_contact_name || '').toLowerCase().includes(term) ||
          (c.org2_contact_phone || '').toLowerCase().includes(term) ||
          (c.org2_contact_email || '').toLowerCase().includes(term) ||
          (c.org2_address || '').toLowerCase().includes(term)
        );
      });
    }

    return list;
  }, [clients, searchTerm, filterType, filterStatus, showArchived]);

  // ==================================================
  // ✅ Stats
  // ==================================================
  const stats = useMemo(() => {
    const active = clients.filter(
      (c) => c.isArchived !== true && c.status === 'active'
    ).length;
    const draft = clients.filter(
      (c) => c.isArchived !== true && c.status === 'draft'
    ).length;
    const archived = clients.filter((c) => c.isArchived === true).length;
    return { active, draft, archived, total: clients.length };
  }, [clients]);

  // ==================================================
  // ✅ Handlers
  // ==================================================
  const handleOpenCreate = () => {
    if (!canCreate) {
      showToast('error', '❌ আপনার নতুন MoU তৈরি করার permission নেই।');
      return;
    }
    setFormModal({ mode: 'create', client: null });
  };

  const handleOpenEdit = (client) => {
    if (!canEdit) {
      showToast('error', '❌ আপনার এডিট করার permission নেই।');
      return;
    }
    setFormModal({ mode: 'edit', client });
  };

  const handleOpenPreview = (client) => {
    setPreviewModal(client);
  };

  const handleSaveForm = async (formData) => {
    setSaving(true);
    try {
      if (formModal.mode === 'create') {
        const created = await createMouClient(hospitalId, formData, user);

        // ✅ activity log
        try {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.BOOKING, // reuse module name string
            action: LOG_ACTIONS.CREATE,
            recordId: created.id,
            description: `নতুন MoU ক্লায়েন্ট তৈরি: ${formData.org2_name}`,
            oldValue: null,
            newValue: {
              name: formData.org2_name,
              type: formData.clientType,
              status: formData.status,
            },
            user,
          });
        } catch (logErr) {
          console.warn('Log failed (non-critical):', logErr);
        }

        showToast('success', '✅ নতুন ক্লায়েন্ট সফলভাবে তৈরি হয়েছে!');
      } else {
        const id = formModal.client.id;
        await updateMouClient(hospitalId, id, formData, user);

        try {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.BOOKING,
            action: LOG_ACTIONS.UPDATE,
            recordId: id,
            description: `MoU ক্লায়েন্ট আপডেট: ${formData.org2_name}`,
            oldValue: { name: formModal.client.org2_name, status: formModal.client.status },
            newValue: { name: formData.org2_name, status: formData.status },
            user,
          });
        } catch (logErr) {
          console.warn('Log failed (non-critical):', logErr);
        }

        showToast('success', '✅ আপডেট সফল হয়েছে!');
      }

      setFormModal(null);
    } catch (err) {
      console.error('Save MoU error:', err);
      showToast('error', '❌ সংরক্ষণ ব্যর্থ: ' + (err.message || 'unknown'));
      throw err; // keep form open
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (client) => {
    if (!canCreate) {
      showToast('error', '❌ আপনার permission নেই।');
      return;
    }
    try {
      await duplicateMouClient(hospitalId, client.id, user);
      showToast('success', '📋 ক্লায়েন্ট ডুপ্লিকেট হয়েছে (Draft হিসেবে)');
    } catch (err) {
      console.error('Duplicate error:', err);
      showToast('error', 'ডুপ্লিকেট করতে সমস্যা হয়েছে।');
    }
  };

  const handleArchiveConfirm = (client) => {
    if (!canEdit) {
      showToast('error', '❌ আপনার permission নেই।');
      return;
    }
    setConfirmModal({ type: 'archive', client });
  };

  const handleRestoreConfirm = (client) => {
    if (!canEdit) {
      showToast('error', '❌ আপনার permission নেই।');
      return;
    }
    setConfirmModal({ type: 'restore', client });
  };

  const handleDeleteConfirm = (client) => {
    if (!canDelete) {
      showToast('error', '❌ আপনার ডিলিট করার permission নেই।');
      return;
    }
    setConfirmModal({ type: 'delete', client });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, client } = confirmModal;
    setSaving(true);

    try {
      if (type === 'archive') {
        await archiveMouClient(hospitalId, client.id, user);
        showToast('success', '📦 আর্কাইভ করা হয়েছে');
      } else if (type === 'restore') {
        await restoreMouClient(hospitalId, client.id);
        showToast('success', '♻️ রিস্টোর করা হয়েছে');
      } else if (type === 'delete') {
        await permanentlyDeleteMouClient(hospitalId, client.id);
        showToast('success', '🗑️ স্থায়ীভাবে মুছে ফেলা হয়েছে');
      }
      setConfirmModal(null);
    } catch (err) {
      console.error('Confirm action error:', err);
      showToast('error', 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
  };

  // ==================================================
  // ✅ Access denied
  // ==================================================
  if (!canView) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '60px 20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Denied</h3>
        <p style={{ color: '#64748b' }}>
          আপনার MoU ক্লায়েন্ট দেখার permission নেই।
        </p>
      </div>
    );
  }

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <>
      <style>{ManagerCSS}</style>

      <div className="moum-container">
        {/* ============ Header ============ */}
        <div className="moum-header">
          <div className="moum-header-left">
            <h3 className="moum-title">
              <FileText size={22} color="#1c5fa8" />
              MoU ক্লায়েন্ট ম্যানেজার
            </h3>
            <p className="moum-sub">
              মোট <b>{stats.total}</b> ক্লায়েন্ট · সক্রিয় <b>{stats.active}</b> ·
              ড্রাফট <b>{stats.draft}</b> · আর্কাইভ <b>{stats.archived}</b>
            </p>
          </div>

          <div className="moum-header-actions">
            <button
              className="moum-btn moum-btn-secondary"
              onClick={() => setShowArchived((v) => !v)}
              title={showArchived ? 'Active দেখুন' : 'Archived দেখুন'}
            >
              {showArchived ? (
                <>
                  <RotateCcw size={14} /> Active দেখুন
                </>
              ) : (
                <>
                  <Archive size={14} /> Archived ({stats.archived})
                </>
              )}
            </button>

            {!showArchived && canCreate && (
              <button
                className="moum-btn moum-btn-primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} /> নতুন MoU ক্লায়েন্ট
              </button>
            )}
          </div>
        </div>

        {/* ============ Filters ============ */}
        <div className="moum-filters">
          <div className="moum-search">
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="নাম, ফোন, ইমেইল, ঠিকানা দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="moum-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">সব ধরন</option>
            {CLIENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            className="moum-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">সব স্ট্যাটাস</option>
            {CLIENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
            <button
              className="moum-btn moum-btn-secondary"
              onClick={resetFilters}
              style={{ padding: '7px 12px', fontSize: '12.5px' }}
            >
              <X size={13} /> Reset
            </button>
          )}

          <span className="moum-count-badge">
            {filtered.length} / {clients.length}
          </span>
        </div>

        {/* ============ List ============ */}
        {loading ? (
          <div className="moum-loading">
            <Loader2 size={28} className="moum-loading-icon" color="#1c5fa8" />
            <p style={{ marginTop: '10px', fontSize: '13.5px' }}>লোড হচ্ছে...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="moum-empty">
            <div className="moum-empty-icon">
              {showArchived ? '📦' : searchTerm ? '🔍' : '📄'}
            </div>
            <div className="moum-empty-title">
              {showArchived
                ? 'কোনো আর্কাইভ করা ক্লায়েন্ট নেই'
                : searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'এই ফিল্টারে কোনো ক্লায়েন্ট পাওয়া যায়নি'
                : 'এখনো কোনো MoU ক্লায়েন্ট যোগ করা হয়নি'}
            </div>
            <div className="moum-empty-sub">
              {showArchived
                ? 'Active list-এ ফিরে যান।'
                : canCreate
                ? '"নতুন MoU ক্লায়েন্ট" বাটনে ক্লিক করে শুরু করুন।'
                : 'Admin-কে জানান।'}
            </div>
            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <button
                className="moum-btn moum-btn-secondary"
                onClick={resetFilters}
                style={{ marginTop: '16px' }}
              >
                <RotateCcw size={14} /> ফিল্টার রিসেট
              </button>
            )}
          </div>
        ) : (
          <div className="moum-list">
            {filtered.map((client) => (
              <MoUCard
                key={client.id}
                client={client}
                showArchived={showArchived}
                canEdit={canEdit}
                canDelete={canDelete}
                onPreview={() => handleOpenPreview(client)}
                onEdit={() => handleOpenEdit(client)}
                onDuplicate={() => handleDuplicate(client)}
                onArchive={() => handleArchiveConfirm(client)}
                onRestore={() => handleRestoreConfirm(client)}
                onDelete={() => handleDeleteConfirm(client)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============ Modals ============ */}
      {formModal && (
        <MoUForm
          initial={formModal.mode === 'edit' ? formModal.client : null}
          onSave={handleSaveForm}
          onClose={() => !saving && setFormModal(null)}
          saving={saving}
        />
      )}

      {previewModal && (
        <MoUPreviewModal
          client={previewModal}
          onClose={() => setPreviewModal(null)}
          canPrint={canPrint}
          canExportPDF={canExportPDF}
        />
      )}

      {confirmModal && (
        <div
          className="moum-confirm-overlay"
          onClick={() => !saving && setConfirmModal(null)}
        >
          <div
            className="moum-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {confirmModal.type === 'archive' && (
                <>
                  <Archive size={20} color="#d97706" />
                  আর্কাইভ করতে চান?
                </>
              )}
              {confirmModal.type === 'restore' && (
                <>
                  <ArchiveRestore size={20} color="#16a34a" />
                  রিস্টোর করতে চান?
                </>
              )}
              {confirmModal.type === 'delete' && (
                <>
                  <Trash2 size={20} color="#dc2626" />
                  স্থায়ীভাবে মুছতে চান?
                </>
              )}
            </h3>
            <p>
              <b>{confirmModal.client?.org2_name}</b>
              <br />
              {confirmModal.type === 'archive' &&
                'এই ক্লায়েন্ট আর্কাইভে চলে যাবে। পরে আবার restore করতে পারবেন।'}
              {confirmModal.type === 'restore' &&
                'এই ক্লায়েন্ট আবার Active লিস্টে ফিরে আসবে।'}
              {confirmModal.type === 'delete' &&
                '⚠️ সতর্কতা: এই কাজটি আর ফেরানো যাবে না। সব তথ্য চিরতরে মুছে যাবে।'}
            </p>
            <div className="moum-confirm-actions">
              <button
                className="moum-btn moum-btn-secondary"
                onClick={() => !saving && setConfirmModal(null)}
                disabled={saving}
              >
                বাতিল
              </button>
              <button
                className={`moum-btn ${
                  confirmModal.type === 'delete'
                    ? 'moum-btn-danger'
                    : 'moum-btn-primary'
                }`}
                onClick={handleConfirmAction}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="spin" /> অপেক্ষা...
                  </>
                ) : (
                  'নিশ্চিত করুন'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Toast ============ */}
      {toast && (
        <div className={`moum-toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.text}
        </div>
      )}
    </>
  );
}

// ==================================================
// ✅ MoUCard — single card
// ==================================================
function MoUCard({
  client,
  showArchived,
  canEdit,
  canDelete,
  onPreview,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}) {
  const typeInfo = getClientTypeInfo(client.clientType);
  const statusInfo = getStatusInfo(client.status);

  return (
    <div className={`moum-card ${showArchived ? 'archived' : ''}`}>
      {/* Top row: type + status */}
      <div className="moum-card-top">
        <span
          className="moum-card-type"
          style={{ background: typeInfo.bg, color: typeInfo.color }}
        >
          {typeInfo.label}
        </span>
        <span
          className="moum-card-status"
          style={{ background: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Name */}
      <div className="moum-card-name">
        {client.org2_name || 'Untitled Client'}
      </div>

      {/* Info */}
      <div className="moum-card-info">
        {client.org2_contact_name && (
          <div className="moum-card-info-row">
            <User size={13} />
            <span>{client.org2_contact_name}</span>
            {client.org2_contact_designation && (
              <span style={{ color: '#94a3b8' }}>
                · {client.org2_contact_designation}
              </span>
            )}
          </div>
        )}
        {client.org2_contact_phone && (
          <div className="moum-card-info-row">
            <Phone size={13} />
            <span>{client.org2_contact_phone}</span>
          </div>
        )}
        {client.org2_contact_email && (
          <div className="moum-card-info-row">
            <Mail size={13} />
            <span>{client.org2_contact_email}</span>
          </div>
        )}
        {client.agreement_date && (
          <div className="moum-card-info-row">
            <Building2 size={13} />
            <span style={{ color: '#94a3b8' }}>
              MoU: {formatDateLong(client.agreement_date)}
            </span>
          </div>
        )}
      </div>

      {/* Discount chips */}
      <div className="moum-card-discounts">
        {client.discount_pathology && (
          <span className="moum-chip">
            <Percent size={10} style={{ display: 'inline', marginRight: 2 }} />
            Pathology {client.discount_pathology}%
          </span>
        )}
        {client.discount_radiology && (
          <span className="moum-chip">
            Radiology {client.discount_radiology}%
          </span>
        )}
        {client.discount_bed && (
          <span className="moum-chip">Bed {client.discount_bed}%</span>
        )}
      </div>

      {/* Actions */}
      <div className="moum-card-actions">
        <button
          className="moum-btn-icon"
          onClick={onPreview}
          title="প্রিভিউ দেখুন"
        >
          <Eye size={14} />
        </button>

        {!showArchived && canEdit && (
          <button
            className="moum-btn-icon"
            onClick={onEdit}
            title="এডিট করুন"
          >
            <Edit2 size={14} />
          </button>
        )}

        {!showArchived && (
          <button
            className="moum-btn-icon"
            onClick={onDuplicate}
            title="ডুপ্লিকেট করুন"
          >
            <Copy size={14} />
          </button>
        )}

        {!showArchived && canEdit && (
          <button
            className="moum-btn-icon"
            onClick={onArchive}
            title="আর্কাইভ করুন"
          >
            <Archive size={14} />
          </button>
        )}

        {showArchived && canEdit && (
          <button
            className="moum-btn-icon success"
            onClick={onRestore}
            title="রিস্টোর করুন"
          >
            <ArchiveRestore size={14} />
          </button>
        )}

        {showArchived && canDelete && (
          <button
            className="moum-btn-icon danger"
            onClick={onDelete}
            title="স্থায়ীভাবে মুছুন"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}