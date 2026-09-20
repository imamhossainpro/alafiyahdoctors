// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { OverviewSkeleton } from './ui/SkeletonScreens';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { RefreshCw, Shield } from 'lucide-react';
import {
  updateAppointmentStatus,
  archiveAppointment,
  restoreAppointment,
  permanentlyDeleteArchived,
} from '../services/appointmentService';
import {
  subscribeToActivityLogs,
  logActivity,
  LOG_MODULES,
  LOG_ACTIONS,
} from '../services/activityLogService';

// ==================================================
// ✅ Lazy Load Components
// ==================================================
const AppointmentsTable = lazy(() => import('./admin/AppointmentsTable'));
const Overview = lazy(() => import('./admin/Overview'));
const MarketingTeamManager = lazy(() => import('./admin/MarketingTeamManager'));
const MarketingReport = lazy(() => import('./admin/MarketingReport'));
const DisplaySettings = lazy(() => import('./admin/DisplaySettings'));
const LocationManager = lazy(() => import('./admin/LocationManager'));
const UserAccessManager = lazy(() => import('./admin/UserAccessManager'));

// ==================================================
// ✅ Tab Loader
// ==================================================
const TabLoader = () => (
  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#1c5fa8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ marginTop: '12px', fontSize: '14px' }}>লোড হচ্ছে...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ==================================================
// ✅ SafeArea (Error Boundary)
// ==================================================
class SafeArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#dc2626' }}>
          ⚠️ এই অংশ লোড করতে সমস্যা হয়েছে
        </div>
      );
    }
    return this.props.children;
  }
}

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function AdminDashboard({ user: propUser }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const { can } = usePermission();

  const [appointments, setAppointments] = useState([]);
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

  // ==================================================
  // ✅ Initial Load – Marketing Team
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    let mounted = true;
    setLoading(true);

    const loadAll = async () => {
      try {
        const teamRef = doc(db, 'hospitals', hospitalId, 'settings', 'marketingTeam');
        const teamSnap = await getDoc(teamRef);
        if (mounted && teamSnap.exists()) {
          setMarketingTeam(teamSnap.data().members || []);
        }
      } catch (err) {
        console.error('❌ Load error:', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // ==================================================
  // ✅ Real-time Appointments
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    const ref = collection(db, 'hospitals', hospitalId, 'appointments');
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAppointments(data);
      },
      (err) => {
        console.error('Appointments listener error:', err);
      }
    );
    return () => unsub();
  }, [hospitalId]);

  // ==================================================
  // ✅ Silent Refresh
  // ==================================================
  const refreshData = async () => {
    if (!hospitalId) return;
    try {
      const ref = collection(db, 'hospitals', hospitalId, 'appointments');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    } catch (err) {
      console.error('❌ Silent refresh error:', err);
    }
  };

  // ==================================================
  // ✅ Activity Logs – শুধু logs tab active হলে
  // ==================================================
  useEffect(() => {
    if (!hospitalId || tab !== 'logs' || !can('activity_log.view')) return;
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
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, tab, can]);

  // ==================================================
  // ✅ Status Change
  // ==================================================
  const handleStatusChange = async (id, newStatus) => {
    if (!hospitalId) return;
    if (!can('booking.status_change')) {
      alert('❌ আপনার status পরিবর্তন করার permission নেই।');
      return;
    }
    const currentAppt = appointments.find((a) => a.id === id);
    if (!currentAppt) return;

    const updatedAppointments = appointments.map((app) =>
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
        user,
      });
    } catch (error) {
      console.error('Status change error:', error);
      setAppointments(appointments);
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  // ==================================================
  // ✅ ARCHIVE
  // ==================================================
  const handleArchive = async (appointmentId) => {
    if (!can('booking.archive')) {
      alert('❌ আপনার আর্কাইভ করার permission নেই।');
      return;
    }
    if (!window.confirm('আপনি কি এই booking-টি archive করতে চান?')) return;

    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;

    try {
      await archiveAppointment(hospitalId, appointmentId, user);
      await logActivity({
        hospitalId,
        module: LOG_MODULES.BOOKING,
        action: 'BOOKING_ARCHIVED',
        recordId: appointmentId,
        description: `বুকিং আর্কাইভ করা হয়েছে: ${appt.name || 'Unknown'} (সিরিয়াল ${appt.serialNo || '-'})`,
        oldValue: { isArchived: false },
        newValue: { isArchived: true },
        user,
      });
      // Real-time listener auto-update করবে
    } catch (err) {
      console.error('Archive error:', err);
      alert('আর্কাইভ করতে সমস্যা হয়েছে।');
    }
  };

  // ==================================================
  // ✅ RESTORE
  // ==================================================
  const handleRestore = async (appointmentId) => {
    if (!can('archive.restore')) {
      alert('❌ আপনার restore permission নেই।');
      return;
    }
    if (
      !window.confirm('এই booking-টি আবার Booking List-এ ফিরিয়ে আনতে চান?')
    )
      return;

    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;

    try {
      await restoreAppointment(hospitalId, appointmentId, user);
      await logActivity({
        hospitalId,
        module: LOG_MODULES.BOOKING,
        action: 'BOOKING_RESTORED',
        recordId: appointmentId,
        description: `বুকিং restore করা হয়েছে: ${appt.name || 'Unknown'} (সিরিয়াল ${appt.serialNo || '-'})`,
        oldValue: { isArchived: true },
        newValue: { isArchived: false },
        user,
      });
      alert('✅ Booking successfully restored');
    } catch (err) {
      console.error('Restore error:', err);
      alert('Restore করতে সমস্যা হয়েছে।');
    }
  };

  // ==================================================
  // ✅ PERMANENT DELETE
  // ==================================================
  const handlePermanentDelete = async (appointmentId) => {
    if (!can('archive.delete')) {
      alert('❌ আপনার permanent delete permission নেই।');
      return;
    }

    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;

    if (!window.confirm('এই booking-টি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    if (
      !window.confirm(
        '⚠️ এই action-এর পরে booking আর restore করা যাবে না। আপনি কি নিশ্চিত?'
      )
    )
      return;

    try {
      await permanentlyDeleteArchived(hospitalId, appointmentId);
      await logActivity({
        hospitalId,
        module: LOG_MODULES.BOOKING,
        action: 'BOOKING_PERMANENTLY_DELETED',
        recordId: appointmentId,
        description: `বুকিং স্থায়ীভাবে মুছে ফেলা হয়েছে: ${appt.name || 'Unknown'} (সিরিয়াল ${appt.serialNo || '-'})`,
        oldValue: {
          name: appt.name,
          serialNo: appt.serialNo,
          isArchived: true,
        },
        newValue: null,
        user,
      });
      alert('✅ Booking permanently deleted');
    } catch (err) {
      console.error('Permanent delete error:', err);
      alert(err.message || 'Delete করতে সমস্যা হয়েছে।');
    }
  };

  // ==================================================
  // ✅ Filter Presets
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
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        setStartDate(d.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'month': {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 1);
        setStartDate(d.toISOString().split('T')[0]);
        setEndDate(todayStr);
        break;
      }
      case 'year': {
        const d = new Date(now);
        d.setFullYear(now.getFullYear() - 1);
        setStartDate(d.toISOString().split('T')[0]);
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
  // ✅ Filtered Data
  // ==================================================
  const filteredAppointments = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) return [];
    return appointments.filter((item) => {
      if (!item.bookingDate) return false;
      return item.bookingDate >= startDate && item.bookingDate <= endDate;
    });
  }, [appointments, startDate, endDate]);

  // ✅ Active vs Archived split
  const activeAppointments = useMemo(
    () => filteredAppointments.filter((a) => a.isArchived !== true),
    [filteredAppointments]
  );

  const archivedAppointments = useMemo(
    () =>
      filteredAppointments
        .filter((a) => a.isArchived === true)
        .sort((a, b) => {
          // archivedAt DESC (fallback: bookingDate)
          const timeA =
            a.archivedAt?.toDate?.().getTime?.() ||
            (a.archivedAt ? new Date(a.archivedAt).getTime() : 0) ||
            (a.bookingDate ? new Date(a.bookingDate).getTime() : 0);
          const timeB =
            b.archivedAt?.toDate?.().getTime?.() ||
            (b.archivedAt ? new Date(b.archivedAt).getTime() : 0) ||
            (b.bookingDate ? new Date(b.bookingDate).getTime() : 0);
          return timeB - timeA;
        }),
    [filteredAppointments]
  );

  const filteredAuditLogs = useMemo(() => {
    if (!activityLogs || !Array.isArray(activityLogs)) return [];
    return activityLogs.filter((item) => {
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
  // ✅ Loading State
  // ==================================================
  if (loading) return <OverviewSkeleton />;

  if (error) {
    return <div style={{ padding: '20px', color: '#dc2626' }}>❌ Error: {error}</div>;
  }

  // ==================================================
  // ✅ No Access Check
  // ==================================================
  const hasAnyTab =
    can('dashboard.view') ||
    can('booking.view') ||
    can('marketing_report.view') ||
    can('display.view') ||
    can('location.view') ||
    can('activity_log.view') ||
    can('user.view') ||
    can('archive.view');

  if (!hasAnyTab) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '10px',
          margin: '20px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Denied</h3>
        <p style={{ color: '#64748b' }}>
          আপনার এই ড্যাশবোর্ডে কোনো section দেখার permission নেই।
          <br />
          অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        padding: '20px',
        width: '100%',
        boxSizing: 'border-box',
        background: '#f9fafb',
        color: '#1f2937',
      }}
    >
      {/* ============ Top Bar ============ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h2>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Dashboard / Overview */}
          {can('dashboard.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('overview');
              }}
              style={{
                padding: '8px 16px',
                background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff',
                color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              পরিসংখ্যান
            </button>
          )}

          {/* Booking List */}
          {can('booking.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('appointments');
              }}
              style={{
                padding: '8px 16px',
                background:
                  tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff',
                color:
                  tab === 'appointments' && !showArchived ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              বুকিং লিস্ট
            </button>
          )}

          {/* Marketing Report */}
          {can('marketing_report.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('marketing');
              }}
              style={{
                padding: '8px 16px',
                background: tab === 'marketing' ? '#1c5fa8' : '#ffffff',
                color: tab === 'marketing' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              মার্কেটিং রিপোর্ট
            </button>
          )}

          {/* Display Settings */}
          {can('display.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('display');
              }}
              style={{
                padding: '8px 16px',
                background: tab === 'display' ? '#1c5fa8' : '#ffffff',
                color: tab === 'display' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              📺 ডিসপ্লে সেটিংস
            </button>
          )}

          {/* Location Manager */}
          {can('location.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('locations');
              }}
              style={{
                padding: '8px 16px',
                background: tab === 'locations' ? '#1c5fa8' : '#ffffff',
                color: tab === 'locations' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              📍 লোকেশন ম্যানেজার
            </button>
          )}

          {/* Activity Log */}
          {can('activity_log.view') && (
            <button
              onClick={() => setTab('logs')}
              style={{
                padding: '8px 16px',
                background: tab === 'logs' ? '#1c5fa8' : '#ffffff',
                color: tab === 'logs' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Activity Log
            </button>
          )}

          {/* User Access Control */}
          {can('user.view') && (
            <button
              onClick={() => {
                setShowArchived(false);
                setTab('user_access');
              }}
              style={{
                padding: '8px 16px',
                background: tab === 'user_access' ? '#1c5fa8' : '#ffffff',
                color: tab === 'user_access' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Shield size={14} /> User Access
            </button>
          )}

          {/* ✅ Archived – count badge সহ */}
          {can('archive.view') && (
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setTab('appointments');
              }}
              style={{
                padding: '8px 16px',
                background: showArchived ? '#374151' : '#ffffff',
                color: showArchived ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {showArchived ? '← Active List' : `📦 Archived (${archivedAppointments.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ============ Date Filter Bar ============ */}
      {(tab === 'overview' || tab === 'appointments') && (
        <div
          style={{
            background: '#ffffff',
            padding: '15px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'today', 'week', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '6px 14px',
                  background: filterPreset === p ? '#1c5fa8' : '#f1f5f9',
                  color: filterPreset === p ? '#fff' : '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {
                  {
                    all: 'সব',
                    today: 'আজ',
                    week: 'গত ৭ দিন',
                    month: 'গত ১ মাস',
                    year: 'গত ১ বছর',
                  }[p]
                }
              </button>
            ))}
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
                fontSize: '13px',
              }}
            >
              কাস্টম
            </button>
          </div>
          {filterPreset === 'custom' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  শুরু
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  শেষ
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
            📅 {startDate} – {endDate}
          </div>
        </div>
      )}

      {/* ============ Tab Content ============ */}

      {/* Overview – শুধু active appointments দিয়ে */}
      {tab === 'overview' && !showArchived && can('dashboard.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <Overview appointments={activeAppointments} />
          </Suspense>
        </SafeArea>
      )}

      {/* Booking List / Archived List */}
      {tab === 'appointments' && can('booking.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <AppointmentsTable
              appointments={showArchived ? archivedAppointments : activeAppointments}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              isArchivedView={showArchived}
              user={user}
              marketingTeam={marketingTeam}
              onAppointmentsChange={refreshData}
            />
          </Suspense>
        </SafeArea>
      )}

      {/* Marketing Report */}
      {tab === 'marketing' && can('marketing_report.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            {can('marketing_manager.view') && (
              <MarketingTeamManager user={user} onTeamUpdate={setMarketingTeam} />
            )}
            <MarketingReport
              appointments={activeAppointments}
              marketingTeam={marketingTeam}
              onTeamUpdate={setMarketingTeam}
              user={user}
            />
          </Suspense>
        </SafeArea>
      )}

      {/* Display Settings */}
      {tab === 'display' && can('display.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <DisplaySettings user={user} />
          </Suspense>
        </SafeArea>
      )}

      {/* Location Manager */}
      {tab === 'locations' && can('location.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <LocationManager
              appointments={activeAppointments}
              user={user}
              onAppointmentsChange={refreshData}
            />
          </Suspense>
        </SafeArea>
      )}

      {/* User Access Control */}
      {tab === 'user_access' && can('user.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <UserAccessManager user={user} />
          </Suspense>
        </SafeArea>
      )}

      {/* Activity Log */}
      {tab === 'logs' && can('activity_log.view') && (
        <SafeArea>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h3 style={{ margin: 0 }}>📋 Activity Log</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                মোট {filteredAuditLogs.length} টি | সর্বোচ্চ ২ মাস retention
              </span>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {logsLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                  লোড হচ্ছে...
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                  কোনো লগ নেই
                </div>
              ) : (
                filteredAuditLogs.map((log, idx) => {
                  const ts = log.timestamp?.seconds
                    ? new Date(log.timestamp.seconds * 1000)
                    : log.timestamp
                    ? new Date(log.timestamp)
                    : null;
                  const actionColor =
                    log.action === 'DELETE' ||
                    log.action === 'BOOKING_PERMANENTLY_DELETED'
                      ? '#dc2626'
                      : log.action === 'CREATE' || log.action === 'ASSIGN'
                      ? '#22c55e'
                      : log.action === 'BOOKING_ARCHIVED'
                      ? '#d97706'
                      : log.action === 'BOOKING_RESTORED'
                      ? '#0d9488'
                      : log.action === 'STATUS_CHANGE'
                      ? '#0d9488'
                      : log.action === 'PATIENT_TYPE_CHANGE'
                      ? '#8b5cf6'
                      : log.action === 'MARKETING_OFFICER_CHANGE' ||
                        log.action === 'UNASSIGN'
                      ? '#d97706'
                      : log.action === 'PERMISSION_UPDATED'
                      ? '#8b5cf6'
                      : '#1c5fa8';
                  return (
                    <div
                      key={log.id || idx}
                      style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <strong style={{ color: actionColor, fontSize: '14px' }}>
                          {log.description || log.action}
                        </strong>
                        <small style={{ color: '#64748b' }}>
                          {ts ? ts.toLocaleString('bn-BD') : '—'}
                        </small>
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: '#475569',
                          marginTop: '6px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <span>
                          <strong>ইউজার:</strong> {log.userName || '—'}
                        </span>
                        <span>
                          <strong>রোল:</strong> {log.userRole || '—'}
                        </span>
                        <span>
                          <strong>মডিউল:</strong> {log.module || '—'}
                        </span>
                        <span
                          style={{
                            background: '#f1f5f9',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            color: actionColor,
                          }}
                        >
                          {log.action || '—'}
                        </span>
                        {log.recordId && (
                          <span>
                            <strong>Record:</strong>{' '}
                            <code style={{ fontSize: '11px' }}>{log.recordId}</code>
                          </span>
                        )}
                      </div>
                      {((log.oldValue !== null && log.oldValue !== undefined) ||
                        (log.newValue !== null && log.newValue !== undefined)) && (
                        <div
                          style={{
                            fontSize: '12px',
                            marginTop: '6px',
                            color: '#64748b',
                            background: '#f8fafc',
                            padding: '6px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          {log.oldValue !== null && log.oldValue !== undefined && (
                            <div>
                              <strong>আগে:</strong>{' '}
                              {typeof log.oldValue === 'object'
                                ? JSON.stringify(log.oldValue)
                                : String(log.oldValue)}
                            </div>
                          )}
                          {log.newValue !== null && log.newValue !== undefined && (
                            <div>
                              <strong>পরে:</strong>{' '}
                              {typeof log.newValue === 'object'
                                ? JSON.stringify(log.newValue)
                                : String(log.newValue)}
                            </div>
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