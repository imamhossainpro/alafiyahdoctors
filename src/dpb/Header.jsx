// src/dpb/Header.jsx
// ==================================================
// 🏥 Doctor Panel Builder — Header Component
// ==================================================
// ✅ Hospital logo + name (Firestore থেকে load)
// ✅ Desktop: All buttons visible
// ✅ Mobile: Logo + hamburger + 4-button grid
// ✅ Mobile hamburger: extra options drawer
// ==================================================
import React from 'react';
import {
  CalendarPlus, CalendarCheck, Users, LayoutDashboard, Settings,
  Shield, LogIn, LogOut, Menu, X, Stethoscope, Ticket,
  ClipboardList, ChevronDown, ChevronRight,
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function Header({
  branding,
  user,
  isGuest,
  isAdmin,
  isSubAdmin,
  isEditor,
  isModerator,
  isDoctorLoggedIn,
  activeView,
  onSetView,
  onGoLogin,
  onLogout,
  onGoHome,
  onGoDoctorDashboard,
  onGoMyBookings,
  onGoMou,
  mobileMenuOpen,
  setMobileMenuOpen,
}) {
  return (
    <>
      {/* ==================================================
          TOP HEADER
          ================================================== */}
      <div className="topbar no-print">
        {/* Hospital Brand */}
        <div className="hospital-brand">
          <div className="hospital-brand-logo">
            {branding?.logo ? (
              <img src={branding.logo} alt="Hospital Logo" />
            ) : (
              <Stethoscope size={22} color="#1c5fa8" />
            )}
          </div>
          <div className="hospital-brand-name">
            {branding?.name || 'আল আফিয়াহ হাসপাতাল'}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="topbar-actions">
          {/* Primary: Booking */}
          <button
            className="header-btn btn-teal"
            onClick={() => onSetView('booking')}
            title="সিরিয়াল নিশ্চিত করুন"
            type="button"
          >
            <CalendarPlus size={16} />
            সিরিয়াল নিশ্চিত করুন
          </button>

          {/* Primary: Preview */}
          <button
            className="header-btn btn-blue-outline"
            onClick={() => onSetView('preview')}
            title="আজকের ডাক্তার সময়সূচি"
            type="button"
          >
            <CalendarCheck size={16} />
            আজকের ডাক্তার সময়সূচি
          </button>

          {/* Panel Builder */}
          {!isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
            <button
              className="header-btn btn-gray-outline"
              onClick={() => onSetView('edit')}
              title="প্যানেল বিল্ডার"
              type="button"
            >
              <Settings size={16} />
              প্যানেল বিল্ডার
            </button>
          )}

          {/* Doctors List */}
          {!isGuest && (isSubAdmin || isAdmin) && (
            <button
              className="header-btn btn-gray-outline"
              onClick={() => onSetView('doctors')}
              title="ডাক্তার লিস্ট"
              type="button"
            >
              <Users size={16} />
              ডাক্তার লিস্ট
            </button>
          )}

          {/* Dashboard */}
          {!isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
            <button
              className="header-btn btn-gray-outline"
              onClick={() => onSetView('dashboard')}
              title="ড্যাশবোর্ড"
              type="button"
            >
              <LayoutDashboard size={16} />
              ড্যাশবোর্ড
            </button>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <button
              className="header-btn btn-gray-outline"
              onClick={() => onSetView('admin')}
              title="অ্যাডমিন প্যানেল"
              type="button"
            >
              <Shield size={16} />
              অ্যাডমিন প্যানেল
            </button>
          )}

          {/* MOU */}
          {isAdmin && (
            <button
              className="header-btn btn-gray-outline"
              onClick={onGoMou}
              title="MOU"
              type="button"
            >
              <ClipboardList size={16} />
              MOU
            </button>
          )}

          {/* Notification Bell */}
          <NotificationBell user={user} />

          {/* Doctor Dashboard (for doctors) */}
          {!isGuest && isDoctorLoggedIn && (
            <button
              className="header-btn btn-gray-outline"
              onClick={onGoDoctorDashboard}
              title="ডাক্তার ড্যাশবোর্ড"
              type="button"
            >
              <Stethoscope size={14} />
              ড্যাশবোর্ড
            </button>
          )}

          {/* My Bookings (for non-doctor users) */}
          {!isGuest && !isDoctorLoggedIn && (
            <button
              className="header-btn btn-gray-outline"
              onClick={onGoMyBookings}
              title="আমার সিরিয়াল"
              type="button"
            >
              <Ticket size={14} />
              আমার সিরিয়াল
            </button>
          )}

          {/* Login / Logout */}
          {isGuest ? (
            <button
              className="header-btn btn-gray-outline"
              onClick={onGoLogin}
              title="লগইন করুন"
              type="button"
            >
              <LogIn size={14} />
              লগইন
            </button>
           ) : (
            <button
              className="header-btn btn-red"
              onClick={onLogout}
              title="লগআউট"
              type="button"
            >
              <LogOut size={14} />
              লগআউট
            </button>
          )}
        </div>

        {/* ✅ Mobile hamburger — OUTSIDE .topbar-actions (mobile-only) */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
          type="button"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ==================================================
          ✅ MOBILE BUTTON BAR (Reference Design)
          Only visible on mobile (< 767px)
          ================================================== */}
      <div className="mobile-button-bar">
        {/* Row 1: Booking + Preview */}
        <div className="mobile-button-row">
          <button
            className="mobile-action-btn btn-teal"
            onClick={() => onSetView('booking')}
            type="button"
          >
            <CalendarPlus size={16} />
            <span>ডাক্তার অ্যাপয়েন্টমেন্ট</span>
            <ChevronRight size={14} />
          </button>

          <button
            className="mobile-action-btn btn-blue-outline"
            onClick={() => onSetView('preview')}
            type="button"
          >
            <Users size={16} />
            <span>ডাক্তার তালিকা</span>
          </button>
        </div>

        {/* Row 2: Report + Login/Logout */}
        <div className="mobile-button-row">
          {!isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
            <button
              className="mobile-action-btn btn-gray-outline"
              onClick={() => onSetView('dashboard')}
              type="button"
            >
              <ClipboardList size={16} />
              <span>রিপোর্ট</span>
              <ChevronDown size={14} />
            </button>
          )}

          {isGuest && (
            <button
              className="mobile-action-btn btn-gray-outline"
              onClick={onGoLogin}
              type="button"
            >
              <LogIn size={16} />
              <span>লগইন</span>
            </button>
          )}

          {!isGuest && (
            <button
              className="mobile-action-btn btn-gray-outline"
              onClick={onLogout}
              type="button"
            >
              <LogOut size={16} />
              <span>লগআউট</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          MOBILE NAVIGATION MENU (Hamburger Drawer)
          ================================================== */}
      <div
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <div className={`mobile-nav-panel ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-nav-header">
          <div className="mobile-nav-title">মেনু</div>
          <button
            className="mobile-nav-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mobile-nav-items">
          {/* Panel Builder */}
          {!isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
            <button
              className={`mobile-nav-item ${
                activeView === 'edit' ? 'is-active' : ''
              }`}
              onClick={() => {
                onSetView('edit');
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <Settings size={18} />
              প্যানেল বিল্ডার
            </button>
          )}

          {/* Doctors List */}
          {!isGuest && (isSubAdmin || isAdmin) && (
            <button
              className={`mobile-nav-item ${
                activeView === 'doctors' ? 'is-active' : ''
              }`}
              onClick={() => {
                onSetView('doctors');
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <Users size={18} />
              ডাক্তার লিস্ট
            </button>
          )}

          {/* Dashboard */}
          {!isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
            <button
              className={`mobile-nav-item ${
                activeView === 'dashboard' ? 'is-active' : ''
              }`}
              onClick={() => {
                onSetView('dashboard');
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <LayoutDashboard size={18} />
              ড্যাশবোর্ড
            </button>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <button
              className={`mobile-nav-item ${
                activeView === 'admin' ? 'is-active' : ''
              }`}
              onClick={() => {
                onSetView('admin');
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <Shield size={18} />
              অ্যাডমিন প্যানেল
            </button>
          )}

          {/* MOU */}
          {isAdmin && (
            <button
              className={`mobile-nav-item ${
                activeView === 'mou' ? 'is-active' : ''
              }`}
              onClick={() => {
                onGoMou();
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <ClipboardList size={18} />
              MOU
            </button>
          )}

          {/* Doctor Dashboard */}
          {!isGuest && isDoctorLoggedIn && (
            <button
              className="mobile-nav-item"
              onClick={() => {
                onGoDoctorDashboard();
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <Stethoscope size={18} />
              ডাক্তার ড্যাশবোর্ড
            </button>
          )}

          {/* My Bookings */}
          {!isGuest && !isDoctorLoggedIn && (
            <button
              className="mobile-nav-item"
              onClick={() => {
                onGoMyBookings();
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <Ticket size={18} />
              আমার সিরিয়াল
            </button>
          )}

          {/* Home */}
          <button
            className="mobile-nav-item"
            onClick={() => {
              onGoHome();
              setMobileMenuOpen(false);
            }}
            type="button"
          >
            <Stethoscope size={18} />
            হোমপেজ
          </button>

          {/* Login / Logout */}
          {isGuest ? (
            <button
              className="mobile-nav-item"
              onClick={() => {
                onGoLogin();
                setMobileMenuOpen(false);
              }}
              type="button"
            >
              <LogIn size={18} />
              লগইন
            </button>
          ) : (
            <button
              className="mobile-nav-item"
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              type="button"
              style={{ color: '#dc2626' }}
            >
              <LogOut size={18} />
              লগআউট
            </button>
          )}
        </div>
      </div>
    </>
  );
}