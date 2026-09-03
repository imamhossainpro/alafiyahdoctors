import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import SuperAdminDashboard from './components/SuperAdminDashboard';

const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn'));

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#64748b' }}>
    <span>লোড হচ্ছে...</span>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<DoctorPanelBuilder />} />
            <Route path="/booking" element={<DoctorPanelBuilder />} />
            <Route path="/doctors" element={<DoctorPanelBuilder />} />
            <Route path="/edit" element={<DoctorPanelBuilder />} />
            <Route path="/dashboard" element={<DoctorPanelBuilder />} />
            <Route path="/admin" element={<DoctorPanelBuilder />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/display" element={<QueueDisplay />} />
            <Route path="/checkin/:appointmentId" element={<CheckIn />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </HospitalProvider>
    </AuthProvider>
  );
}

export default App;