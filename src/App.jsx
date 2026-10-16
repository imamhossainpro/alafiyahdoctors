// src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsTracker from './components/AnalyticsTracker';

const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const BookingSuccess = lazy(() => import('./components/BookingSuccess'));
const PatientDashboard = lazy(() => import('./components/patient/PatientDashboard'));
const AddMobilePage = lazy(() => import('./components/AddMobilePage'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const DoctorDashboard = lazy(() => import('./components/DoctorDashboard'));

// ✅ NEW: Public All Doctors directory
const AllDoctorsPage = lazy(() => import('./AllDoctorsPage'));

const Loader = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', fontSize: '18px', color: '#64748b',
    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
  }}>
    <span>লোড হচ্ছে...</span>
  </div>
);

function App() {
  return (
    <>
      <AnalyticsTracker />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ===== Public Routes ===== */}
          <Route path="/" element={<DoctorPanelBuilder />} />
          <Route path="/login" element={<DoctorPanelBuilder />} />
          <Route path="/booking/:doctorId" element={<DoctorPanelBuilder />} />
          <Route path="/booking" element={<DoctorPanelBuilder />} />

          {/* ✅ NEW: Public All Doctors directory */}
          <Route path="/all-doctors" element={<AllDoctorsPage />} />

          <Route path="/booking-success/:appointmentId" element={<BookingSuccess />} />

          {/* ===== Admin/Editor routes ===== */}
          <Route path="/doctors" element={<DoctorPanelBuilder />} />
          <Route path="/edit" element={<DoctorPanelBuilder />} />
          <Route path="/dashboard" element={<DoctorPanelBuilder />} />
          <Route path="/admin" element={<DoctorPanelBuilder />} />

          <Route path="/mou" element={<DoctorPanelBuilder />} />
          <Route path="/mou/:mouId" element={<DoctorPanelBuilder />} />

          {/* ===== Display ===== */}
          <Route path="/display" element={<QueueDisplay />} />

          {/* ===== Patient Routes ===== */}
          <Route path="/my-bookings" element={<PatientDashboard />} />
          <Route path="/add-mobile" element={<AddMobilePage />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* ===== Doctor Dashboard ===== */}
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/:tab" element={<DoctorDashboard />} />

          {/* ===== Check-in ===== */}
          <Route path="/checkin/:appointmentId" element={<CheckIn />} />

          {/* ===== 404 ===== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;