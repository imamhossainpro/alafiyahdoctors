// src/components/doctor/DoctorProfileEditModal.jsx
import React, { useState } from 'react';
import { X, Save, Loader2, AlertCircle, Check, Clock } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { submitProfileEditRequest } from '../../services/doctorProfileRequestService';

export default function DoctorProfileEditModal({ currentProfile, onClose, onSubmitted }) {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [form, setForm] = useState({
    name: currentProfile?.name || '',
    nameEn: currentProfile?.nameEn || '',
    specialty: currentProfile?.specialty || '',
    quals: currentProfile?.quals || '',
    workplace: currentProfile?.workplace || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const computeChanges = () => {
    const c = {};
    Object.entries(form).forEach(([k, v]) => {
      if ((v || '').trim() !== (currentProfile?.[k] || '').trim()) c[k] = v.trim();
    });
    return c;
  };

  const handleSubmit = async () => {
    setError('');
    const changes = computeChanges();
    if (Object.keys(changes).length === 0) return setError('কোনো পরিবর্তন করেননি');
    if (!form.name.trim()) return setError('নাম আবশ্যক');
    if (!user?.doctorId) return setError('doctorId সেট নেই — অ্যাডমিনের সাথে যোগাযোগ করুন');

    if (!window.confirm('পরিবর্তনগুলো অ্যাডমিনের কাছে পাঠানো হবে। এপ্রুভ হলে সেভ হবে। আপনি নিশ্চিত?')) return;

    setSaving(true);
    try {
      await submitProfileEditRequest(
        hospitalId,
        user.doctorId,
        changes,
        user
      );
      setSuccess(true);
      onSubmitted?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      console.error(err);
      setError(err.message || 'রিকোয়েস্ট পাঠানো যায়নি');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 5 };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>✏️ প্রোফাইল এডিট রিকোয়েস্ট</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>অ্যাডমিন এপ্রুভ করলে সেভ হবে</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {success ? (
            <div style={{ background: '#dcfce7', color: '#166534', padding: 16, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Check size={22} />
              <div>
                <div style={{ fontWeight: 700 }}>✅ রিকোয়েস্ট পাঠানো হয়েছে</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>অ্যাডমিন এপ্রুভ করলে প্রোফাইল আপডেট হবে।</div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>নাম (বাংলা) *</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>নাম (English)</label>
                <input value={form.nameEn} onChange={(e) => handleChange('nameEn', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>বিশেষত্ব</label>
                <input value={form.specialty} onChange={(e) => handleChange('specialty', e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>শিক্ষাগত যোগ্যতা</label>
                <textarea value={form.quals} onChange={(e) => handleChange('quals', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>কর্মস্থল / পদবী</label>
                <textarea value={form.workplace} onChange={(e) => handleChange('workplace', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#0f766e', marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Clock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>রিকোয়েস্ট pending অবস্থায় থাকলে অ্যাডমিন রিভিউ না করা পর্যন্ত পুরনো প্রোফাইলই দেখাবে।</div>
              </div>
            </>
          )}
        </div>

        {!success && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} disabled={saving} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#475569' }}>
              বাতিল
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: '9px 22px', background: saving ? '#94a3b8' : '#1c5fa8', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
              {saving ? <><Loader2 size={15} className="spin" /> পাঠানো হচ্ছে...</> : <><Save size={15} /> রিকোয়েস্ট পাঠান</>}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}