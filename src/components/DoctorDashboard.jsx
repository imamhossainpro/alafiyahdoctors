// src/components/DoctorDashboard.jsx
// ==================================================
// 🩺 Doctor Dashboard — Main Component
// ==================================================
// ✅ Only accessible for designation: 'Doctor'
// ✅ Real data from Firestore (safe fields only)
// ✅ Responsive: hamburger drawer (mobile) + sticky sidebar (desktop)
// ✅ FIXED: React Error #310 — all hooks before any return
// ✅ NEW: Real-time pending profile request badge
// ✅ NEW: Error boundary
// ==================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
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

import DoctorSummaryCards from './doctor/DoctorSummaryCards';
import DoctorPatientList from './doctor/DoctorPatientList';
import DoctorDailyReport from './doctor/DoctorDailyReport';
import DoctorProfile from './doctor/DoctorProfile';
import DoctorErrorBoundary from './doctor/DoctorErrorBoundary';

import {
  subscribeToDoctorAppointments,
  computeSummaryCounts,
  getTodayString,
} from '../services/doctorAppointmentService';

import { subscribeToMyRequests } from '../services/doctorProfileRequestService';

// ==================================================
// ✅ Component CSS
// ==================================================
const DASH_CSS = `
  .dd-root {
    display: flex;
    min-height: 100vh;
    background: #F8FAFC;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    overflow-x: hidden;
    box-sizing: border-box;
  }
  .dd-root * { box-sizing: border-box; }

  /* ---------- Sidebar ---------- */
  .dd-sidebar {
    width: 240px;
    background: #FFFFFF;
    border-right: 1px solid #E2E8F0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
    z-index: 30;
    transition: transform 0.25s ease;
  }

  .dd-sidebar-brand {
    padding: 20px;
    border-bottom: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dd-brand-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #1D4ED8, #0F9488);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }
  .dd-brand-text { line-height: 1.2; min-width: 0; }
  .dd-brand-title {
    font-size: 15px;
    font-weight: 800;
    color: #1D4ED8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dd-brand-sub {
    font-size: 11px;
    color: #64748B;
    font-weight: 500;
  }

  .dd-sidebar-user {
    padding: 14px 20px;
    border-bottom: 1px solid #E2E8F0;
  }
  .dd-user-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #0F172A;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }
  .dd-user-role {
    font-size: 11.5px;
    color: #64748B;
  }
  .dd-admin-tag {
    margin-top: 6px;
    font-size: 10.5px;
    background: #DBEAFE;
    color: #1E40AF;
    padding: 2px 8px;
    border-radius: 10px;
    display: inline-block;
    font-weight: 700;
  }

  .dd-nav {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
  }
  .dd-nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    color: #475569;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    text-align: left;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
  }
  .dd-nav-item:hover {
    background: #F1F5F9;
    color: #1D4ED8;
  }
  .dd-nav-item.is-active {
    background: #1D4ED8;
    color: #FFFFFF;
  }

  .dd-sidebar-footer {
    padding: 14px;
    border-top: 1px solid #E2E8F0;
  }
  .dd-logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: #FEE2E2;
    color: #DC2626;
    border: 1px solid #FCA5A5;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 700;
    font-family: inherit;
    transition: background 0.15s;
  }
  .dd-logout-btn:hover { background: #FECACA; }

  /* ---------- Mobile top header ---------- */
  .dd-mobile-header {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: #FFFFFF;
    border-bottom: 1px solid #E2E8F0;
    position: sticky;
    top: 0;
    z-index: 25;
  }
  .dd-hamburger {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    cursor: pointer;
    color: #0F172A;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .dd-hamburger:hover { background: #E2E8F0; }
  .dd-hamburger:focus-visible {
    outline: 2px solid #1D4ED8;
    outline-offset: 2px;
  }
  .dd-mobile-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }
  .dd-mobile-title .dd-brand-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .dd-mobile-title .dd-brand-icon svg { width: 18px; height: 18px; }
  .dd-mobile-title-text { line-height: 1.1; min-width: 0; }
  .dd-mobile-title-text .dd-brand-title {
    font-size: 14px;
    font-weight: 800;
    color: #1D4ED8;
  }
  .dd-mobile-title-text .dd-brand-sub {
    font-size: 10.5px;
    color: #64748B;
    font-weight: 500;
  }

  /* ---------- Main ---------- */
  .dd-main {
    flex: 1;
    min-width: 0;
    padding: 24px;
    overflow-x: hidden;
  }

  /* ---------- Overlay ---------- */
  .dd-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    z-index: 40;
    animation: dd-fade-in 0.18s ease;
  }
  @keyframes dd-fade-in { from { opacity: 0 } to { opacity: 1 } }

  /* ---------- Responsive ---------- */
  @media (max-width: 1023px) {
    .dd-sidebar { width: 220px; }
    .dd-main { padding: 20px; }
  }

  @media (max-width: 767px) {
    .dd-root { display: block; }
    .dd-mobile-header { display: flex; }
    .dd-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 260px;
      max-width: 80vw;
      transform: translateX(-100%);
      z-index: 50;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
    }
    .dd-sidebar.is-open { transform: translateX(0); }
    .dd-overlay.is-open { display: block; }
    .dd-main {
      padding: 14px;
      width: 100%;
      min-width: 0;
    }
  }

  @media (max-width: 360px) {
    .dd-main { padding: 10px; }
    .dd-sidebar { max-width: 88vw; }
  }

  /* ---------- Loading / Error / Access ---------- */
  .dd-loading-box {
    background: #fff;
    padding: 60px 20px;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    text-align: center;
    color: #64748B;
  }
  .dd-spinner {
    display: inline-block;
    width: 32px;
    height: 32px;
    border: 3px solid #E2E8F0;
    border-top-color: #1D4ED8;
    border-radius: 50%;
    animation: dd-spin 0.8s linear infinite;
  }
  @keyframes dd-spin { to { transform: rotate(360deg) } }

  .dd-error-box {
    background: #FEE2E2;
    border: 1px solid #FCA5A5;
    padding: 20px 24px;
    border-radius: 12px;
    color: #991B1B;
  }
  .dd-error-box strong { display: block; margin-bottom: 6px; }

  .dd-tab-header h2 {
    margin: 0 0 4px 0;
    font-size: 22px;
    font-weight: 800;
    color: #0F172A;
  }
  .dd-tab-header p {
    margin: 0;
    color: #64748B;
    font-size: 13.5px;
  }

  .dd-centered-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F8FAFC;
    padding: 20px;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', -apple-system, sans-serif;
  }
  .dd-access-card {
    background: #fff;
    padding: 40px 32px;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    text-align: center;
    max-width: 440px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
  }
  .dd-access-card h2 {
    margin: 16px 0 8px;
    color: #0F172A;
    font-size: 20px;
    font-weight: 700;
  }
  .dd-access-card p {
    color: #64748B;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .dd-access-btn {
    padding: 10px 24px;
    background: #1D4ED8;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
  }
  .dd-access-btn:hover { background: #1E40AF; }
`;

// ==================================================
// ✅ Component
// ==================================================
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const { currentHospital } = useHospital();
  const { can } = usePermission();

  const [showAuth] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingProfileRequests, setPendingProfileRequests] = useState(0);

  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const isDoctor = user?.designation === 'Doctor' && !!user?.doctorId;
  const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

  const path = location.pathname;
  const activeTab = path.includes('/doctor/')
    ? path.split('/doctor/')[1]?.split('/')[0] || 'overview'
    : 'overview';

  const todayStr = getTodayString();

  const todayCounts = useMemo(
    () => computeSummaryCounts(appointments, todayStr),
    [appointments, todayStr]
  );

  // ==================================================
  // ✅ Effects
  // ==================================================

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (isDoctor) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
  }, [authLoading, user, isDoctor, isAdmin, navigate]);

  // Subscribe to appointments
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

  // Pending profile request count
  useEffect(() => {
    if (!isDoctor || !user?.doctorId) return;
    const unsub = subscribeToMyRequests(
      hospitalId,
      user.doctorId,
      (list) => {
        const pending = (list || []).filter(
          (r) => r.status === 'pending'
        ).length;
        setPendingProfileRequests(pending);
      },
      (err) => console.warn('subscribeToMyRequests error:', err.message)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, user?.doctorId, isDoctor]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // ESC + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  // ==================================================
  // ✅ Derived values
  // ==================================================
  const handleLogout = () => {
    logout();
    setTimeout(() => window.location.reload(), 100);
  };

  const handleNavClick = (itemPath) => {
    navigate(itemPath);
    setDrawerOpen(false);
  };

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

  const renderTabContent = () => {
    if (appointmentsLoading && activeTab === 'overview') {
      return (
        <div className="dd-loading-box">
          <div className="dd-spinner" />
          <p style={{ marginTop: 12, fontSize: 14 }}>লোড হচ্ছে...</p>
        </div>
      );
    }

    if (appointmentsError) {
      return (
        <div className="dd-error-box">
          <strong>⚠️ ডেটা লোড করতে সমস্যা:</strong>
          <div style={{ fontSize: 13 }}>{appointmentsError}</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="dd-tab-header">
              <h2>Overview</h2>
              <p>আজকের ({todayStr}) সিরিয়াল এবং রোগীর পরিসংখ্যান</p>
            </div>

            <DoctorSummaryCards
              counts={todayCounts}
              onCardClick={(status) => {
                navigate(`/doctor/patients?status=${status}`);
              }}
            />

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
        return <div className="dd-loading-box">Page not found</div>;
    }
  };

  // ==================================================
  // ✅ CONDITIONAL RETURNS — only after ALL hooks
  // ==================================================

  if (authLoading) {
    return (
      <>
        <style>{DASH_CSS}</style>
        <div className="dd-centered-wrap">
          <div style={{ color: '#64748B', fontSize: 16 }}>লোড হচ্ছে...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{DASH_CSS}</style>
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
          <AuthPage onClose={() => {}} />
        </div>
      </>
    );
  }

  if (!isDoctor && !isAdmin) {
    return (
      <>
        <style>{DASH_CSS}</style>
        <div className="dd-centered-wrap">
          <div className="dd-access-card">
            <ShieldAlert size={56} color="#DC2626" />
            <h2>Access Denied</h2>
            <p>আপনি Doctor designation-এ নেই।</p>
            <button
              className="dd-access-btn"
              onClick={() => navigate('/')}
              type="button"
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        </div>
      </>
    );
  }

  // ==================================================
  // ✅ MAIN RENDER
  // ==================================================
  return (
    <>
      <style>{DASH_CSS}</style>
      <div className="dd-root">

        {/* Mobile top header */}
        <header className="dd-mobile-header">
          <button
            type="button"
            className="dd-hamburger"
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="dd-mobile-title">
            <div className="dd-brand-icon">
              <Stethoscope size={18} />
            </div>
            <div className="dd-mobile-title-text">
              <div className="dd-brand-title">আল-আফিয়া</div>
              <div className="dd-brand-sub">Doctor Panel</div>
            </div>
          </div>
        </header>

        {/* Overlay */}
        <div
          className={`dd-overlay ${drawerOpen ? 'is-open' : ''}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside className={`dd-sidebar ${drawerOpen ? 'is-open' : ''}`}>
          <div className="dd-sidebar-brand">
            <div className="dd-brand-icon">
              <Stethoscope size={20} />
            </div>
            <div className="dd-brand-text">
              <div className="dd-brand-title">আল-আফিয়া</div>
              <div className="dd-brand-sub">Doctor Panel</div>
            </div>

            <button
              type="button"
              className="dd-hamburger"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: 'none',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="dd-sidebar-user">
            <div className="dd-user-name">{user?.name || 'Doctor'}</div>
            <div className="dd-user-role">
              {user?.designation || 'Doctor'}
            </div>
            {isAdmin && <span className="dd-admin-tag">ADMIN</span>}
          </div>

          <nav className="dd-nav" role="navigation">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasPerm = item.perm ? can(item.perm) : true;
              if (!hasPerm) return null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.path)}
                  className={`dd-nav-item ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.id === 'profile' && pendingProfileRequests > 0 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        background: '#DC2626',
                        color: '#fff',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        padding: '2px 7px',
                        minWidth: '18px',
                        textAlign: 'center',
                      }}
                    >
                      {pendingProfileRequests}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="dd-sidebar-footer">
            <button
              type="button"
              className="dd-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={16} /> লগআউট
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="dd-main">
          <DoctorErrorBoundary>
            {renderTabContent()}
          </DoctorErrorBoundary>
        </main>
      </div>
    </>
  );
}