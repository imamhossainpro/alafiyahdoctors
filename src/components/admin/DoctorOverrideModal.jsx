// src/components/admin/DoctorOverrideModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { X, Ban, Loader2, Calendar } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { setChamberOff, clearChamberOff, addOneTimeDoctor, removeOneTimeDoctor, getOverridesForDate } from '../../services/doctorOverrideService';

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function DoctorOverrideModal({ departments = [], onClose }) {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  // ✅ Permission Check: শুধু Admin, Sub-admin, Editor, Moderator পারবে
  const allowedRoles = ['admin', 'sub-admin', 'editor', 'moderator'];
  const hasAccess = user && allowedRoles.includes(user.role);

  const [date, setDate] = useState(getTodayString());
  const [tab, setTab] = useState('off');
  const [loading, setLoading] = useState(false);
  const [offIds, setOffIds] = useState(new Set());
  const [addEntries, setAddEntries] = useState([]);
  const [selectedAddDoctorId, setSelectedAddDoctorId] = useState('');

  const allDoctors = useMemo(() => {
    const arr = [];
    departments.forEach((d) => {
      (d.doctors || []).forEach((doc) => {
        arr.push({ ...doc, deptName: d.name });
      });
    });
    return arr;
  }, [departments]);

  const load = async () => {
    setLoading(true);
    try {
      const { offIds: o, addEntries: a } = await getOverridesForDate(hospitalId, date);
      setOffIds(o);
      setAddEntries(a);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (hasAccess) load(); 
  }, [hospitalId, date, hasAccess]);

  if (!hasAccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
        <div style={{ background: '#fff', padding: 30, borderRadius: 16, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <Ban size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#dc2626' }}>Access Denied</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>আপনার এই অপশনটি ব্যবহার করার অনুমতি নেই।</p>
          <button onClick={onClose} style={{ padding: '10px 24px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>বন্ধ করুন</button>
        </div>
      </div>
    );
  }

  const toggleOff = async (doctorId) => {
    try {
      if (offIds.has(doctorId)) await clearChamberOff(hospitalId, doctorId, date);
      else await setChamberOff(hospitalId, doctorId, date, user);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddOneTime = async () => {
    const doc = allDoctors.find((d) => d.id === selectedAddDoctorId);
    if (!doc) return;
    try {
      await addOneTimeDoctor(hospitalId, doc.id, date, doc, user);
      setSelectedAddDoctorId('');
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveOneTime = async (doctorId) => {
    try {
      await removeOneTimeDoctor(hospitalId, doctorId, date);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 640, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ban size={18} color="#dc2626" /> ডাক্তার চেম্বার ওভাররাইড
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20}/></button>
        </div>

        {/* Date */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', background: '#fff' }}>
          <Calendar size={16} color="#1c5fa8" />
          <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>তারিখ নির্বাচন:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={() => setTab('off')} style={{ flex: 1, padding: 12, background: tab === 'off' ? '#fff' : '#f8fafc', borderBottom: tab === 'off' ? '3px solid #dc2626' : '3px solid transparent', fontWeight: 700, color: tab === 'off' ? '#dc2626' : '#64748b', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>চেম্বার বন্ধ / চালু</button>
          <button onClick={() => setTab('add')} style={{ flex: 1, padding: 12, background: tab === 'add' ? '#fff' : '#f8fafc', borderBottom: tab === 'add' ? '3px solid #16a34a' : '3px solid transparent', fontWeight: 700, color: tab === 'add' ? '#16a34a' : '#64748b', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>এই দিনে ডাক্তার অ্যাড</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {loading ? <div style={{ textAlign: 'center' }}><Loader2 className="spin" size={24} color="#1c5fa8" /></div> : (
            tab === 'off' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allDoctors.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>কোনো ডাক্তার পাওয়া যায়নি</p>}
                {allDoctors.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, background: offIds.has(doc.id) ? '#fef2f2' : '#fff' }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#1e293b' }}>{doc.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{doc.deptName || doc.specialty}</div>
                    </div>
                    <button onClick={() => toggleOff(doc.id)} style={{ padding: '6px 12px', background: offIds.has(doc.id) ? '#dc2626' : '#fff', color: offIds.has(doc.id) ? '#fff' : '#dc2626', border: '1.5px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
                      {offIds.has(doc.id) ? 'চালু করুন' : 'বন্ধ করুন'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <select value={selectedAddDoctorId} onChange={e => setSelectedAddDoctorId(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #cbd5e1', fontFamily: 'inherit' }}>
                    <option value="">-- ডাক্তার বাছুন --</option>
                    {allDoctors.filter(d => !addEntries.find(a => a.doctorId === d.id)).map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.deptName})</option>
                    ))}
                  </select>
                  <button onClick={handleAddOneTime} disabled={!selectedAddDoctorId} style={{ padding: '10px 16px', background: selectedAddDoctorId ? '#16a34a' : '#94a3b8', color: '#fff', border: 'none', borderRadius: 8, cursor: selectedAddDoctorId ? 'pointer' : 'not-allowed', fontWeight: 700, fontFamily: 'inherit' }}>Add</button>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#166534' }}>
                  💡 এই ডাক্তার শুধু <strong>{date}</strong> তারিখে অ্যাভেইলেবল থাকবেন। পার্মানেন্ট শিডিউলে কোনো প্রভাব পড়বে না।
                </div>
                {addEntries.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #bbf7d0', borderRadius: 8, background: '#f0fdf4', marginBottom: 8 }}>
                    <strong style={{ fontSize: 14, color: '#1e293b' }}>{entry.doctorSnapshot?.name || 'Unknown'}</strong>
                    <button onClick={() => handleRemoveOneTime(entry.doctorId)} style={{ background: '#fff', border: '1px solid #fca5a5', color: '#dc2626', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>সরান</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}