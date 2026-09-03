import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { mergeLocations } from '../../services/locationService';
import { useHospital } from '../../context/HospitalContext';

export default function LocationMergeModal({ isOpen, onClose, locations, preSelected = [], onSuccess }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;

  const [masterId, setMasterId] = useState('');
  const [slaveIds, setSlaveIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);

  // প্রি-সিলেক্টেড সেট করা
  useEffect(() => {
    if (isOpen) {
      console.log('🔵 মডাল খোলা হয়েছে, preSelected:', preSelected);
      
      if (preSelected && preSelected.length >= 2) {
        const master = preSelected[0];
        const slaves = preSelected.slice(1);
        setMasterId(master.id);
        setSlaveIds(slaves.map(s => s.id));
        console.log('✅ সেট করা হয়েছে: master=', master.id, 'slaves=', slaves.map(s => s.id));
      } else {
        setMasterId('');
        setSlaveIds([]);
      }
      setPreview(null);
      setError('');
      setSuccess(false);
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
    if (!masterId || slaveIds.length === 0) {
      setError('মাস্টার ও স্লেভ লোকেশন নির্বাচন করুন');
      return;
    }

    if (!hospitalId) {
      setError('হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🚀 মার্জ শুরু হচ্ছে...');
      console.log('  hospitalId:', hospitalId);
      console.log('  masterId:', masterId);
      console.log('  slaveIds:', slaveIds);
      
      const result = await mergeLocations(hospitalId, masterId, slaveIds);
      console.log('✅ মার্জ রেজাল্ট:', result);
      
      setSuccess(true);
      
      if (onSuccess) {
        console.log('📢 onSuccess কল করা হচ্ছে...');
        await onSuccess();
        console.log('✅ onSuccess সম্পন্ন');
      }
      
      setTimeout(() => {
        console.log('⏰ মডাল বন্ধ করা হচ্ছে...');
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('❌ মার্জ এরর:', err);
      setError(err.message || 'মার্জ করতে সমস্যা হয়েছে');
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
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* হেডার */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
            🔗 লোকেশন মার্জ করুন
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* বডি */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
            একাধিক লোকেশনকে একটি প্রধান লোকেশনে মার্জ করুন। স্লেভ লোকেশনের রোগীরা মাস্টার লোকেশনে চলে যাবে এবং স্লেভ লোকেশন ডিলিট হবে।
          </p>

          {/* মাস্টার সিলেক্ট */}
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

          {/* স্লেভ সিলেক্ট */}
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

          {/* মেসেজ */}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={16} /> মার্জ সম্পন্ন হয়েছে!
            </div>
          )}

          {/* প্রিভিউ */}
          {preview && (
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>📊 প্রিভিউ:</p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                <strong>{preview.master.name}</strong> ← {preview.slaves.map(s => s.name).join(', ')}
              </p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                প্রভাবিত রোগী: <strong>{preview.totalPatients}</strong> জন
              </p>
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
            বাতিল
          </button>
          {!preview ? (
            <button onClick={handlePreview} style={{ padding: '8px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              প্রিভিউ দেখুন
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || success || !hospitalId}
              style={{
                padding: '8px 24px',
                background: loading ? '#94a3b8' : (success ? '#22c55e' : '#1c5fa8'),
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || success ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: loading || success || !hospitalId ? 0.6 : 1
              }}
            >
              {loading ? <Loader2 className="spin" size={16} /> : success ? <CheckCircle2 size={16} /> : null}
              {loading ? 'মার্জ হচ্ছে...' : success ? 'সম্পন্ন!' : 'নিশ্চিত করুন'}
            </button>
          )}
        </div>
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}