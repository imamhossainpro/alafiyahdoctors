// src/components/admin/PatientMoveModal.jsx
import React, { useState, useEffect } from 'react';
import { SimpleListSkeleton } from '../ui/SkeletonScreens';
import {
  X,
  Loader2,
  Search,
  Users,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  increment,
  updateDoc,
} from 'firebase/firestore';
import {
  logActivity,
  LOG_MODULES,
  LOG_ACTIONS,
} from '../../services/activityLogService';

const PatientMoveModal = ({ isOpen, onClose, currentLocation, onSuccess }) => {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState(null);
  const [destLocations, setDestLocations] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectedDest, setSelectedDest] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ==================================================
  // ✅ Destination locations — শুধু active
  // ==================================================
  useEffect(() => {
    if (!isOpen || !hospitalId) return;

    const loadDestinations = async () => {
      try {
        const q = query(
          collection(db, 'hospitals', hospitalId, 'locations'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const locs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const filtered = locs.filter((l) => l.id !== currentLocation?.id);
        setDestLocations(filtered);
      } catch (err) {
        console.error('❌ Destination locations load error:', err);
        setError('লোকেশন লোড করতে সমস্যা হয়েছে');
      }
    };
    loadDestinations();
  }, [isOpen, hospitalId, currentLocation]);

  // ==================================================
  // ✅ Appointments load — Multiple fallback strategy
  // ==================================================
  useEffect(() => {
    if (!isOpen || !hospitalId || !currentLocation) return;

    const loadAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const locId = currentLocation.id;
        const locName = (currentLocation.name || '').toLowerCase().trim();
        const foundMap = new Map(); // key = appointment id → appointment

        // ---------- Strategy 1: locationId দিয়ে খোঁজ ----------
        try {
          const q1 = query(
            collection(db, 'hospitals', hospitalId, 'appointments'),
            where('locationId', '==', locId)
          );
          const snap1 = await getDocs(q1);
          snap1.forEach((d) => {
            const data = d.data();
            if (data.isArchived !== true) {
              foundMap.set(d.id, { id: d.id, ...data });
            }
          });
        } catch (e) {
          console.warn('locationId query failed:', e.message);
        }

        // ---------- Strategy 2: locationName দিয়ে খোঁজ ----------
        if (currentLocation.name) {
          try {
            const q2 = query(
              collection(db, 'hospitals', hospitalId, 'appointments'),
              where('locationName', '==', currentLocation.name)
            );
            const snap2 = await getDocs(q2);
            snap2.forEach((d) => {
              const data = d.data();
              if (data.isArchived !== true) {
                // যদি already অন্য location এ move হয়ে গেছে, skip
                if (data.locationId && data.locationId !== locId) return;
                foundMap.set(d.id, { id: d.id, ...data });
              }
            });
          } catch (e) {
            console.warn('locationName query failed:', e.message);
          }
        }

        // ---------- Strategy 3: address দিয়ে খোঁজ ----------
        if (currentLocation.name) {
          try {
            const q3 = query(
              collection(db, 'hospitals', hospitalId, 'appointments'),
              where('address', '==', currentLocation.name)
            );
            const snap3 = await getDocs(q3);
            snap3.forEach((d) => {
              const data = d.data();
              if (data.isArchived !== true) {
                if (data.locationId && data.locationId !== locId) return;
                foundMap.set(d.id, { id: d.id, ...data });
              }
            });
          } catch (e) {
            console.warn('address query failed:', e.message);
          }
        }

        // ---------- Strategy 4: Client-side partial match fallback ----------
        // যদি সব query ব্যর্থ হয় বা ০ résultat আসে, সব appointments load করে filter
        if (foundMap.size === 0 && currentLocation.name) {
          try {
            const allSnap = await getDocs(
              collection(db, 'hospitals', hospitalId, 'appointments')
            );
            allSnap.forEach((d) => {
              const data = d.data();
              if (data.isArchived === true) return;
              if (data.locationId && data.locationId !== locId) return;

              const addr = (data.address || '').toLowerCase().trim();
              const lname = (data.locationName || '').toLowerCase().trim();

              if (addr === locName || lname === locName) {
                foundMap.set(d.id, { id: d.id, ...data });
              }
            });
          } catch (e) {
            console.warn('Client-side fallback failed:', e.message);
          }
        }

        const result = Array.from(foundMap.values());
        setAllAppointments(result);
        setAppointments(result);
        setSelectedAppointments([]);

        console.log(
          `📋 PatientMoveModal: ${result.length} appointments loaded for "${currentLocation.name}"`
        );
      } catch (err) {
        console.error('❌ Appointment load error:', err);
        setError('Appointment ডেটা লোড করতে সমস্যা হয়েছে');
        setAllAppointments([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [isOpen, hospitalId, currentLocation]);

  // ==================================================
  // Search
  // ==================================================
  useEffect(() => {
    if (!searchTerm.trim()) {
      setAppointments(allAppointments);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = allAppointments.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(term)) ||
          (a.mobile && a.mobile.includes(term)) ||
          (a.doctorName && a.doctorName.toLowerCase().includes(term))
      );
      setAppointments(filtered);
    }
  }, [searchTerm, allAppointments]);

  const toggleAppointment = (id) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map((a) => a.id));
    }
  };

  // ==================================================
  // ✅ Move handler
  // ==================================================
  const handleMove = async () => {
    if (selectedAppointments.length === 0) {
      alert('কমপক্ষে একজন রোগী নির্বাচন করুন');
      return;
    }
    if (!selectedDest) {
      alert('গন্তব্য লোকেশন নির্বাচন করুন');
      return;
    }

    const destLocation = destLocations.find((l) => l.id === selectedDest);
    if (!destLocation) {
      alert('গন্তব্য লোকেশন পাওয়া যায়নি!');
      return;
    }

    if (destLocation.isActive === false) {
      alert('এই গন্তব্য লোকেশনটি নিষ্ক্রিয়।');
      return;
    }

    const destName = destLocation.name || '';
    if (
      !confirm(
        `${selectedAppointments.length} জন রোগীকে "${destName}"-এ সরাতে চান?`
      )
    )
      return;

    setMoving(true);
    setError(null);

    try {
      const movedList = selectedAppointments
        .map((id) => allAppointments.find((a) => a.id === id))
        .filter(Boolean)
        .map((a) => ({
          id: a.id,
          name: a.name || 'রোগী',
          mobile: a.mobile || '',
        }));

      const moveCount = selectedAppointments.length;
      const batch = writeBatch(db);
      const apptColl = collection(db, 'hospitals', hospitalId, 'appointments');

      // ১. প্রতিটি appointment এ নতুন location set করি
      selectedAppointments.forEach((id) => {
        const ref = doc(apptColl, id);
        batch.update(ref, {
          locationId: selectedDest,
          locationName: destName,
          updatedAt: new Date().toISOString(),
        });
      });

      // ২. Source location এর patientCount decrement
      if (currentLocation?.id) {
        const sourceRef = doc(
          db,
          'hospitals',
          hospitalId,
          'locations',
          currentLocation.id
        );
        batch.update(sourceRef, {
          patientCount: increment(-moveCount),
          updatedAt: new Date().toISOString(),
        });
      }

      // ৩. Destination location এর patientCount increment
      const destRef = doc(db, 'hospitals', hospitalId, 'locations', selectedDest);
      batch.update(destRef, {
        patientCount: increment(moveCount),
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      // Activity Log
      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.LOCATION,
          action: LOG_ACTIONS.LOCATION_CHANGE,
          recordId: selectedDest,
          description: `${movedList.length} জন রোগী "${currentLocation?.name || ''}" → "${destName}"-এ স্থানান্তর করা হয়েছে`,
          oldValue: {
            location: currentLocation?.name || '',
            locationId: currentLocation?.id || '',
            patients: movedList,
          },
          newValue: {
            location: destName,
            locationId: selectedDest,
            patientCount: movedList.length,
          },
          user,
        });
      } catch (logErr) {
        console.error('Move log error:', logErr);
      }

      setSelectedAppointments([]);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Move error:', err);
      setError('রোগী স্থানান্তর করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="#1c5fa8" />
            রোগী স্থানান্তর করুন
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>বর্তমান লোকেশন:</strong> {currentLocation?.name || '—'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>লোড হয়েছে:</strong>
              <span
                style={{
                  marginLeft: '8px',
                  fontWeight: '700',
                  color: allAppointments.length > 0 ? '#1e40af' : '#94a3b8',
                }}
              >
                {allAppointments.length} জন রোগী
              </span>
            </p>
          </div>

          {/* Destination dropdown */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}
            >
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
                fontSize: '14px',
              }}
            >
              <option value="">লোকেশন নির্বাচন করুন</option>
              {destLocations.length === 0 ? (
                <option value="" disabled>
                  কোনো active location নেই
                </option>
              ) : (
                destLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))
              )}
            </select>
            {destLocations.length === 0 && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                ⚠️ অন্য কোনো active location নেই।
              </p>
            )}
          </div>

          {/* Search */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f1f5f9',
                borderRadius: '6px',
                padding: '4px 12px',
              }}
            >
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="রোগী খুঁজুন (নাম, মোবাইল বা ডাক্তার)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  padding: '8px 10px',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* List */}
              {loading ? (
                <SimpleListSkeleton rows={5} />
              ) : appointments.length === 0 ? (
                <div
              style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}
            >
              {allAppointments.length === 0 ? (
                <div>
                  <p style={{ fontWeight: '600', color: '#475569' }}>
                    এই লোকেশনে কোনো রোগী নেই
                  </p>
                  <p style={{ fontSize: '12px', marginTop: '6px', color: '#94a3b8' }}>
                    Location name: "{currentLocation?.name}"
                  </p>
                </div>
              ) : (
                'সার্চে কোনো appointment পাওয়া যায়নি'
              )}
            </div>
          ) : (
            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead
                  style={{
                    background: '#f1f5f9',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedAppointments.length === appointments.length &&
                          appointments.length > 0
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>রোগীর নাম</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>মোবাইল</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ডাক্তার</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
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
          {!loading && appointments.length > 0 && (
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '8px',
                textAlign: 'center',
              }}
            >
              {searchTerm
                ? `সার্চে ${appointments.length} / ${allAppointments.length} টি দেখাচ্ছে`
                : `মোট ${appointments.length} টি appointment`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#f8fafc',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            বাতিল
          </button>
          <button
            onClick={handleMove}
            disabled={
              moving ||
              selectedAppointments.length === 0 ||
              !selectedDest ||
              destLocations.length === 0
            }
            style={{
              padding: '8px 20px',
              background:
                moving || selectedAppointments.length === 0 || !selectedDest
                  ? '#94a3b8'
                  : '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor:
                moving || selectedAppointments.length === 0 || !selectedDest
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {moving ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: 'spin 1s linear infinite' }}
                />{' '}
                স্থানান্তর হচ্ছে...
              </>
            ) : (
              <>
                <ArrowRight size={16} /> {selectedAppointments.length} জন মুভ করুন
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PatientMoveModal;