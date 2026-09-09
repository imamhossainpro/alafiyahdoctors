// src/components/admin/PatientMoveModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Search, Users, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

const PatientMoveModal = ({ isOpen, onClose, currentLocation, onSuccess }) => {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;

  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState(null);
  const [destLocations, setDestLocations] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedDest, setSelectedDest] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen || !hospitalId) return;
    const loadDestinations = async () => {
      try {
        const locRef = collection(db, 'hospitals', hospitalId, 'locations');
        const snapshot = await getDocs(locRef);
        const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = locs.filter(l => l.id !== currentLocation?.id);
        setDestLocations(filtered);
      } catch (err) {
        console.error('❌ গন্তব্য লোকেশন লোড error:', err);
        setError('লোকেশন লোড করতে সমস্যা হয়েছে');
      }
    };
    loadDestinations();
  }, [isOpen, hospitalId, currentLocation]);

  useEffect(() => {
    if (!isOpen || !hospitalId || !currentLocation) return;
    const loadAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        let apptList = [];
        const locationId = currentLocation.id;
        const locationName = currentLocation.name;

        // ১. locationId দিয়ে খোঁজ
        let q = query(
          collection(db, 'hospitals', hospitalId, 'appointments'),
          where('locationId', '==', locationId)
        );
        let snapshot = await getDocs(q);
        apptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // ২. locationName দিয়ে খোঁজ
        if (apptList.length === 0 && locationName) {
          q = query(
            collection(db, 'hospitals', hospitalId, 'appointments'),
            where('locationName', '==', locationName)
          );
          snapshot = await getDocs(q);
          apptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // ৩. address দিয়ে খোঁজ
        if (apptList.length === 0 && locationName) {
          q = query(
            collection(db, 'hospitals', hospitalId, 'appointments'),
            where('address', '==', locationName)
          );
          snapshot = await getDocs(q);
          apptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // ৪. partial match
        if (apptList.length === 0 && locationName) {
          const allSnapshot = await getDocs(collection(db, 'hospitals', hospitalId, 'appointments'));
          const allData = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          apptList = allData.filter(a => 
            a.address && a.address.toLowerCase().includes(locationName.toLowerCase())
          );
        }

        setAllAppointments(apptList);
        setAppointments(apptList);
        setSelectedAppointments([]);
      } catch (err) {
        console.error('❌ অ্যাপয়েন্টমেন্ট লোড error:', err);
        setError('অ্যাপয়েন্টমেন্ট ডেটা লোড করতে সমস্যা হয়েছে');
        setAllAppointments([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [isOpen, hospitalId, currentLocation]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setAppointments(allAppointments);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allAppointments.filter(a =>
        (a.name && a.name.toLowerCase().includes(term)) ||
        (a.mobile && a.mobile.includes(term)) ||
        (a.doctorName && a.doctorName.toLowerCase().includes(term))
      );
      setAppointments(filtered);
    }
  }, [searchTerm, allAppointments]);

  const toggleAppointment = (id) => {
    setSelectedAppointments(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(a => a.id));
    }
  };

  const handleMove = async () => {
    if (selectedAppointments.length === 0) {
      alert('কমপক্ষে একজন রোগী নির্বাচন করুন');
      return;
    }
    if (!selectedDest) {
      alert('গন্তব্য লোকেশন নির্বাচন করুন');
      return;
    }
    const destName = destLocations.find(l => l.id === selectedDest)?.name || '';
    if (!confirm(`${selectedAppointments.length} জন রোগীকে "${destName}"-এ সরাতে চান?`)) return;

    setMoving(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      const apptRef = collection(db, 'hospitals', hospitalId, 'appointments');
      selectedAppointments.forEach(id => {
        const ref = doc(apptRef, id);
        batch.update(ref, { 
          locationId: selectedDest,
          locationName: destName,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      setSelectedAppointments([]);
      if (onSuccess) onSuccess();
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
            <p>
              <strong>মোট রোগী:</strong> 
              <span style={{ 
                marginLeft: '8px', 
                fontWeight: '700', 
                color: allAppointments.length > 0 ? '#1e40af' : '#64748b'
              }}>
                {allAppointments.length} জন
              </span>
            </p>
          </div>

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

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '4px 12px' }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="রোগী খুঁজুন (নাম, মোবাইল বা ডাক্তার)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  padding: '8px 10px', fontSize: '14px', width: '100%'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p>অ্যাপয়েন্টমেন্ট লোড হচ্ছে...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              {allAppointments.length === 0
                ? 'এই লোকেশনে কোনো অ্যাপয়েন্টমেন্ট নেই।'
                : 'সার্চে কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।'}
            </div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedAppointments.length === appointments.length && appointments.length > 0} 
                        onChange={toggleAll} 
                      />
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>রোগীর নাম</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>মোবাইল</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ডাক্তার</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="checkbox"
                          checked={selectedAppointments.includes(a.id)}
                          onChange={() => toggleAppointment(a.id)}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>{a.name || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{a.mobile || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{a.doctorName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            মোট {appointments.length} টি অ্যাপয়েন্টমেন্ট দেখাচ্ছে
          </div>
        </div>

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
            disabled={moving || selectedAppointments.length === 0 || !selectedDest}
            style={{
              padding: '8px 20px',
              background: moving ? '#94a3b8' : '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: moving || selectedAppointments.length === 0 || !selectedDest ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: moving || selectedAppointments.length === 0 || !selectedDest ? 0.6 : 1
            }}
          >
            {moving ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> স্থানান্তর হচ্ছে...</>
            ) : (
              <><ArrowRight size={16} /> {selectedAppointments.length} জন মুভ করুন</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientMoveModal;