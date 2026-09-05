import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs, doc, updateDoc, deleteDoc } from '../../firebase';
import { Search, Eye, Edit2, Power, PowerOff, Trash2, Users as UsersIcon } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export default function Hospitals() {
  const navigate = useNavigate();
  const { switchHospital } = useHospital();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const loadHospitals = async () => {
    try {
      const snap = await getDocs(collection(db, 'hospitals'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Get counts for each hospital
      for (const h of list) {
        const userSnap = await getDocs(collection(db, 'hospitals', h.id, 'users'));
        h.userCount = userSnap.size;
        const deptSnap = await getDocs(collection(db, 'hospitals', h.id, 'departments'));
        let doctors = 0;
        deptSnap.docs.forEach(d => {
          const data = d.data();
          if (data.doctors) doctors += data.doctors.length;
        });
        h.doctorCount = doctors;
        const apptSnap = await getDocs(collection(db, 'hospitals', h.id, 'appointments'));
        h.bookingCount = apptSnap.size;
      }
      setHospitals(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHospitals(); }, []);

  const toggleStatus = async (id, current) => {
    await updateDoc(doc(db, 'hospitals', id), { isActive: !current });
    loadHospitals();
  };

  const handleView = (id) => {
    switchHospital(id);
    navigate(`/super-admin/hospitals/${id}`);
  };

  const filtered = hospitals.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading hospitals...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Hospitals</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Manage all registered hospitals</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '220px' }}
            />
          </div>
          <button onClick={loadHospitals} style={{ padding: '8px 16px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Users</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Doctors</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Bookings</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No hospitals found</td></tr>
            ) : (
              filtered.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #eef2f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{h.name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#64748b' }}>{h.id}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{h.userCount || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{h.doctorCount || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>{h.bookingCount || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: h.isActive !== false ? '#dcfce7' : '#fee2e2',
                      color: h.isActive !== false ? '#166534' : '#991b1b'
                    }}>
                      {h.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => handleView(h.id)} title="View" style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Eye size={14} /></button>
                      <button onClick={() => toggleStatus(h.id, h.isActive)} title={h.isActive !== false ? 'Deactivate' : 'Activate'} style={{ background: h.isActive !== false ? '#fef3c7' : '#dcfce7', color: h.isActive !== false ? '#92400e' : '#166534', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                        {h.isActive !== false ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                      <button title="Edit" style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}