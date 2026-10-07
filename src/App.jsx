// src/App.jsx
// ==================================================
// 🎯 App Router — Full Version with /mou support
// ==================================================
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';

// Lazy load components
const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const MOUPage = lazy(() => import('./components/MOUPage'));

const Loader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#64748b',
    }}
  >
    <span>Loading...</span>
  </div>
);

function App() {
  return (
    <>
      {/* ✅ GA4 page_view tracking */}
      <AnalyticsTracker />

      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ========== Main App Routes ========== */}
          <Route path="/" element={<DoctorPanelBuilder />} />
          <Route path="/login" element={<DoctorPanelBuilder />} />

          {/* ✅ MOU page — login/AuthPage দেখাবে */}
          <Route path="/mou" element={<DoctorPanelBuilder />} />

          {/* ✅ Doctor-specific booking (MUST come BEFORE /booking) */}
          <Route path="/booking/:doctorId" element={<DoctorPanelBuilder />} />

          {/* Generic booking */}
          <Route path="/booking" element={<DoctorPanelBuilder />} />

          <Route path="/doctors" element={<DoctorPanelBuilder />} />
          <Route path="/edit" element={<DoctorPanelBuilder />} />
          <Route path="/dashboard" element={<DoctorPanelBuilder />} />
          <Route path="/admin" element={<DoctorPanelBuilder />} />

          {/* ========== Standalone Routes ========== */}
          <Route path="/display" element={<QueueDisplay />} />
          <Route path="/checkin/:appointmentId" element={<CheckIn />} />

          {/* ========== 404 ========== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;