import React, { useState, useEffect } from 'react';
import { 
  MapPin, Edit2, Trash2, Merge, Search, RefreshCw, 
  AlertCircle, CheckCircle, X, Loader2, Move 
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { 
  getAllLocations, 
  updateLocation, 
  deleteLocation, 
  mergeLocations, 
  detectDuplicateLocations,
  recalculateAllCounts
} from '../../services/locationService';
import LocationEditModal from './LocationEditModal';
import LocationMergeModal from './LocationMergeModal';
import PatientMoveModal from './PatientMoveModal';

const LocationManager = ({ appointments, user }) => {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id;

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

  const isAdmin = user?.role === 'admin';

  // লোকেশন লোড
  useEffect(() => {
    const loadLocations = async () => {
      if (!hospitalId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const locs = await getAllLocations(hospitalId);
        console.log('📋 লোকেশন লোড:', locs);
        setLocations(locs);
      } catch (error) {
        console.error('❌ লোকেশন লোড এরর:', error);
        showMessage('error', 'লোকেশন লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, [hospitalId, refreshKey]);

  // ডুপ্লিকেট খোঁজ
  const handleFindDuplicates = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const dupes = await detectDuplicateLocations(hospitalId);
      setDuplicates(dupes);
      setShowDuplicates(true);
      if (dupes.length === 0) {
        showMessage('success', 'কোনো ডুপ্লিকেট লোকেশন পাওয়া যায়নি!');
      } else {
        showMessage('info', `${dupes.length} টি ডুপ্লিকেট গ্রুপ পাওয়া গেছে।`);
      }
    } catch (error) {
      console.error('❌ ডুপ্লিকেট খুঁজতে সমস্যা:', error);
      showMessage('error', 'ডুপ্লিকেট খুঁজতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // সরাসরি মার্জ
  const handleDirectMerge = async (master, slaves) => {
    if (!hospitalId) return;
    if (!master || !master.id) {
      showMessage('error', 'মাস্টার লোকেশন সঠিক নয়!');
      return;
    }
    const slaveIds = slaves.map(s => s.id).filter(id => id);
    if (slaveIds.length === 0) {
      showMessage('error', 'কোনো স্লেভ লোকেশন নেই!');
      return;
    }
    if (!confirm(`"${master.name}" (মাস্টার) ← ${slaves.map(s => `"${s.name}"`).join(', ')} মার্জ করতে চান?`)) return;
    
    try {
      const result = await mergeLocations(hospitalId, master.id, slaveIds);
      if (result && result.success) {
        showMessage('success', `"${master.name}"-এ মার্জ সম্পন্ন!`);
        setRefreshKey(prev => prev + 1);
        setShowDuplicates(false);
        setDuplicates([]);
      } else {
        showMessage('error', 'মার্জ সম্পন্ন হয়নি!');
      }
    } catch (error) {
      console.error('❌ মার্জ ব্যর্থ:', error);
      showMessage('error', 'মার্জ ব্যর্থ: ' + error.message);
    }
  };

  const handleMerge = () => {
    setSelectedLocations([]);
    setShowMergeModal(true);
  };

  const onMergeSuccess = async () => {
    setRefreshKey(prev => prev + 1);
    showMessage('success', 'লোকেশন মার্জ সম্পন্ন হয়েছে!');
    setShowMergeModal(false);
    setSelectedLocations([]);
    setShowDuplicates(false);
    setDuplicates([]);
  };

  const handleOpenMoveModal = (location) => {
    setSelectedLocation(location);
    setShowMoveModal(true);
  };

  const handleMoveSuccess = async () => {
    setRefreshKey(prev => prev + 1);
    showMessage('success', 'রোগী স্থানান্তরিত হয়েছে!');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!hospitalId) return;
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    if (loc.patientCount > 0) {
      showMessage('error', 'এই লোকেশনে রোগী আছে, আগে রোগী মুভ করুন!');
      return;
    }
    if (!confirm(`"${loc.name}" লোকেশনটি ডিলিট করতে চান?`)) return;
    try {
      await deleteLocation(hospitalId, id);
      showMessage('success', `"${loc.name}" ডিলিট করা হয়েছে!`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      showMessage('error', 'ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  if (!isAdmin) {
    return (
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>শুধুমাত্র অ্যাডমিন লোকেশন ম্যানেজ করতে পারবেন।</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>হাসপাতাল আইডি পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#1c5fa8" /> 📍 লোকেশন ম্যানেজার
          </h3>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            মোট {locations.length} টি লোকেশন · {locations.reduce((sum, l) => sum + l.patientCount, 0)} জন রোগী
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* ✅ মাইগ্রেশন বাটন সরানো হয়েছে */}

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
              opacity: loading ? 0.6 : 1
            }}
          >
            <Search size={16} /> ডুপ্লিকেট খুঁজুন
          </button>

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
              gap: '6px'
            }}
          >
            <Merge size={16} /> মার্জ করুন
          </button>

          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
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
              gap: '6px'
            }}
          >
            <RefreshCw size={16} /> রিফ্রেশ
          </button>
        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: message.type === 'success' ? '#dcfce7' : message.type === 'info' ? '#dbeafe' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : message.type === 'info' ? '#1e40af' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : message.type === 'info' ? <AlertCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '4px 12px', maxWidth: '300px' }}>
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
              width: '100%'
            }}
          />
        </div>
      </div>

      {showDuplicates && duplicates.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: '#92400e' }}>
              ⚠️ {duplicates.length} টি ডুপ্লিকেট গ্রুপ পাওয়া গেছে!
            </span>
            <button
              onClick={() => setShowDuplicates(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400e' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ marginTop: '8px' }}>
            {duplicates.map((group, i) => (
              <div key={i} style={{ 
                padding: '8px 12px', 
                borderBottom: '1px solid #fcd34d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>
                  <strong>{group.master.name}</strong> ← {group.slaves.map(s => `"${s.name}"`).join(', ')}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                      fontWeight: '600'
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
                      fontWeight: '600'
                    }}
                  >
                    ⚡ সরাসরি মার্জ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader2 className="spin" size={24} color="#64748b" />
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
                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  {locations.length === 0 ? (
                    <div>
                      <p>📍 কোনো লোকেশন পাওয়া যায়নি</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>নতুন বুকিং করলে লোকেশন স্বয়ংক্রিয়ভাবে তৈরি হবে।</p>
                    </div>
                  ) : 'কোনো লোকেশন পাওয়া যায়নি'}
                </td></tr>
              ) : (
                filteredLocations.map(loc => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{loc.name}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        background: loc.patientCount > 0 ? '#dbeafe' : '#f1f5f9',
                        color: loc.patientCount > 0 ? '#1e40af' : '#64748b',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {loc.patientCount}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      {loc.updatedAt ? new Date(loc.updatedAt).toLocaleDateString('bn-BD') : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(loc)}
                          title="এডিট"
                          style={{
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenMoveModal(loc)}
                          title="রোগী মুভ"
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Move size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id)}
                          title="ডিলিট"
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && selectedLocation && (
        <LocationEditModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedLocation(null); }}
          location={selectedLocation}
          onSuccess={() => { setRefreshKey(prev => prev + 1); showMessage('success', 'লোকেশন আপডেট করা হয়েছে!'); }}
        />
      )}

      {showMergeModal && (
        <LocationMergeModal
          isOpen={showMergeModal}
          onClose={() => { setShowMergeModal(false); setSelectedLocations([]); }}
          locations={locations}
          preSelected={selectedLocations}
          onSuccess={onMergeSuccess}
        />
      )}

      {showMoveModal && selectedLocation && (
        <PatientMoveModal
          isOpen={showMoveModal}
          onClose={() => { setShowMoveModal(false); setSelectedLocation(null); }}
          currentLocation={selectedLocation}
          onSuccess={handleMoveSuccess}
        />
      )}
    </div>
  );
};

export default LocationManager;