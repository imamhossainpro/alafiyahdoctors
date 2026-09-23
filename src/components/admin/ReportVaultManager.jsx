// src/components/admin/ReportVaultManager.jsx
// ==================================================
// 📄 Report Vault Manager — Admin-side Reports
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  db, doc, setDoc, collection, getDocs, deleteDoc, query, where,
} from '../../firebase';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { logActivity, LOG_MODULES, LOG_ACTIONS } from '../../services/activityLogService';
import {
  Upload, Search, Trash2, FileText, Download, Eye, X, Plus,
  Loader2, AlertCircle, CheckCircle, Filter,
} from 'lucide-react';

// ==================================================
// ✅ Constants
// ==================================================
const REPORT_TYPES = [
  { key: 'lab', label: 'Lab', color: '#0d9488' },
  { key: 'imaging', label: 'Imaging', color: '#3b82f6' },
  { key: 'other', label: 'Other', color: '#64748b' },
];

const STATUS_OPTIONS = [
  { key: 'ready', label: 'Ready', color: '#22c55e' },
  { key: 'processing', label: 'Processing', color: '#f59e0b' },
  { key: 'failed', label: 'Failed', color: '#dc2626' },
];

const REPORT_VAULT_READY = false; // ← Flip to true when Firebase collection exists

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function ReportVaultManager({ user }) {
  const { currentHospital } = useHospital();
  const { user: authUser } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const currentUser = user || authUser;

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ==================================================
  // ✅ Load reports + patients
  // ==================================================
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!hospitalId) return;
      setLoading(true);

      try {
        // Load patients (for assignment)
        const patSnap = await getDocs(
          collection(db, 'hospitals', hospitalId, 'patients')
        );
        const patientList = patSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        if (mounted) setPatients(patientList);

        // Load reports (if collection exists)
        if (REPORT_VAULT_READY) {
          const repSnap = await getDocs(
            collection(db, 'hospitals', hospitalId, 'reports')
          );
          const reportList = repSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          if (mounted) setReports(reportList);
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // ==================================================
  // ✅ Filtered reports
  // ==================================================
  const filteredReports = useMemo(() => {
    let list = reports;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          (r.reportName || '').toLowerCase().includes(term) ||
          (r.patientName || '').toLowerCase().includes(term) ||
          (r.mobile || '').includes(term)
      );
    }

    if (filterType !== 'all') {
      list = list.filter((r) => r.reportType === filterType);
    }

    return list.sort((a, b) => {
      const dateA = a.reportDate || '';
      const dateB = b.reportDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [reports, searchTerm, filterType]);

  // ==================================================
  // ✅ Upload handler
  // ==================================================
  const handleUpload = async (data) => {
    if (!REPORT_VAULT_READY) {
      setMessage({
        type: 'error',
        text: 'Firebase collection এখনো তৈরি হয়নি। প্রথমে Firebase-এ "reports" collection তৈরি করুন।',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    setActionLoading(true);
    try {
      const reportId = `report_${Date.now()}`;
      const reportRef = doc(db, 'hospitals', hospitalId, 'reports', reportId);

      await setDoc(reportRef, {
        ...data,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.uid || 'unknown',
        uploadedByName: currentUser?.name || 'Admin',
      });

      // Log
      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.BOOKING,
          action: LOG_ACTIONS.CREATE,
          recordId: reportId,
          description: `Report uploaded: ${data.reportName} for ${data.patientName}`,
          newValue: data,
          user: currentUser,
        });
      } catch (e) {
        console.warn('Log error:', e);
      }

      // Refresh
      const repSnap = await getDocs(
        collection(db, 'hospitals', hospitalId, 'reports')
      );
      setReports(repSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setShowUploadModal(false);
      setMessage({ type: 'success', text: '✅ রিপোর্ট যোগ করা হয়েছে' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // ==================================================
  // ✅ Delete handler
  // ==================================================
  const handleDelete = async (report) => {
    if (!window.confirm(`"${report.reportName}" ডিলিট করতে চান?`)) return;

    setActionLoading(true);
    try {
      await deleteDoc(
        doc(db, 'hospitals', hospitalId, 'reports', report.id)
      );

      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.BOOKING,
          action: LOG_ACTIONS.DELETE,
          recordId: report.id,
          description: `Report deleted: ${report.reportName}`,
          oldValue: report,
          user: currentUser,
        });
      } catch (e) {
        console.warn('Log error:', e);
      }

      setReports((prev) => prev.filter((r) => r.id !== report.id));
      setMessage({ type: 'success', text: '✅ রিপোর্ট ডিলিট হয়েছে' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>📄 Report Vault Manager</h3>
          <p style={styles.subtitle}>
            রোগীদের রিপোর্ট আপলোড, ভিউ ও ম্যানেজ করুন
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          disabled={actionLoading}
          style={styles.btnPrimary}
        >
          <Plus size={16} /> নতুন রিপোর্ট
        </button>
      </div>

      {/* Status banner — collection not ready */}
      {!REPORT_VAULT_READY && (
        <div style={styles.infoBanner}>
          <AlertCircle size={18} />
          <div>
            <strong>ℹ️ Firebase Collection এখনো তৈরি হয়নি</strong>
            <p style={styles.infoText}>
              Patient App-এ Report Vault UI প্রস্তুত, কিন্তু Firebase-এ
              "reports" collection নেই। Firebase Console → Firestore →
              "hospitals/alafiyah_main/reports" collection তৈরি করুন।
            </p>
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div
          style={{
            ...styles.message,
            background:
              message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color:
              message.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="রিপোর্ট বা রোগী খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterChips}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              ...styles.filterChip,
              ...(filterType === 'all' ? styles.filterChipActive : {}),
            }}
          >
            <Filter size={13} /> সব
          </button>
          {REPORT_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setFilterType(type.key)}
              style={{
                ...styles.filterChip,
                ...(filterType === type.key ? styles.filterChipActive : {}),
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.centerBox}>
          <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p>লোড হচ্ছে...</p>
        </div>
      ) : !REPORT_VAULT_READY || filteredReports.length === 0 ? (
        <div style={styles.emptyBox}>
          <FileText size={48} color="#94a3b8" />
          <h4 style={styles.emptyTitle}>
            {!REPORT_VAULT_READY
              ? 'Report Vault Collection তৈরি করুন'
              : 'কোনো রিপোর্ট নেই'}
          </h4>
          <p style={styles.emptyText}>
            {!REPORT_VAULT_READY
              ? 'Firebase Console → Firestore → hospitals/alafiyah_main/reports collection তৈরি করুন'
              : 'নতুন রিপোর্ট যোগ করতে উপরের "নতুন রিপোর্ট" বাটনে ক্লিক করুন'}
          </p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={styles.th}>রিপোর্ট নাম</th>
                <th style={styles.th}>রোগী</th>
                <th style={styles.th}>মোবাইল</th>
                <th style={styles.th}>ধরন</th>
                <th style={styles.th}>তারিখ</th>
                <th style={styles.th}>স্ট্যাটাস</th>
                <th style={styles.th}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const typeInfo = REPORT_TYPES.find(
                  (t) => t.key === report.reportType
                );
                const statusInfo = STATUS_OPTIONS.find(
                  (s) => s.key === report.status
                );

                return (
                  <tr key={report.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.reportNameCell}>
                        <FileText size={16} color="#1c5fa8" />
                        <span>{report.reportName || '—'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{report.patientName || '—'}</td>
                    <td style={styles.td}>{report.mobile || '—'}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: `${typeInfo?.color || '#64748b'}15`,
                          color: typeInfo?.color || '#64748b',
                        }}
                      >
                        {typeInfo?.label || 'Other'}
                      </span>
                    </td>
                    <td style={styles.td}>{report.reportDate || '—'}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: `${statusInfo?.color || '#64748b'}15`,
                          color: statusInfo?.color || '#64748b',
                        }}
                      >
                        {statusInfo?.label || 'Ready'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        {report.fileUrl && (
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.iconBtn}
                            title="View"
                          >
                            <Eye size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(report)}
                          style={{ ...styles.iconBtn, color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          patients={patients}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          loading={actionLoading}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ==================================================
// ✅ Upload Modal
// ==================================================
function UploadModal({ patients, onClose, onUpload, loading }) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    mobile: '',
    reportName: '',
    reportType: 'lab',
    reportDate: new Date().toISOString().split('T')[0],
    status: 'ready',
    fileUrl: '',
    notes: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.mobile || '').includes(term)
    );
  }, [patients, searchTerm]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePatientSelect = (patient) => {
    setFormData((prev) => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name || '',
      mobile: patient.mobile || '',
    }));
    setSearchTerm('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reportName.trim()) {
      alert('রিপোর্ট নাম লিখুন');
      return;
    }
    if (!formData.patientId) {
      alert('রোগী নির্বাচন করুন');
      return;
    }
    if (!formData.fileUrl.trim()) {
      alert('File URL লিখুন');
      return;
    }
    onUpload(formData);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={styles.modalBox}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>📄 নতুন রিপোর্ট</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {/* Patient search */}
          <div style={styles.formGroup}>
            <label style={styles.label}>রোগী নির্বাচন *</label>
            {formData.patientId ? (
              <div style={styles.selectedPatient}>
                <div>
                  <strong>{formData.patientName}</strong>
                  <p style={styles.selectedPatientMeta}>
                    {formData.mobile}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      patientId: '',
                      patientName: '',
                      mobile: '',
                    }));
                  }}
                  style={styles.iconBtn}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div style={styles.searchBox}>
                  <Search size={14} color="#64748b" />
                  <input
                    type="text"
                    placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                {searchTerm && (
                  <div style={styles.patientDropdown}>
                    {filteredPatients.length === 0 ? (
                      <div style={styles.dropdownEmpty}>
                        কোনো রোগী পাওয়া যায়নি
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handlePatientSelect(p)}
                          style={styles.patientOption}
                        >
                          <div>
                            <strong>{p.name}</strong>
                            <span style={styles.patientMobile}>
                              {p.mobile}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Report name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>রিপোর্টের নাম *</label>
            <input
              type="text"
              value={formData.reportName}
              onChange={(e) => handleChange('reportName', e.target.value)}
              placeholder="যেমন: CBC Test, X-Ray Chest"
              style={styles.input}
              required
            />
          </div>

          {/* Type + Date */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>ধরন *</label>
              <select
                value={formData.reportType}
                onChange={(e) => handleChange('reportType', e.target.value)}
                style={styles.input}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>তারিখ *</label>
              <input
                type="date"
                value={formData.reportDate}
                onChange={(e) => handleChange('reportDate', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* File URL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>File URL * (Firebase Storage)</label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => handleChange('fileUrl', e.target.value)}
              placeholder="https://firebasestorage.googleapis.com/..."
              style={styles.input}
              required
            />
            <small style={styles.hint}>
              Firebase Storage-এ file upload করে download URL paste করুন
            </small>
          </div>

          {/* Notes */}
          <div style={styles.formGroup}>
            <label style={styles.label}>নোট (ঐচ্ছিক)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="অতিরিক্ত তথ্য..."
              style={{ ...styles.input, minHeight: '80px' }}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div style={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              style={styles.btnSecondary}
              disabled={loading}
            >
              বাতিল
            </button>
            <button
              type="submit"
              style={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> সেভ হচ্ছে...
                </>
              ) : (
                <>
                  <Upload size={16} /> সেভ করুন
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = {
  container: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { margin: 0, color: '#1e293b' },
  subtitle: { margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' },

  infoBanner: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '14px 16px',
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '10px',
    marginBottom: '16px',
    color: '#1e40af',
  },
  infoText: {
    margin: '4px 0 0 0',
    fontSize: '12.5px',
    lineHeight: '18px',
  },

  message: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13.5px',
    fontWeight: '600',
  },

  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f1f5f9',
    borderRadius: '8px',
    padding: '8px 12px',
    minWidth: '260px',
    flex: 1,
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
  },
  filterChips: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#475569',
  },
  filterChipActive: {
    background: '#1c5fa8',
    color: '#fff',
    borderColor: '#1c5fa8',
  },

  centerBox: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '2px dashed #cbd5e1',
  },
  emptyTitle: {
    color: '#1e293b',
    marginTop: '12px',
    marginBottom: '6px',
    fontSize: '16px',
  },
  emptyText: {
    fontSize: '13px',
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: '20px',
  },

  tableWrap: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeadRow: { background: '#f1f5f9' },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', fontSize: '13.5px', color: '#1e293b' },
  reportNameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11.5px',
    fontWeight: '600',
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
  },
  iconBtn: {
    padding: '6px 8px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#475569',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: '#1c5fa8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(28, 95, 168, 0.3)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalBox: {
    background: '#fff',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  modalHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
  },
  modalTitle: { margin: 0, fontSize: '17px', color: '#1e293b' },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    background: '#f8fafc',
  },
  formGroup: { marginBottom: '16px', flex: 1 },
  formRow: { display: 'flex', gap: '12px' },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    fontSize: '11.5px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  selectedPatient: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '8px',
  },
  selectedPatientMeta: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#166534',
  },
  patientDropdown: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginTop: '6px',
  },
  patientOption: {
    padding: '10px 14px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientMobile: {
    marginLeft: '12px',
    fontSize: '12px',
    color: '#64748b',
  },
  dropdownEmpty: {
    padding: '20px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
  },
};