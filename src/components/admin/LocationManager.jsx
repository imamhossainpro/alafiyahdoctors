import React, { useState, useEffect } from 'react';
import { 
  MapPin, Edit2, Trash2, Merge, Search, RefreshCw, 
  AlertCircle, CheckCircle, X, Loader2, Move 
} from 'lucide-react';
import { getAllLocations, updateLocation, deleteLocation, mergeLocations, detectDuplicateLocations } from '../../services/locationService';
import { db, collection, getDocs } from '../../firebase';
import LocationEditModal from './LocationEditModal';
import LocationMergeModal from './LocationMergeModal';
import PatientMoveModal from './PatientMoveModal';

const LocationManager = ({ appointments, user }) => {
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

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      try {
        console.log('📡 লোকেশন লোড করা শুরু...');
        const locs = await getAllLocations();
        console.log('📍 লোকেশন ডেটা:', locs);
        
        if (!locs || locs.length === 0) {
          console.warn('⚠️ কোনো লোকেশন পাওয়া যায়নি! ফায়ারবেস চেক করুন।');
          setLocations([]);
          setLoading(false);
          return;
        }

        const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
        const patientCounts = {};
        appointmentsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.locationId) {
            patientCounts[data.locationId] = (patientCounts[data.locationId] || 0) + 1;
          }
        });
        
        const locsWithCount = locs.map(loc => ({
          ...loc,
          patientCount: patientCounts[loc.id] || 0
        }));
        console.log('✅ লোকেশন কাউন্ট সহ:', locsWithCount);
        setLocations(locsWithCount);
      } catch (error) {
        console.error('❌ লোকেশন লোড এরর:', error);
        showMessage('error', 'লোকেশন লোড করতে সমস্যা হয়েছে: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, [refreshKey]);

  const handleFindDuplicates = async () => {
    const dupes = await detectDuplicateLocations();
    setDuplicates(dupes);
    setShowDuplicates(true);
    if (dupes.length === 0) {
      showMessage('success', 'কোনো ডুপ্লিকেট লোকেশন পাওয়া যায়নি!');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('আপনি কি এই লোকেশনটি ডিলিট করতে চান? এর সাথে যুক্ত রোগীদের অন্য লোকেশনে সরাতে হবে।')) return;
    try {
      const loc = locations.find(l => l.id === id);
      if (loc.patientCount > 0) {
        setSelectedLocation(loc);
        setShowMoveModal(true);
        return;
      }
      await deleteLocation(id, null);
      showMessage('success', 'লোকেশন ডিলিট করা হয়েছে!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      showMessage('error', 'ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const handleMerge = () => {
    setShowMergeModal(true);
  };

  if (!isAdmin) {
    return (
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>শুধুমাত্র অ্যাডমিন লোকেশন ম্যানেজ করতে পারবেন।</p>
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
          <button 
            onClick={handleFindDuplicates}
            style={{
              padding: '8px 16px',
              background: '#f59e0b',
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
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
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
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#78350f' }}>
            {duplicates.map((group, i) => (
              <div key={i} style={{ padding: '4px 0' }}>
                <strong>{group.master.name}</strong> ← {group.slaves.map(s => `"${s.name}"`).join(', ')}
                <button
                  onClick={() => {
                    setSelectedLocations([group.master, ...group.slaves]);
                    setShowMergeModal(true);
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 12px',
                    background: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  মার্জ করুন
                </button>
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
                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>কোনো লোকেশন পাওয়া যায়নি</td></tr>
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
                          onClick={() => {
                            setSelectedLocation(loc);
                            setShowMoveModal(true);
                          }}
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
          onSuccess={() => { setRefreshKey(prev => prev + 1); showMessage('success', 'লোকেশন মার্জ সম্পন্ন হয়েছে!'); }}
        />
      )}

      {showMoveModal && selectedLocation && (
        <PatientMoveModal
          isOpen={showMoveModal}
          onClose={() => { setShowMoveModal(false); setSelectedLocation(null); }}
          patients={appointments.filter(a => a.locationId === selectedLocation.id)}
          currentLocation={selectedLocation.name}
          onSuccess={() => { setRefreshKey(prev => prev + 1); showMessage('success', 'রোগী স্থানান্তরিত হয়েছে!'); }}
        />
      )}
    </div>
  );
};

export default LocationManager;