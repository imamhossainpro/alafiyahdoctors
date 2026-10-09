// src/App.jsx
// ==================================================
// 🎯 App Router — Full Version
// ==================================================
// ✅ সব routes: patient, doctor panel, MOU, admin, doctor dashboard
// ✅ /add-mobile — Google/Email user-এর mobile verify
// ✅ /my-bookings — Patient dashboard
// ✅ /doctor — Doctor's own dashboard (designation: 'Doctor')
// ✅ /mou — MOU Generator (dynamic content)
// ✅ /booking/:doctorId — Direct doctor booking
// ✅ Lazy loading + Suspense
// ==================================================
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';

// ==================================================
// ✅ Lazy load components
// ==================================================
const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const MOUGenerator = lazy(() => import('./components/MOUGenerator'));
const AddMobilePage = lazy(() => import('./components/AddMobilePage'));
const PatientDashboard = lazy(
  () => import('./components/patient/PatientDashboard')
);
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const UserProfile = lazy(() => import('./components/UserProfile'));

// ✅ NEW: Doctor Dashboard
const DoctorDashboard = lazy(() => import('./components/DoctorDashboard'));

// ==================================================
// ✅ Global Loader
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
      fontFamily:
        "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#1c5fa8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 14px',
        }}
      />
      <span>লোড হচ্ছে...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// ==================================================
// ✅ Main App
// ==================================================
function App() {
  return (
    <>
      {/* ✅ GA4 page_view tracking — route change হলে auto track করবে */}
      <AnalyticsTracker />

      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ==================================================
              🏠 Doctor Panel (একটি multi-route component)
              ================================================== */}
          <Route path="/" element={<DoctorPanelBuilder />} />
          <Route path="/login" element={<DoctorPanelBuilder />} />
          <Route path="/preview" element={<DoctorPanelBuilder />} />
          <Route path="/edit" element={<DoctorPanelBuilder />} />
          <Route path="/doctors" element={<DoctorPanelBuilder />} />
          <Route path="/dashboard" element={<DoctorPanelBuilder />} />
          <Route path="/admin" element={<DoctorPanelBuilder />} />

          {/* ==================================================
              📅 Booking Routes
              ================================================== */}
          {/* ✅ Doctor-specific booking — MUST come BEFORE /booking */}
          <Route
            path="/booking/:doctorId"
            element={<DoctorPanelBuilder />}
          />
          {/* Generic booking */}
          <Route path="/booking" element={<DoctorPanelBuilder />} />

          {/* ==================================================
              👤 Patient Routes (Google/Email/Phone Login)
              ================================================== */}
          <Route path="/add-mobile" element={<AddMobilePage />} />
          <Route path="/my-bookings" element={<PatientDashboard />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* ==================================================
              🩺 Doctor Dashboard (own dashboard)
              Designation = 'Doctor' হলে accessible
              ================================================== */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/patients" element={<DoctorDashboard />} />
          <Route path="/doctor/reports" element={<DoctorDashboard />} />
          <Route path="/doctor/history" element={<DoctorDashboard />} />
          <Route path="/doctor/schedule" element={<DoctorDashboard />} />
          <Route path="/doctor/profile" element={<DoctorDashboard />} />

          {/* ==================================================
              📄 MOU Generator — Dynamic content (Firestore-driven)
              Public route — login ছাড়াই দেখা যাবে
              ================================================== */}
          <Route path="/mou" element={<MOUGenerator />} />

          {/* ==================================================
              📺 Standalone Routes
              ================================================== */}
          <Route path="/display" element={<QueueDisplay />} />
          <Route path="/checkin/:appointmentId" element={<CheckIn />} />

          {/* ==================================================
              🔄 Legacy Redirects
              ================================================== */}
          <Route
            path="/bookings"
            element={<Navigate to="/my-bookings" replace />}
          />
          <Route
            path="/signup"
            element={<Navigate to="/login" replace />}
          />

          {/* ==================================================
              🚫 404 Catch-all (সবার শেষে থাকতে হবে)
              ================================================== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;