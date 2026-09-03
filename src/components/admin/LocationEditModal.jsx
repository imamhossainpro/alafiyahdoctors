import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { updateLocation } from '../../services/locationService';
import { useHospital } from '../../context/HospitalContext';

export default function LocationEditModal({ isOpen, onClose, location, onSuccess }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;

  const [name, setName] = useState(location?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('লোকেশনের নাম লিখুন');
      return;
    }
    if (!hospitalId) {
      setError('হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateLocation(hospitalId, location.id, name.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            লোকেশন এডিট করুন
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              লোকেশনের নাম
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              autoFocus
            />
          </div>
          {error && <div style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
              বাতিল
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 24px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader2 className="spin" size={16} /> : null}
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}