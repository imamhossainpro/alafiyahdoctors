// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverviewSkeleton } from './ui/SkeletonScreens';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { db, updateDoc, doc, collection, getDocs, getDoc, onSnapshot } from '../firebase';
import { RefreshCw, Shield, FileText, Search, FileSignature } from 'lucide-react';
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
const QueueControlPanel = lazy(() => import('./admin/QueueControlPanel'));
const PromoManager = lazy(() => import('./admin/PromoManager'));

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
// ✅ AdminPanel — User Management (Email visible)
// ==================================================
function AdminPanel({ users = [], onApprove, onSetRole, onDeleteUser }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.designation || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term) ||
        (u.id || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '17px' }}>ইউজার ম্যানেজমেন্ট</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            রেজিস্ট্রেশন করা ইউজারদের এপ্রুভ, রোল সেট ও ডিলিট করুন।
          </p>
        </div>
        <span style={{ background: '#eff6ff', color: '#1c5fa8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
          মোট: {users.length} জন
        </span>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '4px 12px', marginBottom: '16px', maxWidth: '420px' }}>
        <Search size={16} color="#64748b" />
        <input
          type="text"
          placeholder="নাম / ইমেইল / রোল / ডেসিগনেশন সার্চ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', padding: '8px 10px', fontSize: '13.5px', width: '100%', fontFamily: 'inherit' }}
        />
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>এখনো কোনো ইউজার রেজিস্ট্রেশন করে নি।</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>"{searchTerm}" এর সাথে মিলে এমন কোনো ইউজার নেই।</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e6ee', textAlign: 'left', background: '#f8fafc', color: '#475569', fontSize: '12.5px' }}>
                <th style={{ padding: '12px 10px' }}>নাম</th>
                <th style={{ padding: '12px 10px' }}>ইমেইল</th>
                <th style={{ padding: '12px 10px' }}>ডেসিগনেশন</th>
                <th style={{ padding: '12px 10px' }}>রোল</th>
                <th style={{ padding: '12px 10px' }}>স্ট্যাটাস</th>
                <th style={{ padding: '12px 10px' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eef1f7', fontSize: '13.5px' }}>
                  <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>
                    {u.name || u.displayName || 'নাম নেই'}
                  </td>

                  <td style={{ padding: '12px 10px', color: '#475569', fontSize: '12.5px' }}>
                    {u.email ? (
                      <a href={`mailto:${u.email}`} style={{ color: '#1c5fa8', textDecoration: 'none' }}>
                        {u.email}
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '12.5px' }}>
                    {u.designation || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>

                  <td style={{ padding: '12px 10px' }}>
                    <select
                      value={u.role || 'pending'}
                      onChange={(e) => onSetRole(u.id, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e6ee', fontSize: '13px', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <option value="pending">পেন্ডিং</option>
                      <option value="admin">অ্যাডমিন</option>
                      <option value="sub-admin">সাব-অ্যাডমিন</option>
                      <option value="editor">এডিটর</option>
                      <option value="moderator">মডারেটর</option>
                      <option value="viewer">ভিউয়ার</option>
                      <option value="patient">রোগী</option>
                    </select>
                  </td>

                  <td style={{ padding: '12px 10px' }}>
                    {u.approved ? (
                      <span style={{ color: '#166534', fontWeight: '700', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px' }}>এপ্রুভড</span>
                    ) : (
                      <span style={{ color: '#991b1b', fontWeight: '700', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px' }}>পেন্ডিং</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {!u.approved && (
                      <button
                        onClick={() => onApprove(u.id)}
                        style={{ padding: '6px 12px', fontSize: '12px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        ✓ এপ্রুভ
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`"${u.name || 'ইউজার'}"-কে ডিলিট করতে চান?`)) onDeleteUser(u.id);
                      }}
                      style={{ padding: '6px 12px', fontSize: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      🗑 ডিলিট
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function AdminDashboard({ user: propUser }) {
  const navigate = useNavigate();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  const { can } = usePermission();

  const [appointments, setAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);

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
  // ✅ Real-time Departments + Panels
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;

    const deptRef = collection(db, 'hospitals', hospitalId, 'departments');
    const unsubDept = onSnapshot(
      deptRef,
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setDepartments(data);
      },
      (err) => console.error('❌ Departments listener error:', err)
    );

    const panelRef = collection(db, 'hospitals', hospitalId, 'panels');
    const unsubPanel = onSnapshot(
      panelRef,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPanels(data);
      },
      (err) => console.error('❌ Panels listener error:', err)
    );

    return () => {
      unsubDept();
      unsubPanel();
    };
  }, [hospitalId]);

  // ==================================================
  // ✅ Real-time users list (for AdminPanel)
  // ==================================================
  useEffect(() => {
    if (!hospitalId || !can('user.view')) {
      setAllUsers([]);
      return;
    }
    const usersRef = collection(db, 'hospitals', hospitalId, 'users');
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            name: data.name || data.displayName || 'নাম নেই',
            designation: data.designation || '',
            email: data.email || '',
          };
        });
        list.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        setAllUsers(list);
      },
      (err) => {
        console.error('❌ Users listener error:', err);
        setAllUsers([]);
      }
    );
    return () => unsub();
  }, [hospitalId, can]);

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
  // ✅ Activity Logs
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
    if (!window.confirm('এই booking-টি আবার Booking List-এ ফিরিয়ে আনতে চান?')) return;

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
    if (!window.confirm('⚠️ এই action-এর পরে booking আর restore করা যাবে না। আপনি কি নিশ্চিত?')) return;

    try {
      await permanentlyDeleteArchived(hospitalId, appointmentId);
      await logActivity({
        hospitalId,
        module: LOG_MODULES.BOOKING,
        action: 'BOOKING_PERMANENTLY_DELETED',
        recordId: appointmentId,
        description: `বুকিং স্থায়ীভাবে মুছে ফেলা হয়েছে: ${appt.name || 'Unknown'} (সিরিয়াল ${appt.serialNo || '-'})`,
        oldValue: { name: appt.name, serialNo: appt.serialNo, isArchived: true },
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
  // ✅ AdminPanel handlers
  // ==================================================
  const handleApprove = async (userId) => {
    if (!hospitalId) return;
    try {
      await updateDoc(doc(db, 'hospitals', hospitalId, 'users', userId), {
        approved: true,
        approvedAt: new Date().toISOString(),
      });
      setAllUsers((users) =>
        users.map((u) => (u.id === userId ? { ...u, approved: true } : u))
      );
    } catch (e) {
      console.error(e);
      alert('এপ্রুভ করা যায়নি।');
    }
  };

  const handleSetRole = async (userId, role) => {
    if (!hospitalId) return;
    try {
      await updateDoc(doc(db, 'hospitals', hospitalId, 'users', userId), {
        role,
        permissionOverrides: {},
        roleUpdatedAt: new Date().toISOString(),
      });
      setAllUsers((users) =>
        users.map((u) =>
          u.id === userId ? { ...u, role, permissionOverrides: {} } : u
        )
      );
    } catch (e) {
      console.error(e);
      alert('রোল পরিবর্তন করা যায়নি।');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!hospitalId) return;
    try {
      await updateDoc(doc(db, 'hospitals', hospitalId, 'users', userId), {
        isActive: false,
        deletedAt: new Date().toISOString(),
      });
      setAllUsers((users) => users.filter((u) => u.id !== userId));
      alert('ইউজার নিষ্ক্রিয় করা হয়েছে।');
    } catch (e) {
      console.error(e);
      alert('ডিলিট করা যায়নি।');
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

  const activeAppointments = useMemo(
    () => filteredAppointments.filter((a) => a.isArchived !== true),
    [filteredAppointments]
  );

  const archivedAppointments = useMemo(
    () =>
      filteredAppointments
        .filter((a) => a.isArchived === true)
        .sort((a, b) => {
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
      <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '10px', margin: '20px', border: '1px solid #e2e8f0' }}>
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
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {can('dashboard.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('overview'); }}
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

          {can('booking.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('queue'); }}
              style={{
                padding: '8px 16px',
                background: tab === 'queue' ? '#1c5fa8' : '#ffffff',
                color: tab === 'queue' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🎛️ Queue Control
            </button>
          )}

          {can('dashboard.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('promo'); }}
              style={{
                padding: '8px 16px',
                background: tab === 'promo' ? '#1c5fa8' : '#ffffff',
                color: tab === 'promo' ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              📢 Promo
            </button>
          )}

          {can('booking.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('appointments'); }}
              style={{
                padding: '8px 16px',
                background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff',
                color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333',
                border: '1px solid #e2e8f0',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              বুকিং লিস্ট
            </button>
          )}

          {can('marketing_report.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('marketing'); }}
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

          {can('display.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('display'); }}
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

          {can('location.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('locations'); }}
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

          {can('user.view') && (
            <button
              onClick={() => { setShowArchived(false); setTab('user_access'); }}
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

          {can('archive.view') && (
            <button
              onClick={() => { setShowArchived(!showArchived); setTab('appointments'); }}
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

      {tab === 'overview' && !showArchived && can('dashboard.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <Overview appointments={activeAppointments} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'queue' && can('booking.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <QueueControlPanel user={user} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'promo' && can('dashboard.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <PromoManager />
          </Suspense>
        </SafeArea>
      )}

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
              departments={departments}
              panels={panels}
            />
          </Suspense>
        </SafeArea>
      )}

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

      {tab === 'display' && can('display.view') && (
        <SafeArea>
          <Suspense fallback={<TabLoader />}>
            <DisplaySettings user={user} />
          </Suspense>
        </SafeArea>
      )}

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
      {tab === 'user_access' && can('user.view') && (
        <SafeArea>
          <AdminPanel
            users={allUsers}
            onApprove={handleApprove}
            onSetRole={handleSetRole}
            onDeleteUser={handleDeleteUser}
          />
          <Suspense fallback={<TabLoader />}>
            <UserAccessManager user={user} />
          </Suspense>
        </SafeArea>
      )}

      {tab === 'logs' && can('activity_log.view') && (
        <SafeArea>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>📋 Activity Log</h3>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {logsLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>লোড হচ্ছে...</div>
              ) : filteredAuditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>কোনো লগ নেই</div>
              ) : (
                filteredAuditLogs.map((log, idx) => {
                  const ts = log.timestamp?.seconds
                    ? new Date(log.timestamp.seconds * 1000)
                    : log.timestamp
                    ? new Date(log.timestamp)
                    : null;
                  return (
                    <div key={log.id || idx} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                        <strong style={{ color: '#1c5fa8', fontSize: '14px' }}>{log.description || log.action}</strong>
                        <small style={{ color: '#64748b' }}>{ts ? ts.toLocaleString('bn-BD') : '—'}</small>
                      </div>
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