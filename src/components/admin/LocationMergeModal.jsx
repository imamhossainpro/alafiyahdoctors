import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { mergeLocations } from '../../services/locationService';

export default function LocationMergeModal({ isOpen, onClose, locations, preSelected = [], onSuccess }) {
  const [masterId, setMasterId] = useState('');
  const [slaveIds, setSlaveIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (preSelected.length >= 2) {
        setMasterId(preSelected[0].id);
        setSlaveIds(preSelected.slice(1).map(l => l.id));
      } else {
        setMasterId('');
        setSlaveIds([]);
      }
      setPreview(null);
    }
  }, [isOpen, preSelected]);

  if (!isOpen) return null;

  const handlePreview = () => {
    if (!masterId || slaveIds.length === 0) {
      setError('মাস্টার ও স্লেভ লোকেশন নির্বাচন করুন');
      return;
    }
    const master = locations.find(l => l.id === masterId);
    const slaves = locations.filter(l => slaveIds.includes(l.id));
    const totalPatients = slaves.reduce((sum, s) => sum + (s.patientCount || 0), 0);
    setPreview({ master, slaves, totalPatients });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await mergeLocations(masterId, slaveIds);
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'মার্জ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: '16px', maxWidth: '560px', width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            🔗 লোকেশন মার্জ করুন
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
            একাধিক লোকেশনকে একটি প্রধান লোকেশনে মার্জ করুন। স্লেভ লোকেশনের রোগীরা মাস্টার লোকেশনে চলে যাবে।
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              প্রধান লোকেশন (Master) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
            >
              <option value="">-- নির্বাচন করুন --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} disabled={slaveIds.includes(loc.id)}>
                  {loc.name} ({loc.patientCount || 0} জন)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              স্লেভ লোকেশন (যেগুলো মার্জ হবে) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              multiple
              value={slaveIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setSlaveIds(selected.filter(id => id !== masterId));
              }}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '100px' }}
            >
              {locations.filter(loc => loc.id !== masterId).map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.patientCount || 0} জন)
                </option>
              ))}
            </select>
            <small style={{ color: '#64748b', fontSize: '12px' }}>Ctrl+ক্লিক করে একাধিক নির্বাচন করুন</small>
          </div>

          {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><AlertCircle size={16} />{error}</div>}
          {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><CheckCircle2 size={16} />মার্জ সম্পন্ন হয়েছে!</div>}

          {preview && (
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>📊 প্রিভিউ:</p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                <strong>{preview.master.name}</strong> ←{' '}
                {preview.slaves.map(s => s.name).join(', ')}
              </p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                প্রভাবিত রোগী: <strong>{preview.totalPatients}</strong> জন
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' }}>বাতিল</button>
          {!preview ? (
            <button onClick={handlePreview} style={{ padding: '8px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>প্রিভিউ দেখুন</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 24px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              নিশ্চিত করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}