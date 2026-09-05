import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToAppointments, subscribeToArchivedAppointments, 
  updateAppointmentStatus, deleteAppointment, archiveAppointment, restoreAppointment,
  subscribeToAuditLogs, addAuditLog 
} from '../services/appointmentService';
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';
import MarketingTeamManager from './admin/MarketingTeamManager';
import MarketingReport from './admin/MarketingReport';
import DisplaySettings from './admin/DisplaySettings';
import LocationManager from './admin/LocationManager';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// ছোট Error Boundary
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
  // 🔥 হসপিটাল আইডি নিশ্চিত করা – undefined হলে ডিফল্ট বসানো
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  console.log("🏥 AdminDashboard -> hospitalId:", hospitalId);
  console.log("👤 user:", user);

  const today = new Date().toISOString().split('T')[0];
  
  const [appointments, setAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketingTeam, setMarketingTeam] = useState([]);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2030-12-31');
  const [filterPreset, setFilterPreset] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';

  // ===== ১. ওভারভিউর জন্য আলাদা ডেটা ফেচ (getDocs) =====
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, today: 0, users: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // ডাক্তার কাউন্ট (ডিপার্টমেন্ট থেকে)
        const deptSnap = await getDocs(collection(db, 'hospitals', hospitalId, 'departments'));
        let docCount = 0;
        deptSnap.forEach(d => {
          const data = d.data();
          if (data.doctors && Array.isArray(data.doctors)) docCount += data.doctors.length;
        });

        // পেশেন্ট
        let patientCount = 0;
        try {
          const pSnap = await getDocs(collection(db, 'hospitals', hospitalId, 'patients'));
          patientCount = pSnap.size;
        } catch (e) {}

        // অ্যাপয়েন্টমেন্ট (সব)
        let appCount = 0;
        let todayCount = 0;
        try {
          const aSnap = await getDocs(collection(db, 'hospitals', hospitalId, 'appointments'));
          appCount = aSnap.size;
          // আজকের
          const today = new Date();
          today.setHours(0,0,0,0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate()+1);
          const q = query(
            collection(db, 'hospitals', hospitalId, 'appointments'),
            where('appointmentDate', '>=', today),
            where('appointmentDate', '<', tomorrow)
          );
          const tSnap = await getDocs(q);
          todayCount = tSnap.size;
        } catch (e) {}

        // ইউজার
        let userCount = 0;
        try {
          const uSnap = await getDocs(collection(db, 'hospitals', hospitalId, 'users'));
          userCount = uSnap.size;
        } catch (e) {}

        setStats({
          doctors: docCount,
          patients: patientCount,
          appointments: appCount,
          today: todayCount,
          users: userCount,
        });
      } catch (err) {
        console.error('Stats load error:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [hospitalId]);

  // ===== ২. অ্যাপয়েন্টমেন্ট সাবস্ক্রিপশন (error হ্যান্ডেল সহ) =====
  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }

    let unsubActive = () => {};
    let unsubArchived = () => {};
    let unsubLogs = () => {};

    // অ্যাক্টিভ অ্যাপয়েন্টমেন্ট
    unsubActive = subscribeToAppointments(
      hospitalId,
      (data) => {
        setAppointments(data || []);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Active appointments subscription error:', error);
        setAppointments([]);
        setLoading(false); // error হলেও লোডিং শেষ
      }
    );

    // আর্কাইভ
    unsubArchived = subscribeToArchivedAppointments(
      hospitalId,
      (data) => {
        setArchivedAppointments(data || []);
      },
      (error) => {
        console.error('❌ Archived appointments subscription error:', error);
        setArchivedAppointments([]);
      }
    );

    // অডিট লগ (শুধু অ্যাডমিন)
    if (isAdmin) {
      unsubLogs = subscribeToAuditLogs(
        hospitalId,
        (data) => {
          setAuditLogs(data || []);
        },
        (error) => {
          console.error('❌ Audit logs subscription error:', error);
          setAuditLogs([]);
        }
      );
    }

    // 🔥 টাইমআউট: ৫ সেকেন্ড পরেও যদি লোডিং না যায়, তাহলে জোর করে শেষ করি
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubActive();
      unsubArchived();
      if (isAdmin) unsubLogs();
      clearTimeout(timeout);
    };
  }, [hospitalId, isAdmin]);

  // ফিল্টার প্রিসেট (আপনার মতো)
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

  // হ্যান্ডলার
  const handleStatusChange = async (id, newStatus) => {
    if (!hospitalId) return;
    const currentAppt = appointments.find(a => a.id === id);
    if (newStatus === 'PERMANENT_DELETE') {
      if (confirm('আপনি কি নিশ্চিত এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
        await deleteAppointment(hospitalId, id);
        if (isAdmin) await addAuditLog(hospitalId, { 
          action: 'deleted', 
          entityId: id, 
          performedBy: user?.name || 'Unknown', 
          role: user?.role, 
          details: `রোগী ${currentAppt?.name || 'Unknown'} স্থায়ীভাবে ডিলিট করেছেন` 
        });
      }
    } else {
      await updateAppointmentStatus(hospitalId, id, newStatus);
      if (isAdmin) await addAuditLog(hospitalId, { 
        action: 'status_changed', 
        entityId: id, 
        performedBy: user?.name || 'Unknown', 
        role: user?.role, 
        oldStatus: currentAppt?.status || 'Unknown', 
        newStatus, 
        details: `${currentAppt?.name || 'Unknown'} এর স্ট্যাটাস ${currentAppt?.status || 'Unknown'} থেকে ${newStatus} এ পরিবর্তন করেছেন` 
      });
    }
  };

  const handleArchive = async (id) => {
    if (!hospitalId) return;
    const currentAppt = appointments.find(a => a.id === id);
    if (confirm('আপনি কি এই রেকর্ডটি আর্কাইভ করতে চান?')) {
      await archiveAppointment(hospitalId, id);
      if (isAdmin) await addAuditLog(hospitalId, { 
        action: 'archived', 
        entityId: id, 
        performedBy: user?.name || 'Unknown', 
        role: user?.role, 
        details: `${currentAppt?.name || 'Unknown'} এর বুকিং আর্কাইভ করেছেন` 
      });
    }
  };

  const handleRestore = async (id) => {
    if (!hospitalId) return;
    const currentAppt = archivedAppointments.find(a => a.id === id);
    if (confirm('আপনি কি এই বুকিংটি আবার মেইন লিস্টে ফিরিয়ে আনতে চান?')) {
      await restoreAppointment(hospitalId, id);
      if (isAdmin) await addAuditLog(hospitalId, { 
        action: 'restored', 
        entityId: id, 
        performedBy: user?.name || 'Unknown', 
        role: user?.role, 
        details: `${currentAppt?.name || 'Unknown'} এর বুকিং পুনরুদ্ধার করেছেন` 
      });
    }
  };

  // ===== রেন্ডার =====
  // যদি লোডিং true থাকে, তবুও হেডার দেখানো যেতে পারে, কিন্তু আমি পুরো UI দেখাবো
  // লোডিং হলে শুধু স্পিনার দেখাবো, কিন্তু ৫ সেকেন্ড পর টাইমআউটে false হয়ে যাবে
  if (loading) {
    return <div style={{ padding: '20px', color: '#333', background: '#f9fafb' }}>📊 ড্যাশবোর্ড লোড হচ্ছে...</div>;
  }

  // মূল UI
  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box', background: '#f9fafb', color: '#1f2937' }}>
      
      {/* হেডার – সবসময় দৃশ্যমান */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937' }}>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowArchived(false); setTab('overview'); }} style={{ padding: '8px 16px', background: tab === 'overview' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'overview' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>পরিসংখ্যান</button>
          <button onClick={() => { setShowArchived(false); setTab('appointments'); }} style={{ padding: '8px 16px', background: tab === 'appointments' && !showArchived ? '#1c5fa8' : '#ffffff', color: tab === 'appointments' && !showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>বুকিং লিস্ট</button>
          {(isAdmin || isSubAdmin) && (
            <button onClick={() => { setShowArchived(false); setTab('marketing'); }} style={{ padding: '8px 16px', background: tab === 'marketing' ? '#1c5fa8' : '#ffffff', color: tab === 'marketing' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>মার্কেটিং রিপোর্ট</button>
          )}
          {isAdmin && (
            <button onClick={() => { setShowArchived(false); setTab('display'); }} style={{ padding: '8px 16px', background: tab === 'display' ? '#1c5fa8' : '#ffffff', color: tab === 'display' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>📺 ডিসপ্লে সেটিংস</button>
          )}
          {isAdmin && (
            <button onClick={() => { setShowArchived(false); setTab('locations'); }} style={{ padding: '8px 16px', background: tab === 'locations' ? '#1c5fa8' : '#ffffff', color: tab === 'locations' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>📍 লোকেশন ম্যানেজার</button>
          )}
          {isAdmin && <button onClick={() => setTab('logs')} style={{ padding: '8px 16px', background: tab === 'logs' ? '#1c5fa8' : '#ffffff', color: tab === 'logs' ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>Activity Log</button>}
          <button onClick={() => { setShowArchived(!showArchived); setTab('appointments'); }} style={{ padding: '8px 16px', background: showArchived ? '#374151' : '#ffffff', color: showArchived ? '#ffffff' : '#333333', border: '1px solid #e2e8f0', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }}>{showArchived ? 'Active List' : 'Archived'}</button>
        </div>
      </div>

      {/* ফিল্টার */}
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

      {/* কন্টেন্ট – প্রতিটি ট্যাবের জন্য SafeArea */}
      <SafeArea>
        {tab === 'overview' && !showArchived && (
          // ওভারভিউ – আমরা আমাদের নিজস্ব স্ট্যাট ব্যবহার করবো, কিন্তু Overview কম্পোনেন্টকেও পাস করতে পারি
          // যদি Overview কম্পোনেন্ট না থাকে, তাহলে আমরা নিজেরা স্ট্যাট কার্ড দেখাবো
          // ধরে নিচ্ছি Overview কম্পোনেন্ট আছে এবং এটি appointments প্রপস নেয়
          <Overview appointments={filteredAppointments} />
        )}
      </SafeArea>

      <SafeArea>
        {tab === 'appointments' && (
          <AppointmentsTable 
            appointments={showArchived ? filteredArchived : filteredAppointments} 
            onStatusChange={handleStatusChange}
            onArchive={handleArchive}
            onRestore={handleRestore}
            isArchivedView={showArchived}
            user={user}
            marketingTeam={marketingTeam}
            hospitalId={hospitalId}
          />
        )}
      </SafeArea>

      <SafeArea>
        {tab === 'marketing' && (isAdmin || isSubAdmin) && (
          <>
            {isAdmin && <MarketingTeamManager user={user} onTeamUpdate={setMarketingTeam} />}
            <MarketingReport 
              appointments={filteredAppointments} 
              marketingTeam={marketingTeam}
              onTeamUpdate={setMarketingTeam}
              user={user}
            />
          </>
        )}
      </SafeArea>

      <SafeArea>
        {tab === 'display' && isAdmin && <DisplaySettings user={user} />}
      </SafeArea>

      <SafeArea>
        {tab === 'locations' && isAdmin && <LocationManager appointments={filteredAppointments} user={user} />}
      </SafeArea>

      <SafeArea>
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
        )}
      </SafeArea>

    </div>
  );
}
