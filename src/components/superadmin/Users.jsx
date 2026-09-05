import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc } from '../../firebase';
import { Search, CheckCircle, XCircle, Edit2 } from 'lucide-react';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hospitals, setHospitals] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        // Load all hospitals for name mapping
        const hSnap = await getDocs(collection(db, 'hospitals'));
        const hMap = {};
        hSnap.docs.forEach(d => { hMap[d.id] = d.data().name; });
        setHospitals(hMap);

        const uSnap = await getDocs(collection(db, 'users'));
        const list = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(list);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const updateUser = async (id, field, value) => {
    await updateDoc(doc(db, 'users', id), { [field]: value });
    setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Users</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Manage users across all hospitals</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '8px 12px 8px 36px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '220px' }} />
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Hospital</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eef2f6' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.name || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>{hospitals[u.hospitalId] || u.hospitalId || 'N/A'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select value={u.role || 'viewer'} onChange={(e) => updateUser(u.id, 'role', e.target.value)} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="pending">Pending</option>
                    <option value="admin">Admin</option>
                    <option value="sub-admin">Sub Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: u.approved ? '#dcfce7' : '#fef3c7', color: u.approved ? '#166534' : '#92400e' }}>
                    {u.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button onClick={() => updateUser(u.id, 'approved', !u.approved)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: u.approved ? '#dc2626' : '#22c55e' }}>
                    {u.approved ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}