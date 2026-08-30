import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn')); // 👈 নতুন

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#64748b' }}>
    <span>লোড হচ্ছে...</span>
  </div>
);

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<DoctorPanelBuilder />} />
        <Route path="/booking" element={<DoctorPanelBuilder />} />
        <Route path="/doctors" element={<DoctorPanelBuilder />} />
        <Route path="/edit" element={<DoctorPanelBuilder />} />
        <Route path="/dashboard" element={<DoctorPanelBuilder />} />
        <Route path="/admin" element={<DoctorPanelBuilder />} />
        <Route path="/display" element={<QueueDisplay />} />
        
        {/* 🔥 চেক-ইন রাউট */}
        <Route path="/checkin/:appointmentId" element={<CheckIn />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;