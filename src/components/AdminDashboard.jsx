import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToAppointments, subscribeToArchivedAppointments, updateAppointmentStatus, deleteAppointment, archiveAppointment } from '../services/appointmentService';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';

export default function AdminDashboard() {
  // আজকের তারিখ ডিফল্ট সেট করা
  const today = new Date().toISOString().split('T')[0];
  
  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [tab, setTab] = useState('overview');
  
  // ফিল্টার স্টেট - ডিফল্ট আজকের তারিখ
  const [filter, setFilter] = useState('all'); // 'today', 'week', 'month', 'all', 'custom'
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [customRange, setCustomRange] = useState({ startDate: today, endDate: today });
  
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

  // 👇 ফিল্টার লজিক (সব সেকশনের জন্য সাধারণ)
  const filterData = (data) => {
    if (filter === 'today') {
      return data.filter(item => item.bookingDate === today);
    } else if (filter === 'week') {
      const start = new Date(); start.setDate(start.getDate() - start.getDay());
      const startStr = start.toISOString().split('T')[0];
      return data.filter(item => item.bookingDate && item.bookingDate >= startStr);
    } else if (filter === 'month') {
      const start = new Date(); start.setDate(1);
      const startStr = start.toISOString().split('T')[0];
      return data.filter(item => item.bookingDate && item.bookingDate >= startStr);
    } else if (filter === 'custom') {
      return data.filter(item => item.bookingDate && item.bookingDate >= customRange.startDate && item.bookingDate <= customRange.endDate);
    }
    return data;
  };

  // Active ও Archived আলাদাভাবে ফিল্টার করা
  const filteredAppointments = useMemo(() => filterData(appointments), [appointments, filter, customRange, today]);
  const filteredArchived = useMemo(() => filterData(archivedAppointments), [archivedAppointments, filter, customRange, today]);

  // View Switching Handlers
  const showOverview = () => { setShowArchived(false); setTab('overview'); };
  const showAppointments = () => { setShowArchived(false); setTab('appointments'); };
  const showArchivedList = () => { setShowArchived(true); setTab('appointments'); };

  if (loading) return <div style={{ color: '#333', background: '#f9fafb', padding: '20px' }}>লোড হচ্ছে...</div>;

  const currentTableData = showArchived ? filteredArchived : filteredAppointments;

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937' }}>অ্যাডমিন ড্যাশবোর্ড</h2>

        {/* ফিল্টার বাটন ও ডেট পিকার */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['today', 'week', 'month', 'all'].map((f) => (
            <button 
              key={f}
              onClick={() => { setFilter(f); }}
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
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ padding: '6px', border: 'none', fontSize: '13px', outline: 'none', color: '#334155', background: '#ffffff', colorScheme: 'light' }} 
            />
            <span style={{ color: '#64748b' }}>-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={{ padding: '6px', border: 'none', fontSize: '13px', outline: 'none', color: '#334155', background: '#ffffff', colorScheme: 'light' }} 
            />
            <button 
              onClick={() => { setCustomRange({ startDate, endDate }); setFilter('custom'); }} 
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

      {/* পরিসংখ্যানে ফিল্টার করা Active ডেটা পাঠানো হবে */}
      {tab === 'overview' && !showArchived && <Overview appointments={filteredAppointments} />}
      
      {/* বুকিং লিস্ট ও আর্কাইভে ফিল্টার করা ডেটা পাঠানো হবে */}
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