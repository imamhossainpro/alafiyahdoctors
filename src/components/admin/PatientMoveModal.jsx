// src/components/admin/PatientMoveModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, Users, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

const PatientMoveModal = ({ isOpen, onClose, currentLocation, onSuccess }) => {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;

  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState(null);
  const [destLocations, setDestLocations] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [selectedDest, setSelectedDest] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // লোকেশন লোড (গন্তব্যের জন্য)
  useEffect(() => {
    if (!isOpen || !hospitalId) return;
    const loadDestinations = async () => {
      try {
        const locRef = collection(db, 'hospitals', hospitalId, 'locations');
        const snapshot = await getDocs(locRef);
        const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // বাদ দিন বর্তমান লোকেশনটি
        const filtered = locs.filter(l => l.id !== currentLocation?.id);
        setDestLocations(filtered);
      } catch (err) {
        console.error('❌ গন্তব্য লোকেশন লোড error:', err);
        setError('লোকেশন লোড করতে সমস্যা হয়েছে');
      }
    };
    loadDestinations();
  }, [isOpen, hospitalId, currentLocation]);

  // রোগী লোড (বর্তমান লোকেশন অনুযায়ী)
  useEffect(() => {
    if (!isOpen || !hospitalId || !currentLocation) return;
    const loadPatients = async () => {
      setLoading(true);
      try {
        // ধরে নিচ্ছি রোগীদের ডকুমেন্টে `location` ফিল্ড আছে (লোকেশন ID বা নাম)
        const patientsRef = collection(db, 'hospitals', hospitalId, 'patients');
        // ফিল্টার: যাদের location === currentLocation.id অথবা currentLocation.name
        const q = query(patientsRef, where('location', '==', currentLocation.id));
        const snapshot = await getDocs(q);
        let patientsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // যদি location ফিল্ডে নামও থাকে, সেটাও চেক করুন
        if (patientsList.length === 0) {
          const q2 = query(patientsRef, where('location', '==', currentLocation.name));
          const snap2 = await getDocs(q2);
          patientsList = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        setAllPatients(patientsList);
        setPatients(patientsList);
        setSelectedPatients([]);
        setError(null);
      } catch (err) {
        console.error('❌ রোগী লোড error:', err);
        setError('রোগী ডেটা লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, [isOpen, hospitalId, currentLocation]);

  // সার্চ ফিল্টার
  useEffect(() => {
    if (!searchTerm.trim()) {
      setPatients(allPatients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allPatients.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.mobile && p.mobile.includes(term))
      );
      setPatients(filtered);
    }
  }, [searchTerm, allPatients]);

  // চেকবক্স টগল
  const togglePatient = (id) => {
    setSelectedPatients(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // সব সিলেক্ট/ডিসিলেক্ট
  const toggleAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.id));
    }
  };

  // মুভ হ্যান্ডলার
  const handleMove = async () => {
    if (selectedPatients.length === 0) {
      alert('কমপক্ষে একজন রোগী নির্বাচন করুন');
      return;
    }
    if (!selectedDest) {
      alert('গন্তব্য লোকেশন নির্বাচন করুন');
      return;
    }
    if (!confirm(`${selectedPatients.length} জন রোগীকে "${selectedDest}"-এ সরাতে চান?`)) return;

    setMoving(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const patientsRef = collection(db, 'hospitals', hospitalId, 'patients');
      const updates = selectedPatients.map(id => {
        const ref = doc(patientsRef, id);
        batch.update(ref, { location: selectedDest, updatedAt: new Date().toISOString() });
      });
      await batch.commit();

      // সাফল্য
      setSelectedPatients([]);
      if (onSuccess) onSuccess();
      // মোডাল বন্ধ করবেন না – ইউজার নিজে বন্ধ করতে পারে
    } catch (err) {
      console.error('❌ মুভ error:', err);
      setError('রোগী স্থানান্তর করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* হেডার */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#1c5fa8" />
            রোগী স্থানান্তর করুন
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#64748b" />
          </button>
        </div>

        {/* কন্টেন্ট */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fee2e2', color: '#991b1b',
              padding: '10px 14px', borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <p><strong>বর্তমান লোকেশন:</strong> {currentLocation?.name || '—'}</p>
            <p><strong>মোট রোগী:</strong> {allPatients.length} জন</p>
          </div>

          {/* গন্তব্য নির্বাচন */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>
              গন্তব্য লোকেশন <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#fff',
                fontSize: '14px'
              }}
            >
              <option value="">লোকেশন নির্বাচন করুন</option>
              {destLocations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* সার্চ */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '4px 12px' }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="রোগী খুঁজুন (নাম বা মোবাইল)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  padding: '8px 10px', fontSize: '14px', width: '100%'
                }}
              />
            </div>
          </div>

          {/* রোগী তালিকা */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p>রোগী লোড হচ্ছে...</p>
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              {allPatients.length === 0
                ? 'এই লোকেশনে কোনো রোগী নেই।'
                : 'সার্চে কোনো রোগী পাওয়া যায়নি।'}
            </div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '40px' }}>
                      <input type="checkbox" checked={selectedPatients.length === patients.length && patients.length > 0} onChange={toggleAll} />
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>নাম</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>মোবাইল</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(p.id)}
                          onChange={() => togglePatient(p.id)}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>{p.name || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{p.mobile || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            বাতিল
          </button>
          <button
            onClick={handleMove}
            disabled={moving || selectedPatients.length === 0 || !selectedDest}
            style={{
              padding: '8px 20px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: moving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: moving || selectedPatients.length === 0 || !selectedDest ? 0.6 : 1
            }}
          >
            {moving ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> স্থানান্তর হচ্ছে...</>
            ) : (
              <><ArrowRight size={16} /> {selectedPatients.length} জন মুভ করুন</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientMoveModal;