import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import SuperAdminOverview from './components/superadmin/Overview';
import SuperAdminHospitals from './components/superadmin/Hospitals';
import SuperAdminHospitalDetails from './components/superadmin/HospitalDetails';
import SuperAdminUsers from './components/superadmin/Users';
import SuperAdminSubscriptions from './components/superadmin/Subscriptions';
import SuperAdminActivityLogs from './components/superadmin/ActivityLogs';
import { ProtectedRoute } from './components/ProtectedRoute';
import TestData from './TestData';

const DoctorPanelBuilder = lazy(() => import('./doctor-panel-builder'));
const QueueDisplay = lazy(() => import('./components/QueueDisplay'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const CheckIn = lazy(() => import('./components/CheckIn'));

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#64748b' }}>
    <span>Loading...</span>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* টেস্ট রাউট */}
            <Route path="/test" element={<TestData />} />

            {/* হোম ও অন্যান্য পাবলিক রাউট */}
            <Route path="/" element={<DoctorPanelBuilder />} />
            <Route path="/booking" element={<DoctorPanelBuilder />} />
            <Route path="/doctors" element={<DoctorPanelBuilder />} />
            <Route path="/edit" element={<DoctorPanelBuilder />} />
            <Route path="/dashboard" element={<DoctorPanelBuilder />} />
            <Route path="/admin" element={<DoctorPanelBuilder />} />
            <Route path="/display" element={<QueueDisplay />} />
            <Route path="/checkin/:appointmentId" element={<CheckIn />} />

            {/* ===== সুপার অ্যাডমিন রাউট ===== */}
            <Route 
              path="/super-admin" 
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SuperAdminOverview />} />
              <Route path="hospitals" element={<SuperAdminHospitals />} />
              <Route path="hospitals/:id" element={<SuperAdminHospitalDetails />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
              <Route path="activity" element={<SuperAdminActivityLogs />} />
            </Route>

            {/* ৪০৪ নট ফাউন্ড */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </HospitalProvider>
    </AuthProvider>
  );
}

export default App;