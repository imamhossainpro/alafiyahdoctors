import React, { useState, useEffect } from 'react';
import { subscribeToAppointments, subscribeToArchivedAppointments, updateAppointmentStatus, deleteAppointment, archiveAppointment } from '../services/appointmentService';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubActive = subscribeToAppointments((data) => {
      setAppointments(data);
      setLoading(false);
    });
    const unsubArchived = subscribeToArchivedAppointments((data) => {
      setArchivedAppointments(data);
    });
    return () => { unsubActive(); unsubArchived(); };
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'PERMANENT_DELETE') {
      if (confirm('আপনি কি নিশ্চিত এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
        await deleteAppointment(id);
      }
    } else {
      await updateAppointmentStatus(id, newStatus);
    }
  };

  const handleArchive = async (id) => {
    if (confirm('আপনি কি এই রেকর্ডটি আর্কাইভ করতে চান?')) {
      await archiveAppointment(id);
    }
  };

  // UI স্যুইচ করার জন্য হ্যান্ডলার
  const showOverview = () => {
    setShowArchived(false);
    setTab('overview');
  };

  const showAppointments = () => {
    setShowArchived(false);
    setTab('appointments');
  };

  const showArchivedList = () => {
    setShowArchived(true);
    setTab('appointments'); // আর্কাইভ দেখালে সবসময় টেবিল লিস্ট দেখাবে
  };

  if (loading) return <div style={{ color: '#333', background: '#f9fafb', padding: '20px' }}>লোড হচ্ছে...</div>;

  const currentTableData = showArchived ? archivedAppointments : appointments;

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937' }}>অ্যাডমিন ড্যাশবোর্ড</h2>

        {/* ফিল্টার বাটন */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['today', 'week', 'month', 'all'].map((f) => (
            <button 
              key={f}
              onClick={() => { setFilter(f); setCustomRange({ startDate: '', endDate: '' }); }}
              style={{ 
                padding: '8px 16px', 
                background: filter === f && !showArchived ? '#1c5fa8' : '#ffffff', 
                color: filter === f && !showArchived ? '#ffffff' : '#333333', 
                border: '1px solid #e2e8f0',
                borderRadius: '20px', 
                cursor: 'pointer', 
                fontWeight: '600',
                fontSize: '13px'
              }}
            >{f === 'today' ? 'আজ' : f === 'week' ? 'এই সপ্তাহ' : f === 'month' ? 'এই মাস' : 'সব'}</button>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ffffff', padding: '5px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <input 
              type="date" 
              value={customRange.startDate} 
              onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })} 
              style={{ padding: '6px', border: 'none', fontSize: '13px', outline: 'none', color: '#334155', background: '#ffffff', colorScheme: 'light' }} 
            />
            <span style={{ color: '#64748b' }}>-</span>
            <input 
              type="date" 
              value={customRange.endDate} 
              onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })} 
              style={{ padding: '6px', border: 'none', fontSize: '13px', outline: 'none', color: '#334155', background: '#ffffff', colorScheme: 'light' }} 
            />
            <button 
              onClick={() => setFilter('custom')} 
              style={{ background: filter === 'custom' ? '#d97706' : '#1c5fa8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
            >Apply</button>
          </div>
        </div>

        {/* ডান পাশের ট্যাব বাটন */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={showArchivedList}
            style={{ 
              padding: '8px 16px', 
              background: showArchived ? '#374151' : '#ffffff', 
              color: showArchived ? '#ffffff' : '#333333', 
              border: '1px solid #e2e8f0', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >{showArchived ? 'Active List' : 'Archived List'}</button>

          <button onClick={showOverview} style={{ padding: '8px 16px', background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer' }}>পরিসংখ্যান</button>
          <button onClick={showAppointments} style={{ padding: '8px 16px', background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer' }}>বুকিং লিস্ট</button>
        </div>
      </div>

      {/* কনটেন্ট রেন্ডারিং - ফাঁকা জায়গা রোধ করতে শর্ত ঠিক করা হয়েছে */}
      {tab === 'overview' && !showArchived && <Overview appointments={appointments} filter={filter} customRange={customRange} />}
      
      {tab === 'appointments' && (
        <AppointmentsTable 
          appointments={currentTableData} 
          onStatusChange={handleStatusChange}
          onArchive={handleArchive} 
          isArchivedView={showArchived}
        />
      )}
    </div>
  );
}