import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToAppointments, subscribeToArchivedAppointments, 
  updateAppointmentStatus, deleteAppointment, archiveAppointment, restoreAppointment,
  subscribeToAuditLogs, addAuditLog 
} from '../services/appointmentService';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';

export default function AdminDashboard({ user }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState('overview'); // 'overview', 'appointments', 'logs'
  
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [customRange, setCustomRange] = useState({ startDate: today, endDate: today });
  
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';
  const canEdit = isAdmin || isSubAdmin;

  useEffect(() => {
    const unsubActive = subscribeToAppointments((data) => { setAppointments(data); setLoading(false); });
    const unsubArchived = subscribeToArchivedAppointments((data) => setArchivedAppointments(data));
    
    if (isAdmin) {
      const unsubLogs = subscribeToAuditLogs((data) => setAuditLogs(data));
      return () => { unsubActive(); unsubArchived(); unsubLogs(); };
    } else {
      return () => { unsubActive(); unsubArchived(); };
    }
  }, [isAdmin]);

  const handleStatusChange = async (id, newStatus) => {
    const currentAppt = appointments.find(a => a.id === id);
    if (newStatus === 'PERMANENT_DELETE') {
      if (confirm('আপনি কি নিশ্চিত এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
        await deleteAppointment(id);
        if (isAdmin) await addAuditLog({ action: 'deleted', entityId: id, performedBy: user?.name || 'Unknown', role: user?.role, details: `রোগী ${currentAppt?.name || 'Unknown'} স্থায়ীভাবে ডিলিট করেছেন` });
      }
    } else {
      await updateAppointmentStatus(id, newStatus);
      if (isAdmin) await addAuditLog({ action: 'status_changed', entityId: id, performedBy: user?.name || 'Unknown', role: user?.role, oldStatus: currentAppt?.status || 'Unknown', newStatus, details: `${currentAppt?.name || 'Unknown'} এর স্ট্যাটাস ${currentAppt?.status || 'Unknown'} থেকে ${newStatus} এ পরিবর্তন করেছেন` });
    }
  };

  const handleArchive = async (id) => {
    const currentAppt = appointments.find(a => a.id === id);
    if (confirm('আপনি কি এই রেকর্ডটি আর্কাইভ করতে চান?')) {
      await archiveAppointment(id);
      if (isAdmin) await addAuditLog({ action: 'archived', entityId: id, performedBy: user?.name || 'Unknown', role: user?.role, details: `${currentAppt?.name || 'Unknown'} এর বুকিং আর্কাইভ করেছেন` });
    }
  };

  // 🆕 নতুন: Restore হ্যান্ডলার
  const handleRestore = async (id) => {
    const currentAppt = archivedAppointments.find(a => a.id === id);
    if (confirm('আপনি কি এই বুকিংটি আবার মেইন লিস্টে ফিরিয়ে আনতে চান?')) {
      await restoreAppointment(id);
      if (isAdmin) await addAuditLog({ action: 'restored', entityId: id, performedBy: user?.name || 'Unknown', role: user?.role, details: `${currentAppt?.name || 'Unknown'} এর বুকিং পুনরুদ্ধার করেছেন` });
    }
  };

  const filterData = (data) => {
    if (filter === 'today') return data.filter(item => item.bookingDate === today);
    else if (filter === 'week') {
      const start = new Date(); start.setDate(start.getDate() - start.getDay());
      return data.filter(item => item.bookingDate && item.bookingDate >= start.toISOString().split('T')[0]);
    }
    else if (filter === 'month') {
      const start = new Date(); start.setDate(1);
      return data.filter(item => item.bookingDate && item.bookingDate >= start.toISOString().split('T')[0]);
    }
    else if (filter === 'custom') {
      return data.filter(item => item.bookingDate && item.bookingDate >= customRange.startDate && item.bookingDate <= customRange.endDate);
    }
    return data;
  };

  const filteredAppointments = useMemo(() => filterData(appointments), [appointments, filter, customRange, today]);
  const filteredArchived = useMemo(() => filterData(archivedAppointments), [archivedAppointments, filter, customRange, today]);

  if (loading) return <div style={{ color: '#333', background: '#f9fafb', padding: '20px' }}>লোড হচ্ছে...</div>;

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937' }}>অ্যাডমিন ড্যাশবোর্ড</h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setShowArchived(false); setTab('overview'); }} style={{ padding: '8px 16px', background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>পরিসংখ্যান</button>
          <button onClick={() => { setShowArchived(false); setTab('appointments'); }} style={{ padding: '8px 16px', background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>বুকিং লিস্ট</button>
          
          {isAdmin && <button onClick={() => setTab('logs')} style={{ padding: '8px 16px', background: tab === 'logs' ? '#1c5fa8' : '#ffffff', color: tab === 'logs' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Activity Log</button>}
          
          <button onClick={() => { setShowArchived(true); setTab('appointments'); }} style={{ padding: '8px 16px', background: showArchived ? '#374151' : '#ffffff', color: showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>{showArchived ? 'Active List' : 'Archived'}</button>
        </div>
      </div>

      {tab === 'overview' && !showArchived && <Overview appointments={filteredAppointments} />}
      
      {tab === 'appointments' && (
        <AppointmentsTable 
          appointments={showArchived ? filteredArchived : filteredAppointments} 
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onRestore={handleRestore} // 👈 Restore প্রপ পাঠানো হয়েছে
          isArchivedView={showArchived}
          user={user} 
        />
      )}

      {tab === 'logs' && isAdmin && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px' }}>সাম্প্রতিক কার্যকলাপ (Activity Log)</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো লগ নেই</div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: log.action === 'deleted' ? '#dc2626' : log.action === 'archived' ? '#d97706' : '#1c5fa8', fontSize: '14px' }}>
                      {log.details || 'Action'}
                    </strong>
                    <small style={{ color: '#64748b' }}>{new Date(log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleString('bn-BD')}</small>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    <span style={{ fontWeight: '700' }}>{log.performedBy}</span> ({log.role})
                    {log.oldStatus && log.newStatus && <span> | পুরনো: {log.oldStatus} → নতুন: {log.newStatus}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}