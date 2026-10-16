// src/App.jsx
// ==================================================
// 🏥 Al-Afiyah Hospital — Root App Component
// ==================================================
// ✅ React Router v7 setup
// ✅ Lazy-loaded routes (code splitting)
// ✅ AnalyticsTracker (GA4 + Meta Pixel PageView)
// ✅ Context Providers already wrapped in main.jsx
// ==================================================
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';

// ==================================================
// ✅ Lazy Load Components (code splitting)
// ==================================================
const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const BookingSuccess = lazy(() => import('./components/BookingSuccess'));

// ✅ NEW — Patient dashboard pages
const PatientDashboard = lazy(() => import('./components/patient/PatientDashboard'));
const AddMobilePage = lazy(() => import('./components/AddMobilePage'));
const UserProfile = lazy(() => import('./components/UserProfile'));

// ✅ NEW — Doctor dashboard
const DoctorDashboard = lazy(() => import('./components/DoctorDashboard'));

// ✅ NEW — MOU
const MouPage = lazy(() => import('./components/MouPage'));

// ==================================================
// ✅ Loading Fallback
// ==================================================
const Loader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#64748b',
      fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
    }}
  >
    <span>লোড হচ্ছে...</span>
  </div>
);

// ==================================================
// ✅ App Component
// ==================================================
function App() {
  return (
    <>
      {/* ✅ GA4 + Meta Pixel page_view tracking (route change-এ auto fire) */}
      <AnalyticsTracker />

      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ==============================================
              🏥 Public Routes (Doctor Panel Builder)
              ============================================== */}
          <Route path="/" element={<DoctorPanelBuilder />} />
          <Route path="/login" element={<DoctorPanelBuilder />} />

          {/* Doctor-specific booking — MUST come BEFORE /booking */}
          <Route path="/booking/:doctorId" element={<DoctorPanelBuilder />} />

          {/* Generic booking (all doctors) */}
          <Route path="/booking" element={<DoctorPanelBuilder />} />

          {/* Booking success thank-you page */}
          <Route
            path="/booking-success/:appointmentId"
            element={<BookingSuccess />}
          />

          {/* Admin / Editor routes */}
          <Route path="/doctors" element={<DoctorPanelBuilder />} />
          <Route path="/edit" element={<DoctorPanelBuilder />} />
          <Route path="/dashboard" element={<DoctorPanelBuilder />} />
          <Route path="/admin" element={<DoctorPanelBuilder />} />

          {/* ✅ MOU (Memorandum of Understanding) routes */}
          <Route path="/mou" element={<DoctorPanelBuilder />} />
          <Route path="/mou/:mouId" element={<DoctorPanelBuilder />} />

          {/* ==============================================
              📺 TV / Display Routes
              ============================================== */}
          <Route path="/display" element={<QueueDisplay />} />

          {/* ==============================================
              ✅ Patient Routes
              ============================================== */}
          <Route path="/my-bookings" element={<PatientDashboard />} />
          <Route path="/add-mobile" element={<AddMobilePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/mou-public" element={<MouPage />} />

          {/* ==============================================
              🩺 Doctor Dashboard
              ============================================== */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/:tab" element={<DoctorDashboard />} />

          {/* ==============================================
              ✅ Check-in (QR scan)
              ============================================== */}
          <Route path="/checkin/:appointmentId" element={<CheckIn />} />

          {/* ==============================================
              ❌ 404 — Not Found
              ============================================== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;