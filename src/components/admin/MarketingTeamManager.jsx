import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, setDoc } from '../../firebase';
import { Plus, Edit2, Trash2, UserCheck, UserX, Calendar, Shield } from 'lucide-react';

export default function MarketingTeamManager({ user, onTeamUpdate }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: 'মার্কেটিং অফিসার',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const docRef = doc(db, 'master', 'marketingTeam');
      const docSnap = await getDoc(docRef);
      let teamData = [];
      if (docSnap.exists()) {
        teamData = docSnap.data().members || [];
      } else {
        teamData = [
          { id: '1', name: 'আরিফ', designation: 'মার্কেটিং অফিসার', status: 'active', joinDate: '2025-01-01' },
          { id: '2', name: 'সাবরিনা', designation: 'মার্কেটিং অফিসার', status: 'active', joinDate: '2025-01-15' }
        ];
        await setDoc(docRef, { members: teamData });
      }
      setTeam(teamData);
      if (onTeamUpdate) onTeamUpdate(teamData);
    } catch (error) {
      console.error('Team load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTeam = async (updatedTeam) => {
    try {
      await setDoc(doc(db, 'master', 'marketingTeam'), { members: updatedTeam });
      setTeam(updatedTeam);
      if (onTeamUpdate) onTeamUpdate(updatedTeam);
    } catch (error) {
      console.error('Save error:', error);
      alert('সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন নতুন অফিসার যোগ করতে পারবেন।');
      return;
    }
    setEditingOfficer(null);
    setFormData({
      name: '',
      designation: 'মার্কেটিং অফিসার',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEdit = (officer) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন অফিসার সম্পাদনা করতে পারবেন।');
      return;
    }
    setEditingOfficer(officer);
    setFormData({
      name: officer.name,
      designation: officer.designation || 'মার্কেটিং অফিসার',
      status: officer.status || 'active',
      joinDate: officer.joinDate || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন অফিসার ডিলিট করতে পারবেন।');
      return;
    }
    if (!confirm('আপনি কি এই অফিসারকে ডিলিট করতে চান?')) return;
    const updated = team.filter(m => m.id !== id);
    await saveTeam(updated);
  };

  const toggleStatus = async (id) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারবেন।');
      return;
    }
    const officer = team.find(m => m.id === id);
    if (!officer) return;
    const updated = team.map(m => 
      m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
    );
    await saveTeam(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('অফিসারের নাম লিখুন');
      return;
    }

    let updatedTeam;
    if (editingOfficer) {
      updatedTeam = team.map(m => 
        m.id === editingOfficer.id ? { ...m, ...formData } : m
      );
    } else {
      const newOfficer = {
        id: Date.now().toString(),
        ...formData
      };
      updatedTeam = [...team, newOfficer];
    }
    
    await saveTeam(updatedTeam);
    setShowModal(false);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>;

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#1c5fa8" /> 👥 মার্কেটিং টিম ম্যানেজমেন্ট
          </h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {isAdmin ? '✅ আপনি অ্যাডমিন। আপনি অফিসার যোগ, সম্পাদনা ও ডিলিট করতে পারবেন।' : '🔒 শুধুমাত্র অ্যাডমিন অফিসার ম্যানেজ করতে পারবেন।'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleAdd}
            style={{ 
              padding: '10px 20px', 
              background: '#1c5fa8', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} /> নতুন অফিসার যোগ করুন
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '16px' 
      }}>
        {team.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '30px' }}>
            এখনো কোনো মার্কেটিং অফিসার যোগ করা হয়নি।
          </div>
        ) : (
          team.map((officer) => (
            <div 
              key={officer.id}
              style={{ 
                border: `1px solid ${officer.status === 'active' ? '#bbf7d0' : '#fee2e2'}`,
                borderRadius: '12px',
                padding: '16px',
                background: officer.status === 'active' ? '#f0fdf4' : '#fef2f2',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                right: '12px',
                background: officer.status === 'active' ? '#22c55e' : '#ef4444',
                color: '#fff',
                padding: '2px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {officer.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>
                {officer.name}
              </h4>

              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>
                {officer.designation || 'মার্কেটিং অফিসার'}
              </p>

              {officer.joinDate && (
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> যোগদান: {officer.joinDate}
                </p>
              )}

              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button 
                    key={`status-${officer.id}`}
                    onClick={() => toggleStatus(officer.id)}
                    style={{
                      padding: '6px 14px',
                      background: officer.status === 'active' ? '#f59e0b' : '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {officer.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                    {officer.status === 'active' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>
                  <button 
                    key={`edit-${officer.id}`}
                    onClick={() => handleEdit(officer)}
                    style={{
                      padding: '6px 14px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={14} /> সম্পাদনা
                  </button>
                  <button 
                    key={`delete-${officer.id}`}
                    onClick={() => handleDelete(officer.id)}
                    style={{
                      padding: '6px 14px',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={14} /> ডিলিট
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            padding: '30px',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            <h3 style={{ marginTop: 0, color: '#1c5fa8' }}>
              {editingOfficer ? 'অফিসার সম্পাদনা করুন' : 'নতুন অফিসার যোগ করুন'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                  অফিসারের নাম *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="যেমন: আরিফ হোসেন"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                  ডেসিগনেশন
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="যেমন: সিনিয়র মার্কেটিং অফিসার"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                  যোগদানের তারিখ
                </label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '5px' }}>
                  স্ট্যাটাস
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="active">সক্রিয়</option>
                  <option value="inactive">নিষ্ক্রিয়</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 24px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#334155'
                  }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    background: '#1c5fa8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {editingOfficer ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}