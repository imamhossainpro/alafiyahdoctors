import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, writeBatch } from '../../firebase';

const PatientMoveModal = ({ isOpen, onClose, patients, currentLocation, onSuccess }) => {
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [destinationLocation, setDestinationLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && patients) {
      setSelectedPatients(patients.map(p => p.id));
    }
  }, [isOpen, patients]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'locations'));
        const locs = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          locs.push({ id: doc.id, ...data });
        });
        locs.sort((a, b) => a.name.localeCompare(b.name));
        setLocations(locs);
      } catch (err) {
        console.error('Error loading locations:', err);
      }
    };
    if (isOpen) loadLocations();
  }, [isOpen]);

  const handleToggleSelect = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map(p => p.id));
    }
  };

  const handleMove = async () => {
    if (!destinationLocation) {
      setError('দয়া করে একটি গন্তব্য লোকেশন নির্বাচন করুন');
      return;
    }
    if (selectedPatients.length === 0) {
      setError('কোনো রোগী সিলেক্ট করা হয়নি');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const destLoc = locations.find(l => l.id === destinationLocation);
      if (!destLoc) {
        throw new Error('গন্তব্য লোকেশন পাওয়া যায়নি');
      }

      const batch = writeBatch(db);

      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const appointmentsToUpdate = [];
      appointmentsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (selectedPatients.includes(data.patientId)) {
          appointmentsToUpdate.push({ id: docSnap.id, ref: docSnap.ref, data });
        }
      });

      appointmentsToUpdate.forEach(({ id, ref, data }) => {
        batch.update(ref, {
          locationId: destinationLocation,
          locationName: destLoc.name,
          updatedAt: new Date().toISOString()
        });
      });

      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      patientsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (selectedPatients.includes(docSnap.id)) {
          batch.update(docSnap.ref, {
            locationId: destinationLocation,
            updatedAt: new Date().toISOString()
          });
        }
      });

      await batch.commit();

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Move error:', err);
      setError(err.message || 'রোগী মুভ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={20} color="#1c5fa8" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
              রোগী লোকেশন পরিবর্তন করুন
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            padding: '4px',
            borderRadius: '8px'
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#475569' }}>
              <strong>{patients?.length || 0}</strong> জন রোগী <strong>"{currentLocation || 'বর্তমান লোকেশন'}"</strong> লোকেশনে আছেন। নিচে থেকে গন্তব্য লোকেশন নির্বাচন করুন এবং মুভ করতে চান এমন রোগী বেছে নিন।
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
              গন্তব্য লোকেশন <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={destinationLocation}
              onChange={(e) => setDestinationLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="">-- লোকেশন নির্বাচন করুন --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id} disabled={loc.id === currentLocation}>
                  {loc.name} {loc.id === currentLocation && '(বর্তমান)'}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              background: '#f1f5f9',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                রোগী তালিকা ({selectedPatients.length} জন সিলেক্টেড)
              </span>
              <button
                onClick={handleSelectAll}
                style={{
                  fontSize: '12px',
                  color: '#1c5fa8',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {selectedPatients.length === patients?.length ? 'সব বাদ দিন' : 'সব বাছুন'}
              </button>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {patients?.map(patient => (
                <div
                  key={patient.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: selectedPatients.includes(patient.id) ? '#f0fdf4' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPatients.includes(patient.id)}
                    onChange={() => handleToggleSelect(patient.id)}
                    style={{ width: '18px', height: '18px', accentColor: '#1c5fa8', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#1e293b' }}>
                      {patient.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {patient.mobile || patient.phone || ''} 
                      {patient.bookingDate && ` | ${patient.bookingDate}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: '#dcfce7',
              color: '#166534',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <CheckCircle2 size={16} />
              <span>রোগী সফলভাবে স্থানান্তরিত হয়েছে!</span>
            </div>
          )}
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
              padding: '8px 20px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#475569'
            }}
          >
            বাতিল
          </button>
          <button
            onClick={handleMove}
            disabled={loading || !destinationLocation || selectedPatients.length === 0}
            style={{
              padding: '8px 24px',
              background: '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: (loading || !destinationLocation || selectedPatients.length === 0) ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="spin" size={16} />
                মুভ হচ্ছে...
              </>
            ) : (
              <>
                <MapPin size={16} />
                রোগী মুভ করুন
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientMoveModal;