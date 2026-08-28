import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToAppointments, subscribeToArchivedAppointments, 
  updateAppointmentStatus, deleteAppointment, archiveAppointment, restoreAppointment,
  subscribeToAuditLogs, addAuditLog 
} from '../services/appointmentService';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';
import MarketingTeamManager from './admin/MarketingTeamManager';
import MarketingReport from './admin/MarketingReport';

export default function AdminDashboard({ user }) {
  const today = new Date().toISOString().split('T')[0];
  
  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  // মার্কেটিং টিম স্টেট (অবজেক্ট অ্যারে)
  const [marketingTeam, setMarketingTeam] = useState([]);

  // ডেট ফিল্টার স্টেট
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filterPreset, setFilterPreset] = useState('today');

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';

  // ফায়ারবেস থেকে ডেটা নেওয়া
  useEffect(() => {
    const unsubActive = subscribeToAppointments((data) => { 
      setAppointments(data); 
      setLoading(false); 
    });
    const unsubArchived = subscribeToArchivedAppointments((data) => setArchivedAppointments(data));
    
    if (isAdmin) {
      const unsubLogs = subscribeToAuditLogs((data) => setAuditLogs(data));
      return () => { unsubActive(); unsubArchived(); unsubLogs(); };
    } else {
      return () => { unsubActive(); unsubArchived(); };
    }
  }, [isAdmin]);

  // ---------- প্রিসেট ফিল্টার হ্যান্ডলার ----------
  const applyPreset = (preset) => {
    setFilterPreset(preset);
    const now = new Date();
    let start = new Date();
    
    switch (preset) {
      case 'today':
        start = new Date(now);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        return;
      default:
        start = new Date(now);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setFilterPreset('custom');
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setFilterPreset('custom');
  };

  // ---------- ডেট ফিল্টার লজিক ----------
  const filteredAppointments = useMemo(() => {
    return appointments.filter(item => {
      if (!item.bookingDate) return false;
      return item.bookingDate >= startDate && item.bookingDate <= endDate;
    });
  }, [appointments, startDate, endDate]);

  const filteredArchived = useMemo(() => {
    return archivedAppointments.filter(item => {
      if (!item.bookingDate) return false;
      return item.bookingDate >= startDate && item.bookingDate <= endDate;
    });
  }, [archivedAppointments, startDate, endDate]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(item => {
      if (!item.timestamp) return false;
      let logDate;
      if (item.timestamp?.seconds) {
        logDate = new Date(item.timestamp.seconds * 1000);
      } else {
        logDate = new Date(item.timestamp);
      }
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDateStr >= startDate && logDateStr <= endDate;
    });
  }, [auditLogs, startDate, endDate]);

  // ---------- হ্যান্ডলার ----------
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

  const handleRestore = async (id) => {
    const currentAppt = archivedAppointments.find(a => a.id === id);
    if (confirm('আপনি কি এই বুকিংটি আবার মেইন লিস্টে ফিরিয়ে আনতে চান?')) {
      await restoreAppointment(id);
      if (isAdmin) await addAuditLog({ action: 'restored', entityId: id, performedBy: user?.name || 'Unknown', role: user?.role, details: `${currentAppt?.name || 'Unknown'} এর বুকিং পুনরুদ্ধার করেছেন` });
    }
  };

  if (loading) return <div style={{ color: '#333', background: '#f9fafb', padding: '20px' }}>লোড হচ্ছে...</div>;

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      
      {/* ---------- টপ বার ---------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937' }}>অ্যাডমিন ড্যাশবোর্ড</h2>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowArchived(false); setTab('overview'); }} style={{ padding: '8px 16px', background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>পরিসংখ্যান</button>
          <button onClick={() => { setShowArchived(false); setTab('appointments'); }} style={{ padding: '8px 16px', background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>বুকিং লিস্ট</button>
          
          {/* মার্কেটিং রিপোর্ট ট্যাব */}
          {(isAdmin || isSubAdmin) && (
            <button onClick={() => { setShowArchived(false); setTab('marketing'); }} style={{ padding: '8px 16px', background: tab === 'marketing' ? '#1c5fa8' : '#ffffff', color: tab === 'marketing' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>মার্কেটিং রিপোর্ট</button>
          )}
          
          {isAdmin && <button onClick={() => setTab('logs')} style={{ padding: '8px 16px', background: tab === 'logs' ? '#1c5fa8' : '#ffffff', color: tab === 'logs' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Activity Log</button>}
          
          <button onClick={() => { setShowArchived(!showArchived); setTab('appointments'); }} style={{ padding: '8px 16px', background: showArchived ? '#374151' : '#ffffff', color: showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>{showArchived ? 'Active List' : 'Archived'}</button>
        </div>
      </div>

      {/* ---------- 📅 ফিল্টার সেকশন (শুধু Overview ও Appointments-এর জন্য) ---------- */}
      {(tab === 'overview' || tab === 'appointments') && (
        <div style={{ 
          background: '#ffffff', 
          padding: '15px 20px', 
          borderRadius: '10px', 
          border: '1px solid #e2e8f0', 
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* প্রিসেট বাটন */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => applyPreset('today')} 
              style={{ 
                padding: '6px 14px', 
                background: filterPreset === 'today' ? '#1c5fa8' : '#f1f5f9', 
                color: filterPreset === 'today' ? '#fff' : '#334155', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px' 
              }}
            >
              আজ
            </button>
            <button 
              onClick={() => applyPreset('week')} 
              style={{ 
                padding: '6px 14px', 
                background: filterPreset === 'week' ? '#1c5fa8' : '#f1f5f9', 
                color: filterPreset === 'week' ? '#fff' : '#334155', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px' 
              }}
            >
              গত ৭ দিন
            </button>
            <button 
              onClick={() => applyPreset('month')} 
              style={{ 
                padding: '6px 14px', 
                background: filterPreset === 'month' ? '#1c5fa8' : '#f1f5f9', 
                color: filterPreset === 'month' ? '#fff' : '#334155', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px' 
              }}
            >
              গত ১ মাস
            </button>
            <button 
              onClick={() => applyPreset('year')} 
              style={{ 
                padding: '6px 14px', 
                background: filterPreset === 'year' ? '#1c5fa8' : '#f1f5f9', 
                color: filterPreset === 'year' ? '#fff' : '#334155', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px' 
              }}
            >
              গত ১ বছর
            </button>
            <button 
              onClick={() => setFilterPreset('custom')} 
              style={{ 
                padding: '6px 14px', 
                background: filterPreset === 'custom' ? '#1c5fa8' : '#f1f5f9', 
                color: filterPreset === 'custom' ? '#fff' : '#334155', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                fontSize: '13px' 
              }}
            >
              কাস্টম
            </button>
          </div>

          {/* ডেট পিকার (শুধু কাস্টম মোডে) */}
          {filterPreset === 'custom' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px' }}>শুরু</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={handleStartDateChange} 
                  style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px' }}>শেষ</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={handleEndDateChange} 
                  style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {/* ফিল্টার ইনফো */}
          <div style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
            📅 {startDate} – {endDate}
          </div>
        </div>
      )}

      {/* ---------- কন্টেন্ট এরিয়া ---------- */}
      {tab === 'overview' && !showArchived && (
        <Overview appointments={filteredAppointments} />
      )}
      
      {tab === 'appointments' && (
        <AppointmentsTable 
          appointments={showArchived ? filteredArchived : filteredAppointments} 
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onRestore={handleRestore}
          isArchivedView={showArchived}
          user={user}
          marketingTeam={marketingTeam}
        />
      )}

      {tab === 'marketing' && (isAdmin || isSubAdmin) && (
        <>
          {/* শুধু অ্যাডমিন টিম ম্যানেজ দেখতে পাবে */}
          {isAdmin && <MarketingTeamManager user={user} onTeamUpdate={setMarketingTeam} />}
          <MarketingReport 
            appointments={filteredAppointments} 
            marketingTeam={marketingTeam}
            onTeamUpdate={setMarketingTeam}
            user={user}
          />
        </>
      )}

      {tab === 'logs' && isAdmin && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginBottom: '20px' }}>সাম্প্রতিক কার্যকলাপ (Activity Log)</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredAuditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                {auditLogs.length === 0 ? 'কোনো লগ নেই' : 'এই তারিখে কোনো লগ নেই'}
              </div>
            ) : (
              filteredAuditLogs.map((log, idx) => (
                <div key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: log.action === 'deleted' ? '#dc2626' : log.action === 'archived' ? '#d97706' : '#1c5fa8', fontSize: '14px' }}>
                      {log.details || 'Action'}
                    </strong>
                    <small style={{ color: '#64748b' }}>
                      {new Date(log.timestamp?.seconds ? log.timestamp.seconds * 1000 : log.timestamp).toLocaleString('bn-BD')}
                    </small>
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