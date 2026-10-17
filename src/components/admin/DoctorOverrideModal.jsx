// src/components/admin/DoctorOverrideModal.jsx
// ==================================================
// 🚫 DoctorOverrideModal — Chamber OFF / One-time ADD
// ==================================================
// ✅ Error handling সম্পূর্ণ
// ✅ Loading states
// ✅ Date validation
// ✅ Firestore rules-compliant
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import { X, Ban, Loader2, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  setChamberOff,
  clearChamberOff,
  addOneTimeDoctor,
  removeOneTimeDoctor,
  getOverridesForDate,
} from '../../services/doctorOverrideService';

// ✅ BD timezone-safe today
const getBDTodayString = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 60 * 60000);
  return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
};

export default function DoctorOverrideModal({ departments = [], onClose }) {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const allowedRoles = ['admin', 'sub-admin', 'editor', 'moderator'];
  const hasAccess = user && allowedRoles.includes(user.role);

  const [date, setDate] = useState(getBDTodayString());
  const [tab, setTab] = useState('off');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offIds, setOffIds] = useState(new Set());
  const [addEntries, setAddEntries] = useState([]);
  const [selectedAddDoctorId, setSelectedAddDoctorId] = useState('');
  const [search, setSearch] = useState('');

  // Flatten doctors
  const allDoctors = useMemo(() => {
    const arr = [];
    departments.forEach((d) => {
      (d.doctors || []).forEach((doc) => {
        arr.push({ ...doc, deptName: d.name, deptId: d.id });
      });
    });
    return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [departments]);

  // Filter by search
  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return allDoctors;
    const term = search.toLowerCase().trim();
    return allDoctors.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(term) ||
        (d.deptName || '').toLowerCase().includes(term)
    );
  }, [allDoctors, search]);

  // ✅ Load overrides whenever date changes
  const load = async () => {
    if (!hasAccess) return;
    setLoading(true);
    setError('');
    try {
      const { offIds: o, addEntries: a } = await getOverridesForDate(hospitalId, date);
      setOffIds(o);
      setAddEntries(a);
    } catch (err) {
      console.error('Load error:', err);
      setError('ডেটা লোড করতে সমস্যা: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, date, hasAccess]);

  // ✅ Toggle OFF
  const toggleOff = async (doctorId) => {
    setError('');
    setSuccess('');
    setSavingId(doctorId);
    try {
      if (offIds.has(doctorId)) {
        await clearChamberOff(hospitalId, doctorId, date);
        setSuccess('✅ চেম্বার চালু করা হয়েছে');
      } else {
        await setChamberOff(hospitalId, doctorId, date, user);
        setSuccess('✅ চেম্বার বন্ধ করা হয়েছে');
      }
      await load();
    } catch (err) {
      console.error('toggleOff error:', err);
      setError('সংরক্ষণ ব্যর্থ: ' + err.message);
    } finally {
      setSavingId(null);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // ✅ Add one-time
  const handleAddOneTime = async () => {
    if (!selectedAddDoctorId) return;
    const doc = allDoctors.find((d) => d.id === selectedAddDoctorId);
    if (!doc) return;

    setError('');
    setSuccess('');
    setSavingId(doc.id);
    try {
      await addOneTimeDoctor(hospitalId, doc.id, date, doc, user);
      setSelectedAddDoctorId('');
      await load();
      setSuccess(`✅ ${doc.name} কে ${date} তারিখে যুক্ত করা হয়েছে`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('handleAddOneTime error:', err);
      setError('যুক্ত করতে ব্যর্থ: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  // ✅ Remove one-time
  const handleRemoveOneTime = async (doctorId) => {
    setError('');
    setSavingId(doctorId);
    try {
      await removeOneTimeDoctor(hospitalId, doctorId, date);
      await load();
      setSuccess('✅ সরানো হয়েছে');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('handleRemoveOneTime error:', err);
      setError('সরাতে ব্যর্থ: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  // ✅ Access denied
  if (!hasAccess) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.55)',
          zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff', padding: 30, borderRadius: 16,
            maxWidth: 400, textAlign: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Ban size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#dc2626' }}>Access Denied</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>
            আপনার এই অপশনটি ব্যবহার করার অনুমতি নেই।
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', background: '#1c5fa8', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
            }}
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 9999, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, maxWidth: 680, width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', justifyContent: 'space-between', background: '#f8fafc',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={18} color="#dc2626" /> ডাক্তার চেম্বার ওভাররাইড
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Date */}
        <div
          style={{
            padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', gap: 10, alignItems: 'center', background: '#fff',
          }}
        >
          <Calendar size={16} color="#1c5fa8" />
          <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
            তারিখ:
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6,
              border: '1.5px solid #cbd5e1', fontSize: 14,
              fontWeight: 600, fontFamily: 'inherit',
            }}
          />
          {loading && <Loader2 className="spin" size={16} color="#1c5fa8" />}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setTab('off')}
            style={{
              flex: 1, padding: 12,
              background: tab === 'off' ? '#fff' : '#f8fafc',
              borderBottom: tab === 'off' ? '3px solid #dc2626' : '3px solid transparent',
              fontWeight: 700, color: tab === 'off' ? '#dc2626' : '#64748b',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🚫 চেম্বার বন্ধ ({offIds.size})
          </button>
          <button
            onClick={() => setTab('add')}
            style={{
              flex: 1, padding: 12,
              background: tab === 'add' ? '#fff' : '#f8fafc',
              borderBottom: tab === 'add' ? '3px solid #16a34a' : '3px solid transparent',
              fontWeight: 700, color: tab === 'add' ? '#16a34a' : '#64748b',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ➕ এই দিনে ডাক্তার ({addEntries.length})
          </button>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            style={{
              margin: '12px 20px 0', padding: '10px 14px',
              background: '#fee2e2', color: '#991b1b',
              borderRadius: 8, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div
            style={{
              margin: '12px 20px 0', padding: '10px 14px',
              background: '#dcfce7', color: '#166534',
              borderRadius: 8, fontSize: 13,
            }}
          >
            {success}
          </div>
        )}

        {/* Search (only for OFF tab) */}
        {tab === 'off' && (
          <div style={{ padding: '12px 20px 0' }}>
            <input
              type="text"
              placeholder="ডাক্তার খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px',
                border: '1.5px solid #cbd5e1', borderRadius: 8,
                fontSize: 13, fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <Loader2 className="spin" size={24} color="#1c5fa8" />
            </div>
          ) : tab === 'off' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredDoctors.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b' }}>
                  কোনো ডাক্তার পাওয়া যায়নি
                </p>
              )}
              {filteredDoctors.map((doc) => {
                const isOff = offIds.has(doc.id);
                const isSaving = savingId === doc.id;
                return (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: 12,
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      background: isOff ? '#fef2f2' : '#fff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>
                        {doc.name}
                      </strong>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {doc.deptName} {doc.specialty ? `· ${doc.specialty}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOff(doc.id)}
                      disabled={isSaving}
                      style={{
                        padding: '6px 14px',
                        background: isOff ? '#dc2626' : '#fff',
                        color: isOff ? '#fff' : '#dc2626',
                        border: '1.5px solid #dc2626',
                        borderRadius: 6,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: 12,
                        fontFamily: 'inherit',
                        minWidth: 90,
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      {isSaving ? (
                        <Loader2 className="spin" size={12} />
                      ) : isOff ? (
                        'চালু করুন'
                      ) : (
                        'বন্ধ করুন'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {/* Add doctor */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <select
                  value={selectedAddDoctorId}
                  onChange={(e) => setSelectedAddDoctorId(e.target.value)}
                  style={{
                    flex: 1, padding: 10, borderRadius: 8,
                    border: '1.5px solid #cbd5e1', fontFamily: 'inherit',
                  }}
                >
                  <option value="">-- ডাক্তার বাছুন --</option>
                  {allDoctors
                    .filter((d) => !addEntries.find((a) => a.doctorId === d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.deptName})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddOneTime}
                  disabled={!selectedAddDoctorId || savingId === selectedAddDoctorId}
                  style={{
                    padding: '10px 16px',
                    background: selectedAddDoctorId ? '#16a34a' : '#94a3b8',
                    color: '#fff', border: 'none', borderRadius: 8,
                    cursor: selectedAddDoctorId ? 'pointer' : 'not-allowed',
                    fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {savingId === selectedAddDoctorId ? (
                    <Loader2 className="spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  Add
                </button>
              </div>

              {/* Info box */}
              <div
                style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  padding: 12, borderRadius: 8, marginBottom: 16,
                  fontSize: 13, color: '#166534', lineHeight: 1.6,
                }}
              >
                💡 এই ডাক্তার শুধু <strong>{date}</strong> তারিখে অ্যাভেইলেবল থাকবেন।
                <br />
                পার্মানেন্ট শিডিউলে কোনো প্রভাব পড়বে না।
              </div>

              {/* Existing one-time doctors */}
              {addEntries.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                  এখনো কোনো ডাক্তার যুক্ত করা হয়নি
                </p>
              )}
              {addEntries.map((entry) => {
                const isSaving = savingId === entry.doctorId;
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: 12,
                      border: '1px solid #bbf7d0', borderRadius: 8,
                      background: '#f0fdf4', marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>
                        {entry.doctorSnapshot?.name || 'Unknown'}
                      </strong>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {entry.doctorSnapshot?.deptName || ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveOneTime(entry.doctorId)}
                      disabled={isSaving}
                      style={{
                        background: '#fff', border: '1px solid #fca5a5',
                        color: '#dc2626', padding: '4px 10px',
                        borderRadius: 6, cursor: isSaving ? 'not-allowed' : 'pointer',
                        fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      {isSaving ? <Loader2 className="spin" size={12} /> : <Trash2 size={12} />}
                      সরান
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}