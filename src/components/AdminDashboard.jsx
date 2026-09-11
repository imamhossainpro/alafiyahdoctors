// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { updateAppointmentStatus } from '../services/appointmentService';
import { subscribeToActivityLogs, logActivity, LOG_MODULES, LOG_ACTIONS } from '../services/activityLogService';

// ==================================================
// ✅ Lazy Load – প্রতিটি tab-এর component আলাদা chunk-এ load হবে
// ==================================================
const AppointmentsTable = lazy(() => import('./admin/AppointmentsTable'));
const Overview = lazy(() => import('./admin/Overview'));
const MarketingTeamManager = lazy(() => import('./admin/MarketingTeamManager'));
const MarketingReport = lazy(() => import('./admin/MarketingReport'));
const DisplaySettings = lazy(() => import('./admin/DisplaySettings'));
const LocationManager = lazy(() => import('./admin/LocationManager'));

// ==================================================
// Tab Loader – প্রতিটি tab-এর জন্য ছোট loading indicator
// ==================================================
const TabLoader = () => (
  <div style={{
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
    background: '#fff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  }}>
    <div style={{
      display: 'inline-block',
      width: '32px',
      height: '32px',
      border: '3px solid #e2e8f0',
      borderTopColor: '#1c5fa8',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ marginTop: '12px', fontSize: '14px' }}>লোড হচ্ছে...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ==================================================
// SafeArea (Error Boundary)
// ==================================================
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

// ==================================================
// Main Component
// ==================================================
export default function AdminDashboard({ user: propUser }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
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

  // ==================================================
  // ✅ Initial Load – সব ডেটা Parallel (একসাথে) load
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ Parallel requests – 3টি একসাথে
        const [apptSnap, teamSnap] = await Promise.all([
          getDocs(collection(db, 'hospitals', hospitalId, 'appointments')),
          getDoc(doc(db, 'hospitals', hospitalId, 'settings', 'marketingTeam')),
        ]);

        if (!mounted) return;

        // Appointments
        const appts = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAppointments(appts);

        // Marketing Team
        if (teamSnap.exists()) {
          setMarketingTeam(teamSnap.data().members || []);
        } else {
          setMarketingTeam([]);
        }
      } catch (err) {
        console.error('❌ Initial load error:', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();
    return () => { mounted = false; };
  }, [hospitalId]);

  // ==================================================
  // ✅ Silent Refresh – Edit/Save করার পর UI তে loading ছাড়াই refresh
  // ==================================================
  const refreshData = async () => {
    if (!hospitalId) return;
    try {
      const ref = collection(db, 'hospitals', hospitalId, 'appointments');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    } catch (err) {
      console.error('❌ Silent refresh error:', err);
    }
  };

  // ==================================================
  // ✅ Manual Refresh – loading indicator সহ
  // ==================================================
  const handleManualRefresh = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const ref = collection(db, 'hospitals', hospitalId, 'appointments');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    } catch (err) {
      console.error('❌ Refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ✅ Activity Logs – শুধু Logs ট্যাব active হলে subscribe
  // ==================================================
  useEffect(() => {
    if (!hospitalId || tab !== 'logs' || !isAdmin) return;
    setLogsLoading(true);
    const unsub = subscribeToActivityLogs(
      hospitalId,
      (logs) => {
        setActivityLogs(logs || []);
        setLogsLoading(false);
      },
      (err) => {
        console.error('❌ Activity logs error:', err);
        setLogsLoading(false);
      },
      200
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [hospitalId, tab, isAdmin]);

  // ==================================================
  // ✅ Status Change – Optimistic + Activity Log
  // ==================================================
  const handleStatusChange = async (id, newStatus) => {
    if (!hospitalId) return;
    const currentAppt = appointments.find(a => a.id === id);
    if (!currentAppt) return;

    // Optimistic update
    const updatedAppointments = appointments.map(app =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    setAppointments(updatedAppointments);

    try {
      await updateAppointmentStatus(hospitalId, id, newStatus);
      await logActivity({
        hospitalId,
        module: LOG_MODULES.BOOKING,
        action: LOG_ACTIONS.STATUS_CHANGE,
        recordId: id,
        description: `${currentAppt.name || 'Unknown'} এর status পরিবর্তন: ${currentAppt.status || 'pending'} → ${newStatus}`,
        oldValue: currentAppt.status || 'pending',
        newValue: newStatus,
        user
      });
    } catch (error) {
      console.error('Status change error:', error);
      setAppointments(appointments);
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleArchive = async () => {
    alert('আর্কাইভ ফিচার বর্তমানে নিষ্ক্রিয়');
  };
  const handleRestore = async () => {
    alert('রিস্টোর ফিচার বর্তমানে নিষ্ক্রিয়');
  };

  // ==================================================
  // Date Filter Preset
  // ==================================================
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

  // ==================================================
  // Memoized Filters
  // ==================================================
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
    if (!activityLogs || !Array.isArray(activityLogs)) return [];
    return activityLogs.filter(item => {
      if (!item.timestamp) return true;
      let logDate;
      if (item.timestamp?.seconds) logDate = new Date(item.timestamp.seconds * 1000);
      else if (typeof item.timestamp === 'string') logDate = new Date(item.timestamp);
      else logDate = new Date(item.timestamp);
      if (isNaN(logDate.getTime())) return true;
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDateStr >= startDate && logDateStr <= endDate;
    });
  }, [activityLogs, startDate, endDate]);

  // ==================================================
  // Loading / Error
  // ==================================================
  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <div style={{
          display: 'inline-block',
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#1c5fa8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '12px', fontSize: '15px' }}>📊 ডেটা লোড হচ্ছে...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#dc2626' }}>❌ Error: {error}</div>;
  }

  // ==================================================
  // Render
  // ==================================================
  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>

      {/* ===== Top Bar ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handleManualRefresh} style={{ padding: '6px 12px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

      {/* ===== Date Filter Bar ===== */}
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

      {/* ===== Tab Content (Lazy Loaded) ===== */}
      {tab === 'overview' && !showArchived && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <Overview appointments={filteredAppointments} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'appointments' && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <AppointmentsTable
              appointments={showArchived ? filteredArchived : filteredAppointments}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
              onRestore={handleRestore}
              isArchivedView={showArchived}
              user={user}
              marketingTeam={marketingTeam}
              onAppointmentsChange={refreshData}
            />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'marketing' && (isAdmin || isSubAdmin) && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            {isAdmin && <MarketingTeamManager user={user} onTeamUpdate={setMarketingTeam} />}
            <MarketingReport
              appointments={filteredAppointments}
              marketingTeam={marketingTeam}
              onTeamUpdate={setMarketingTeam}
              user={user}
            />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'display' && isAdmin && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <DisplaySettings user={user} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'locations' && isAdmin && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <LocationManager appointments={filteredAppointments} user={user} onAppointmentsChange={refreshData} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'logs' && isAdmin && (
        <SafeArea>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>📋 Activity Log</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                মোট {filteredAuditLogs.length} টি | সর্বোচ্চ ২ মাস retention
              </span>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {logsLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>লোড হচ্ছে...</div>
              ) : filteredAuditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো লগ নেই</div>
              ) : (
                filteredAuditLogs.map((log, idx) => {
                  const ts = log.timestamp?.seconds
                    ? new Date(log.timestamp.seconds * 1000)
                    : (log.timestamp ? new Date(log.timestamp) : null);
                  const actionColor = log.action === 'DELETE' ? '#dc2626'
                    : log.action === 'CREATE' || log.action === 'ASSIGN' ? '#22c55e'
                    : log.action === 'STATUS_CHANGE' ? '#0d9488'
                    : log.action === 'PATIENT_TYPE_CHANGE' ? '#8b5cf6'
                    : log.action === 'MARKETING_OFFICER_CHANGE' || log.action === 'UNASSIGN' ? '#d97706'
                    : '#1c5fa8';
                  return (
                    <div key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ color: actionColor, fontSize: '14px' }}>{log.description || log.action}</strong>
                        <small style={{ color: '#64748b' }}>{ts ? ts.toLocaleString('bn-BD') : '—'}</small>
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <span><strong>ইউজার:</strong> {log.userName || '—'}</span>
                        <span><strong>রোল:</strong> {log.userRole || '—'}</span>
                        <span><strong>মডিউল:</strong> {log.module || '—'}</span>
                        <span style={{ background: '#f1f5f9', padding: '1px 8px', borderRadius: '10px', fontSize: '11.5px', fontWeight: '600', color: actionColor }}>{log.action || '—'}</span>
                        {log.recordId && <span><strong>Record:</strong> <code style={{ fontSize: '11px' }}>{log.recordId}</code></span>}
                      </div>
                      {((log.oldValue !== null && log.oldValue !== undefined) || (log.newValue !== null && log.newValue !== undefined)) && (
                        <div style={{ fontSize: '12px', marginTop: '6px', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                          {log.oldValue !== null && log.oldValue !== undefined && (
                            <div><strong>আগে:</strong> {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : String(log.oldValue)}</div>
                          )}
                          {log.newValue !== null && log.newValue !== undefined && (
                            <div><strong>পরে:</strong> {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </SafeArea>
      )}
    </div>
  );
}