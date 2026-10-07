import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, updateDoc } from '../../firebase';
import { Search, Edit2, Save, X } from 'lucide-react';

export default function Subscriptions() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'hospitals'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHospitals(list);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const updateSubscription = async (id) => {
    await updateDoc(doc(db, 'hospitals', id), editData);
    setHospitals(hospitals.map(h => h.id === id ? { ...h, ...editData } : h));
    setEditing(null);
  };

  const getStatusColor = (status) => {
    const map = { active: '#22c55e', trial: '#f59e0b', expired: '#ef4444', suspended: '#6b7280', cancelled: '#94a3b8' };
    return map[status?.toLowerCase()] || '#64748b';
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Subscriptions</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Manage hospital subscription plans</p>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Hospital</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Plan</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Expiry</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map(h => {
              const isEditing = editing === h.id;
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid #eef2f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{h.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <select value={editData.plan || h.plan || 'Trial'} onChange={(e) => setEditData({ ...editData, plan: e.target.value })} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <option>Trial</option>
                        <option>Basic</option>
                        <option>Standard</option>
                        <option>Premium</option>
                      </select>
                    ) : (h.plan || 'Trial')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <select value={editData.subscriptionStatus || h.subscriptionStatus || 'active'} onChange={(e) => setEditData({ ...editData, subscriptionStatus: e.target.value })} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <option>active</option>
                        <option>trial</option>
                        <option>expired</option>
                        <option>suspended</option>
                        <option>cancelled</option>
                      </select>
                    ) : (
                      <span style={{ background: getStatusColor(h.subscriptionStatus || 'active') + '20', color: getStatusColor(h.subscriptionStatus || 'active'), padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        {h.subscriptionStatus || 'active'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {isEditing ? (
                      <input type="date" value={editData.subscriptionExpiry || h.subscriptionExpiry || ''} onChange={(e) => setEditData({ ...editData, subscriptionExpiry: e.target.value })} style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    ) : (h.subscriptionExpiry ? new Date(h.subscriptionExpiry).toLocaleDateString() : 'N/A')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => updateSubscription(h.id)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Save size={14} /></button>
                        <button onClick={() => setEditing(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditing(h.id); setEditData({}); }} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}