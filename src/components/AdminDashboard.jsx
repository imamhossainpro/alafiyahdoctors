// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import AppointmentsTable from './admin/AppointmentsTable';
import Overview from './admin/Overview';
import MarketingTeamManager from './admin/MarketingTeamManager';
import MarketingReport from './admin/MarketingReport';
import DisplaySettings from './admin/DisplaySettings';
import LocationManager from './admin/LocationManager';
import { RefreshCw } from 'lucide-react';
import { updateAppointmentStatus, addAuditLog } from '../services/appointmentService';

// SafeArea (Error Boundary)
class SafeArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: '20px', color: '#dc2626' }}>⚠️ এই অংশ লোড করতে সমস্যা হয়েছে</div>;
    }
    return this.props.children;
  }
}

export default function AdminDashboard({ user: propUser }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [showArchived, setShowArchived] = useState(false);
  const [marketingTeam, setMarketingTeam] = useState([]);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2030-12-31');
  const [filterPreset, setFilterPreset] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';

  // ✅ ডেটা ফেচ – সরাসরি getDocs, কোনো orderBy নেই
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Fetching from: hospitals/', hospitalId, '/appointments');
      const ref = collection(db, 'hospitals', hospitalId, 'appointments');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('✅ Fetched appointments:', data.length);
      if (data.length > 0) {
        console.log('📄 প্রথম ডকুমেন্টের ফিল্ডসমূহ:', Object.keys(data[0]));
      }
      setAppointments(data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ রিফ্রেশ ফাংশন
  const refreshData = () => fetchAppointments();

  useEffect(() => {
    fetchAppointments();
  }, [hospitalId]);

  // ✅ স্ট্যাটাস পরিবর্তন (অপটিমিস্টিক আপডেট)
  const handleStatusChange = async (id, newStatus) => {
    if (!hospitalId) return;
    const currentAppt = appointments.find(a => a.id === id);
    if (!currentAppt) return;

    // ১. স্থানীয় স্টেট আপডেট (UI তে সাথে সাথে পরিবর্তন)
    const updatedAppointments = appointments.map(app =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setAppointments(updatedAppointments);

    try {
      // ২. Firestore আপডেট
      await updateAppointmentStatus(hospitalId, id, newStatus);
      if (isAdmin) {
        await addAuditLog(hospitalId, {
          action: 'status_changed',
          entityId: id,
          performedBy: user?.name || 'Unknown',
          role: user?.role,
          oldStatus: currentAppt.status || 'Unknown',
          newStatus,
          details: `${currentAppt.name || 'Unknown'} এর স্ট্যাটাস ${currentAppt.status || 'Unknown'} থেকে ${newStatus} এ পরিবর্তন`
        });
      }
    } catch (error) {
      console.error('Status change error:', error);
      // ব্যর্থ হলে পূর্বের স্টেট ফিরিয়ে দিন
      setAppointments(appointments);
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleArchive = async (id) => {
    alert('আর্কাইভ ফিচার বর্তমানে নিষ্ক্রিয়');
  };
  const handleRestore = async (id) => {
    alert('রিস্টোর ফিচার বর্তমানে নিষ্ক্রিয়');
  };

  // ফিল্টার প্রিসেট
  const applyPreset = (preset) => {
    setFilterPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    switch (preset) {
      case 'all':
        setStartDate('2020-01-01');
        setEndDate('2030-12-31');
        break;
      case 'today':
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'month': {
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'year': {
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'custom':
        return;
      default:
        setStartDate('2020-01-01');
        setEndDate('2030-12-31');
    }
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setFilterPreset('custom');
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setFilterPreset('custom');
  };

  const filteredAppointments = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return [];
    return appointments.filter(item => {
      if (!item.bookingDate) return false;
      return item.bookingDate >= startDate && item.bookingDate <= endDate;
    });
  }, [appointments, startDate, endDate]);

  const filteredArchived = useMemo(() => {
    if (!archivedAppointments || !Array.isArray(archivedAppointments)) return [];
    return archivedAppointments.filter(item => {
      if (!item.bookingDate) return false;
      return item.bookingDate >= startDate && item.bookingDate <= endDate;
    });
  }, [archivedAppointments, startDate, endDate]);

  const filteredAuditLogs = useMemo(() => {
    if (!auditLogs || !Array.isArray(auditLogs)) return [];
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

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>📊 ডেটা লোড হচ্ছে...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#dc2626' }}>❌ Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={refreshData} style={{ padding: '6px 12px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> রিফ্রেশ
          </button>
          <button onClick={() => { setShowArchived(false); setTab('overview'); }} style={{ padding: '8px 16px', background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>পরিসংখ্যান</button>
          <button onClick={() => { setShowArchived(false); setTab('appointments'); }} style={{ padding: '8px 16px', background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>বুকিং লিস্ট</button>
          {(isAdmin || isSubAdmin) && (
            <button onClick={() => { setShowArchived(false); setTab('marketing'); }} style={{ padding: '8px 16px', background: tab === 'marketing' ? '#1c5fa8' : '#ffffff', color: tab === 'marketing' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>মার্কেটিং রিপোর্ট</button>
          )}
          {isAdmin && (
            <>
              <button onClick={() => { setShowArchived(false); setTab('display'); }} style={{ padding: '8px 16px', background: tab === 'display' ? '#1c5fa8' : '#ffffff', color: tab === 'display' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>📺 ডিসপ্লে সেটিংস</button>
              <button onClick={() => { setShowArchived(false); setTab('locations'); }} style={{ padding: '8px 16px', background: tab === 'locations' ? '#1c5fa8' : '#ffffff', color: tab === 'locations' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>📍 লোকেশন ম্যানেজার</button>
              <button onClick={() => setTab('logs')} style={{ padding: '8px 16px', background: tab === 'logs' ? '#1c5fa8' : '#ffffff', color: tab === 'logs' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Activity Log</button>
            </>
          )}
          <button onClick={() => { setShowArchived(!showArchived); setTab('appointments'); }} style={{ padding: '8px 16px', background: showArchived ? '#374151' : '#ffffff', color: showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>{showArchived ? 'Active List' : 'Archived'}</button>
        </div>
      </div>

      {(tab === 'overview' || tab === 'appointments') && (
        <div style={{ background: '#ffffff', padding: '15px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => applyPreset('all')} style={{ padding: '6px 14px', background: filterPreset === 'all' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'all' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>সব</button>
            <button onClick={() => applyPreset('today')} style={{ padding: '6px 14px', background: filterPreset === 'today' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'today' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>আজ</button>
            <button onClick={() => applyPreset('week')} style={{ padding: '6px 14px', background: filterPreset === 'week' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'week' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>গত ৭ দিন</button>
            <button onClick={() => applyPreset('month')} style={{ padding: '6px 14px', background: filterPreset === 'month' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'month' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>গত ১ মাস</button>
            <button onClick={() => applyPreset('year')} style={{ padding: '6px 14px', background: filterPreset === 'year' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'year' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>গত ১ বছর</button>
            <button onClick={() => setFilterPreset('custom')} style={{ padding: '6px 14px', background: filterPreset === 'custom' ? '#1c5fa8' : '#f1f5f9', color: filterPreset === 'custom' ? '#fff' : '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>কাস্টম</button>
          </div>
          {filterPreset === 'custom' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px' }}>শুরু</label>
                <input type="date" value={startDate} onChange={handleStartDateChange} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '2px' }}>শেষ</label>
                <input type="date" value={endDate} onChange={handleEndDateChange} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }} />
              </div>
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>📅 {startDate} – {endDate}</div>
        </div>
      )}

      {tab === 'overview' && !showArchived && (
        <Overview appointments={filteredAppointments} />
      )}

      {tab === 'appointments' && (
        <SafeArea>
          <AppointmentsTable
            appointments={showArchived ? filteredArchived : filteredAppointments}
            onStatusChange={handleStatusChange}
            onArchive={handleArchive}
            onRestore={handleRestore}
            isArchivedView={showArchived}
            user={user}
            marketingTeam={marketingTeam}
          />
        </SafeArea>
      )}

      {tab === 'marketing' && (isAdmin || isSubAdmin) && (
        <SafeArea>
          <>
            {isAdmin && <MarketingTeamManager user={user} onTeamUpdate={setMarketingTeam} />}
            <MarketingReport
              appointments={filteredAppointments}
              marketingTeam={marketingTeam}
              onTeamUpdate={setMarketingTeam}
              user={user}
            />
          </>
        </SafeArea>
      )}

      {tab === 'display' && isAdmin && (
        <SafeArea>
          <DisplaySettings user={user} />
        </SafeArea>
      )}

      {tab === 'locations' && isAdmin && (
        <SafeArea>
          <LocationManager appointments={filteredAppointments} user={user} />
        </SafeArea>
      )}

      {tab === 'logs' && isAdmin && (
        <SafeArea>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3>সাম্প্রতিক কার্যকলাপ (Activity Log)</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {filteredAuditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো লগ নেই</div>
              ) : (
                filteredAuditLogs.map((log, idx) => (
                  <div key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: log.action === 'deleted' ? '#dc2626' : log.action === 'archived' ? '#d97706' : '#1c5fa8', fontSize: '14px' }}>{log.details || 'Action'}</strong>
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
        </SafeArea>
      )}
    </div>
  );
}