// src/components/admin/LocationManager.jsx
import React, { useState, useEffect } from 'react';
import {
  MapPin, Edit2, Trash2, Merge, Search, RefreshCw,
  AlertCircle, CheckCircle, X, Loader2, Move
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { usePermission } from '../../context/PermissionContext';
import {
  getAllLocations,
  deleteLocation,
  mergeLocations,
  detectDuplicateLocations,
} from '../../services/locationService';
import LocationEditModal from './LocationEditModal';
import LocationMergeModal from './LocationMergeModal';
import PatientMoveModal from './PatientMoveModal';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { logActivity, LOG_MODULES, LOG_ACTIONS } from '../../services/activityLogService';

const LocationManager = ({ appointments, user, onAppointmentsChange }) => {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;
  const { can } = usePermission();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ==================================================
  // ✅ Permission shortcuts
  // ==================================================
  const canView = can('location.view');
  const canEdit = can('location.edit');
  const canDelete = can('location.delete');
  const canMerge = can('location.merge');
  const canMovePatient = can('location.move_patient');

  // ==================================================
  // ✅ Load Locations
  // ==================================================
  useEffect(() => {
    const loadLocations = async () => {
      if (!hospitalId) {
        setLoading(false);
        showMessage('error', 'হাসপাতাল আইডি পাওয়া যায়নি!');
        return;
      }
      setLoading(true);
      try {
        const locs = await getAllLocations(hospitalId);
        setLocations(locs || []);
        if (!locs || locs.length === 0) {
          showMessage(
            'info',
            'কোনো লোকেশন পাওয়া যায়নি। নতুন বুকিং করলে লোকেশন স্বয়ংক্রিয়ভাবে তৈরি হবে।'
          );
        }
      } catch (error) {
        console.error('❌ লোকেশন লোড এরর:', error);
        showMessage('error', 'লোকেশন লোড করতে সমস্যা হয়েছে: ' + error.message);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, [hospitalId, refreshKey]);

  // ==================================================
  // ✅ Get Actual Patient Count
  // ==================================================
  const getActualPatientCount = async (locationId) => {
    try {
      if (!hospitalId) return -1;
      const q = query(
        collection(db, 'hospitals', hospitalId, 'appointments'),
        where('locationId', '==', locationId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('❌ রোগী কাউন্ট চেক error:', error);
      return -1;
    }
  };

  // ==================================================
  // ✅ Delete + Permission + Activity Log
  // ==================================================
  const handleDelete = async (id) => {
    if (!canDelete) {
      showMessage('error', '❌ আপনার লোকেশন ডিলিট করার permission নেই।');
      return;
    }
    if (!hospitalId) {
      showMessage('error', 'হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }
    const loc = (locations || []).find((l) => l.id === id);
    if (!loc) {
      showMessage('error', 'লোকেশন খুঁজে পাওয়া যায়নি!');
      return;
    }

    const actualCount = await getActualPatientCount(loc.id);
    if (actualCount === -1) {
      showMessage('error', 'রোগী কাউন্ট চেক করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      return;
    }
    if (actualCount > 0) {
      showMessage(
        'error',
        `এই লোকেশনে ${actualCount} জন রোগী আছে, আগে রোগী মুভ করুন!`
      );
      return;
    }

    if (!confirm(`"${loc.name}" লোকেশনটি ডিলিট করতে চান? এটি স্থায়ীভাবে মুছে যাবে।`))
      return;
    try {
      await deleteLocation(hospitalId, id, true);

      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.LOCATION,
          action: LOG_ACTIONS.DELETE,
          recordId: loc.id,
          description: `লোকেশন "${loc.name}" ডিলিট করা হয়েছে`,
          oldValue: { id: loc.id, name: loc.name, patientCount: loc.patientCount || 0 },
          newValue: null,
          user,
        });
      } catch (logErr) {
        console.error('Delete log error:', logErr);
      }

      showMessage('success', `"${loc.name}" ডিলিট করা হয়েছে!`);
      setRefreshKey((prev) => prev + 1);
      if (onAppointmentsChange) await onAppointmentsChange();
    } catch (error) {
      console.error('❌ ডিলিট error:', error);
      showMessage('error', 'ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  // ==================================================
  // ✅ Edit
  // ==================================================
  const handleEdit = (location) => {
    if (!canEdit) {
      showMessage('error', '❌ আপনার লোকেশন এডিট করার permission নেই।');
      return;
    }
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  // ==================================================
  // ✅ Move
  // ==================================================
  const handleOpenMoveModal = (location) => {
    if (!canMovePatient) {
      showMessage('error', '❌ আপনার রোগী মুভ করার permission নেই।');
      return;
    }
    setSelectedLocation(location);
    setShowMoveModal(true);
  };

  const handleMoveSuccess = async () => {
    setRefreshKey((prev) => prev + 1);
    showMessage('success', 'রোগী স্থানান্তরিত হয়েছে!');
    if (onAppointmentsChange) await onAppointmentsChange();
  };

  // ==================================================
  // ✅ Find Duplicates
  // ==================================================
  const handleFindDuplicates = async () => {
    if (!hospitalId) {
      showMessage('error', 'হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }
    setLoading(true);
    try {
      const dupes = await detectDuplicateLocations(hospitalId);
      setDuplicates(dupes || []);
      setShowDuplicates(true);
      if (!dupes || dupes.length === 0) {
        showMessage('success', 'কোনো ডুপ্লিকেট লোকেশন পাওয়া যায়নি!');
      } else {
        showMessage('info', `${dupes.length} টি ডুপ্লিকেট গ্রুপ পাওয়া গেছে।`);
      }
    } catch (error) {
      console.error('❌ ডুপ্লিকেট খুঁজতে সমস্যা:', error);
      showMessage('error', 'ডুপ্লিকেট খুঁজতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Direct Merge
  // ==================================================
  const handleDirectMerge = async (master, slaves) => {
    if (!canMerge) {
      showMessage('error', '❌ আপনার লোকেশন মার্জ করার permission নেই।');
      return;
    }
    if (!hospitalId) {
      showMessage('error', 'হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }
    if (!master || !master.id) {
      showMessage('error', 'মাস্টার লোকেশন সঠিক নয়!');
      return;
    }
    const slaveIds = slaves.map((s) => s.id).filter((id) => id);
    if (slaveIds.length === 0) {
      showMessage('error', 'কোনো স্লেভ লোকেশন নেই!');
      return;
    }
    if (
      !confirm(
        `"${master.name}" (মাস্টার) ← ${slaves
          .map((s) => `"${s.name}"`)
          .join(', ')} মার্জ করতে চান?`
      )
    )
      return;

    try {
      const result = await mergeLocations(hospitalId, master.id, slaveIds);
      if (result && result.success) {
        showMessage('success', `"${master.name}"-এ মার্জ সম্পন্ন!`);
        setRefreshKey((prev) => prev + 1);
        setShowDuplicates(false);
        setDuplicates([]);

        try {
          await logActivity({
            hospitalId,
            module: LOG_MODULES.LOCATION,
            action: LOG_ACTIONS.UPDATE,
            recordId: master.id,
            description: `লোকেশন মার্জ: ${slaves
              .map((s) => s.name)
              .join(', ')} → ${master.name}`,
            oldValue: {
              master: master.name,
              slaves: slaves.map((s) => ({ id: s.id, name: s.name })),
            },
            newValue: {
              master: master.name,
              masterId: master.id,
              totalPatients: result.totalPatients || 0,
            },
            user,
          });
        } catch (logErr) {
          console.error('Merge log error:', logErr);
        }

        if (onAppointmentsChange) await onAppointmentsChange();
      } else {
        showMessage('error', 'মার্জ সম্পন্ন হয়নি!');
      }
    } catch (error) {
      console.error('❌ মার্জ ব্যর্থ:', error);
      showMessage('error', 'মার্জ ব্যর্থ: ' + error.message);
    }
  };

  // ==================================================
  // ✅ Merge Modal
  // ==================================================
  const handleMerge = () => {
    if (!canMerge) {
      showMessage('error', '❌ আপনার লোকেশন মার্জ করার permission নেই।');
      return;
    }
    setSelectedLocations([]);
    setShowMergeModal(true);
  };

  const onMergeSuccess = async () => {
    setRefreshKey((prev) => prev + 1);
    showMessage('success', 'লোকেশন মার্জ সম্পন্ন হয়েছে!');

    if (selectedLocations.length >= 2 && hospitalId) {
      const master = selectedLocations[0];
      const slaves = selectedLocations.slice(1);
      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.LOCATION,
          action: LOG_ACTIONS.UPDATE,
          recordId: master.id,
          description: `লোকেশন মার্জ: ${slaves
            .map((s) => s.name)
            .join(', ')} → ${master.name}`,
          oldValue: {
            master: master.name,
            slaves: slaves.map((s) => ({ id: s.id, name: s.name })),
          },
          newValue: { master: master.name, masterId: master.id },
          user,
        });
      } catch (logErr) {
        console.error('Merge modal log error:', logErr);
      }
    }

    setShowMergeModal(false);
    setSelectedLocations([]);
    setShowDuplicates(false);
    setDuplicates([]);
    if (onAppointmentsChange) await onAppointmentsChange();
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const filteredLocations = (locations || []).filter(
    (loc) => loc.name && loc.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // ==================================================
  // ✅ No View Permission
  // ==================================================
  if (!canView) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '60px 20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Denied</h3>
        <p style={{ color: '#64748b' }}>আপনার লোকেশন ম্যানেজার দেখার permission নেই।</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <p style={{ color: '#64748b' }}>হাসপাতাল আইডি পাওয়া যায়নি।</p>
      </div>
    );
  }

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#1c5fa8" /> 📍 লোকেশন ম্যানেজার
          </h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            মোট {locations.length} টি লোকেশন ·{' '}
            {locations.reduce((sum, l) => sum + (l.patientCount || 0), 0)} জন রোগী
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Find duplicates */}
          <button
            onClick={handleFindDuplicates}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Search size={16} /> ডুপ্লিকেট খুঁজুন
          </button>

          {/* Merge */}
          {canMerge && (
            <button
              onClick={handleMerge}
              style={{
                padding: '8px 16px',
                background: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Merge size={16} /> মার্জ করুন
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            style={{
              padding: '8px 16px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} /> রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            background:
              message.type === 'success'
                ? '#dcfce7'
                : message.type === 'info'
                ? '#dbeafe'
                : '#fee2e2',
            color:
              message.type === 'success'
                ? '#166534'
                : message.type === 'info'
                ? '#1e40af'
                : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px 12px',
            maxWidth: '300px',
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="লোকেশন খুঁজুন..."
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

      {/* Duplicates banner */}
      {showDuplicates && duplicates.length > 0 && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: '600', color: '#92400e' }}>
              ⚠️ {duplicates.length} টি ডুপ্লিকেট গ্রুপ পাওয়া গেছে!
            </span>
            <button
              onClick={() => setShowDuplicates(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#92400e',
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ marginTop: '8px' }}>
            {duplicates.map((group, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #fcd34d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '14px' }}>
                  <strong>{group.master.name}</strong> ←{' '}
                  {group.slaves.map((s) => `"${s.name}"`).join(', ')}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {canMerge && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedLocations([group.master, ...group.slaves]);
                          setShowMergeModal(true);
                        }}
                        style={{
                          padding: '4px 16px',
                          background: '#8b5cf6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        🔗 মার্জ করুন
                      </button>
                      <button
                        onClick={() => handleDirectMerge(group.master, group.slaves)}
                        style={{
                          padding: '4px 16px',
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        ⚡ সরাসরি মার্জ
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2
            className="spin"
            size={24}
            color="#64748b"
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <p style={{ color: '#64748b', marginTop: '10px' }}>লোড হচ্ছে...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>লোকেশন নাম</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>রোগী সংখ্যা</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>শেষ ভিজিট</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}
                  >
                    {locations.length === 0 ? (
                      <div>
                        <p>📍 কোনো লোকেশন পাওয়া যায়নি</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                          নতুন বুকিং করলে লোকেশন স্বয়ংক্রিয়ভাবে তৈরি হবে।
                        </p>
                      </div>
                    ) : (
                      'কোনো লোকেশন পাওয়া যায়নি'
                    )}
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => {
                  const patientCount = loc.patientCount || 0;
                  return (
                    <tr key={loc.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        {loc.name || '(নাম নেই)'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: patientCount > 0 ? '#dbeafe' : '#f1f5f9',
                            color: patientCount > 0 ? '#1e40af' : '#64748b',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {patientCount}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          color: '#64748b',
                          fontSize: '13px',
                        }}
                      >
                        {loc.updatedAt
                          ? new Date(loc.updatedAt).toLocaleDateString('bn-BD')
                          : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div
                          style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}
                        >
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(loc)}
                              title="এডিট"
                              style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {canMovePatient && (
                            <button
                              onClick={() => handleOpenMoveModal(loc)}
                              title="রোগী মুভ"
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              <Move size={14} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDelete(loc.id)}
                              title="ডিলিট"
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}

                          {!canEdit && !canMovePatient && !canDelete && (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                              (View Only)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showEditModal && selectedLocation && (
        <LocationEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedLocation(null);
          }}
          location={selectedLocation}
          onSuccess={async () => {
            setRefreshKey((prev) => prev + 1);
            showMessage('success', 'লোকেশন আপডেট করা হয়েছে!');
            if (onAppointmentsChange) await onAppointmentsChange();
          }}
        />
      )}

      {showMergeModal && (
        <LocationMergeModal
          isOpen={showMergeModal}
          onClose={() => {
            setShowMergeModal(false);
            setSelectedLocations([]);
          }}
          locations={locations}
          preSelected={selectedLocations}
          onSuccess={onMergeSuccess}
        />
      )}

      {showMoveModal && selectedLocation && (
        <PatientMoveModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setSelectedLocation(null);
          }}
          currentLocation={selectedLocation}
          onSuccess={handleMoveSuccess}
        />
      )}
    </div>
  );
};

export default LocationManager;