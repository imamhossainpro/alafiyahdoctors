// src/components/admin/ProfileEditRequests.jsx
import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToAllRequests,
  approveRequest,
  rejectRequest,
} from '../../services/doctorProfileRequestService';

const TABS = [
  { id: 'pending', label: '⏳ Pending' },
  { id: 'approved', label: '✅ Approved' },
  { id: 'rejected', label: '❌ Rejected' },
];

export default function ProfileEditRequests() {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAllRequests(
      hospitalId,
      (list) => { setRequests(list); setLoading(false); },
      (err) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [hospitalId]);

  const filtered = requests.filter((r) => r.status === activeTab);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const handleApprove = async (req) => {
    if (!window.confirm(`"${req.submittedByName}" এর প্রোফাইল পরিবর্তন এপ্রুভ করবেন?`)) return;
    setProcessing(req.id); setError('');
    try {
      await approveRequest(hospitalId, req.id, user);
    } catch (err) {
      setError(err.message || 'Approve failed');
    } finally { setProcessing(null); }
  };

  const handleReject = async (req) => {
    const note = window.prompt('রিজেক্টের কারণ (ঐচ্ছিক):', '');
    if (note === null) return;
    setProcessing(req.id); setError('');
    try {
      await rejectRequest(hospitalId, req.id, user, note);
    } catch (err) {
      setError(err.message || 'Reject failed');
    } finally { setProcessing(null); }
  };

  const renderDiff = (current, changes) => {
    const labels = {
      name: 'নাম', nameEn: 'English Name', specialty: 'বিশেষত্ব',
      quals: 'যোগ্যতা', workplace: 'কর্মস্থল',
    };
    return Object.entries(changes).map(([k, v]) => (
      <div key={k} style={{ fontSize: 13, padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>{labels[k] || k}:</span>{' '}
        {current[k] && <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{current[k]}</span>}
        {' → '}
        <span style={{ color: '#16a34a', fontWeight: 700 }}>{String(v)}</span>
      </div>
    ));
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleString('bn-BD');
  };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>📝 ডাক্তারের প্রোফাইল এডিট রিকোয়েস্ট</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
            {pendingCount} টি pending
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const count = requests.filter((r) => r.status === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                borderColor: activeTab === t.id ? '#1c5fa8' : '#e2e8f0',
                background: activeTab === t.id ? '#1c5fa8' : '#fff',
                color: activeTab === t.id ? '#fff' : '#334155',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              {t.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <Loader2 size={22} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p>লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <Clock size={28} style={{ opacity: 0.5 }} />
          <p>এই tab-এ কোনো রিকোয়েস্ট নেই</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((req) => (
            <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: req.status === 'pending' ? '#fef9c3' : '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{req.submittedByName}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Doctor ID: <code>{req.doctorId}</code> · {formatTime(req.submittedAt)}
                  </div>
                </div>
                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={processing === req.id}
                      style={{ padding: '7px 16px', background: processing === req.id ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: processing === req.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', gap: 5, alignItems: 'center' }}
                    >
                      {processing === req.id ? <Loader2 size={13} /> : <Check size={13} />} Approve
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      disabled={processing === req.id}
                      style={{ padding: '7px 16px', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: 8, cursor: processing === req.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', gap: 5, alignItems: 'center' }}
                    >
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}
                {req.status === 'approved' && (
                  <span style={{ padding: '5px 12px', background: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> Approved
                  </span>
                )}
                {req.status === 'rejected' && (
                  <span style={{ padding: '5px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <XCircle size={13} /> Rejected
                  </span>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>পরিবর্তন:</div>
                {renderDiff(req.currentValues || {}, req.changes || {})}
              </div>

              {req.status !== 'pending' && req.reviewedAt && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
                  {req.status === 'approved' ? 'এপ্রুভ' : 'রিজেক্ট'} করেছেন <strong>{req.reviewedByName || 'Admin'}</strong> · {formatTime(req.reviewedAt)}
                  {req.reviewNote && <div style={{ marginTop: 4, fontStyle: 'italic' }}>নোট: {req.reviewNote}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}