// src/components/DoctorDashboard.jsx
// ==================================================
// 🩺 Doctor Dashboard — Main Component (Phase 2)
// ==================================================
// ✅ Only accessible for designation: 'Doctor'
// ✅ View-only (unless role: 'admin')
// ✅ Real data from Firestore (safe fields only)
// ✅ Multi-route (overview, patients, reports, profile)
// ==================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  User,
  LogOut,
  Stethoscope,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHospital } from '../context/HospitalContext';
import { usePermission } from '../context/PermissionContext';
import AuthPage from './AuthPage';

// ✅ Phase 2 components
import DoctorSummaryCards from './doctor/DoctorSummaryCards';
import DoctorPatientList from './doctor/DoctorPatientList';
import DoctorDailyReport from './doctor/DoctorDailyReport';
import DoctorProfile from './doctor/DoctorProfile';

// ✅ Phase 2 service
import {
  subscribeToDoctorAppointments,
  computeSummaryCounts,
  getTodayString,
} from '../services/doctorAppointmentService';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentHospital } = useHospital();
  const { can } = usePermission();

  const [showAuth, setShowAuth] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hospitalId = currentHospital?.id || 'alafiyah_main';

  // ==================================================
  // ✅ Doctor check
  // ==================================================
  const isDoctor =
    user?.designation === 'Doctor' && !!user?.doctorId;
  const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

  // ==================================================
  // ✅ Redirect logic
  // ==================================================
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    if (isDoctor) return;

    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
  }, [authLoading, user, isDoctor, isAdmin, navigate]);

  // ==================================================
  // ✅ Subscribe to doctor's appointments
  // ==================================================
  useEffect(() => {
    if (!isDoctor || !user?.doctorId) return;

    setAppointmentsLoading(true);
    const unsub = subscribeToDoctorAppointments(
      hospitalId,
      user.doctorId,
      (data) => {
        setAppointments(data);
        setAppointmentsLoading(false);
      },
      (err) => {
        setAppointmentsError(err.message);
        setAppointmentsLoading(false);
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, user?.doctorId, isDoctor]);

  // ==================================================
  // ✅ Active tab from URL
  // ==================================================
  const path = location.pathname;
  const activeTab = path.includes('/doctor/')
    ? path.split('/doctor/')[1]?.split('/')[0] || 'overview'
    : 'overview';

  // ==================================================
  // ✅ Loading state
  // ==================================================
  if (authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '16px',
          color: '#64748b',
        }}
      >
        লোড হচ্ছে...
      </div>
    );
  }

  // ==================================================
  // ✅ Not logged in
  // ==================================================
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f4f6fa',
        }}
      >
        <AuthPage onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  // ==================================================
  // ✅ Access Denied
  // ==================================================
  if (!isDoctor && !isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fa',
          padding: '20px',
          fontFamily:
            "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '40px 32px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            maxWidth: '440px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          }}
        >
          <ShieldAlert
            size={56}
            color="#dc2626"
            style={{ marginBottom: '16px' }}
          />
          <h2
            style={{
              margin: '0 0 8px',
              color: '#1e293b',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Access Denied
          </h2>
          <p
            style={{
              color: '#64748b',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            আপনি Doctor designation-এ নেই।
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 24px',
              background: '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            হোমপেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // ✅ Today's counts
  // ==================================================
  const todayStr = getTodayString();
  const todayCounts = computeSummaryCounts(appointments, todayStr);

  const handleLogout = () => {
    logout();
    setTimeout(() => window.location.reload(), 100);
  };

  // ==================================================
  // ✅ Sidebar items
  // ==================================================
  const sidebarItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/doctor',
      perm: 'doctor_dashboard.view',
    },
    {
      id: 'patients',
      label: 'My Patients',
      icon: Users,
      path: '/doctor/patients',
      perm: 'doctor_dashboard.patients.view',
    },
    {
      id: 'reports',
      label: 'Daily Reports',
      icon: FileText,
      path: '/doctor/reports',
      perm: 'doctor_dashboard.reports.view',
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      path: '/doctor/profile',
      perm: 'doctor_dashboard.profile.view',
    },
  ];

  const handleNavClick = (itemPath) => {
    navigate(itemPath);
    setSidebarOpen(false);
  };

  // ==================================================
  // ✅ Render Tab Content
  // ==================================================
  const renderTabContent = () => {
    if (appointmentsLoading && activeTab === 'overview') {
      return (
        <div
          style={{
            background: '#fff',
            padding: '60px 20px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#1c5fa8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ marginTop: 12, fontSize: 14 }}>লোড হচ্ছে...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (appointmentsError) {
      return (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            padding: '20px 24px',
            borderRadius: '12px',
            color: '#991b1b',
          }}
        >
          <strong>⚠️ ডেটা লোড করতে সমস্যা:</strong>
          <div style={{ marginTop: 6, fontSize: 13 }}>{appointmentsError}</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div>
              <h2
                style={{
                  margin: '0 0 4px 0',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#1e293b',
                }}
              >
                Overview
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: 13.5 }}>
                আজকের ({todayStr}) সিরিয়াল এবং রোগীর পরিসংখ্যান
              </p>
            </div>

            {/* Summary Cards */}
            <DoctorSummaryCards
              counts={todayCounts}
              onCardClick={(status) => {
                // ✅ Card click → navigate to patients with filter
                navigate(`/doctor/patients?status=${status}`);
              }}
            />

            {/* Today's Patient List */}
            <DoctorPatientList
              appointments={appointments}
              initialDate={todayStr}
              showDateFilter={false}
              title="Today's Patients"
            />
          </div>
        );

      case 'patients':
        return <DoctorPatientList appointments={appointments} />;

      case 'reports':
        return <DoctorDailyReport appointments={appointments} />;

      case 'profile':
        return <DoctorProfile user={user} />;

      default:
        return (
          <div
            style={{
              background: '#fff',
              padding: 40,
              borderRadius: 12,
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            Page not found
          </div>
        );
    }
  };

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f4f6fa',
        fontFamily:
          "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif",
      }}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* ============ Sidebar ============ */}
      <aside
        style={{
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
          transition: 'transform 0.2s',
        }}
      >
        {/* Logo/Title */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1c5fa8, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            <Stethoscope size={20} />
          </div>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#1c5fa8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              আল-আফিয়া
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              Doctor Panel
            </div>
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name || 'Doctor'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {user?.designation || 'Doctor'}
          </div>
          {isAdmin && (
            <div
              style={{
                marginTop: '6px',
                fontSize: '10.5px',
                background: '#dbeafe',
                color: '#1e40af',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'inline-block',
                fontWeight: 700,
              }}
            >
              ADMIN
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasPerm = item.perm ? can(item.perm) : true;
            if (!hasPerm) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: isActive ? '#1c5fa8' : 'transparent',
                  color: isActive ? '#fff' : '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 600,
                  marginBottom: '4px',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            <LogOut size={16} /> লগআউট
          </button>
        </div>
      </aside>

      {/* ============ Main Content ============ */}
      <main
        style={{
          flex: 1,
          padding: '24px',
          overflowX: 'auto',
          minWidth: 0,
        }}
      >
        {renderTabContent()}
      </main>
    </div>
  );
}