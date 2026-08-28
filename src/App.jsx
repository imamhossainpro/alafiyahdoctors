import { Routes, Route } from 'react-router-dom';
import DoctorPanelBuilder from './doctor-panel-builder';
import QueueDisplay from './components/QueueDisplay';
import NotFoundPage from './components/NotFoundPage'; // 👈 নতুন ইমপোর্ট

function App() {
  return (
    <Routes>
      {/* হোমপেইজ - প্রিভিউ */}
      <Route path="/" element={<DoctorPanelBuilder />} />
      
      {/* রোগী বুকিং */}
      <Route path="/booking" element={<DoctorPanelBuilder />} />
      
      {/* ডাক্তার লিস্ট (অ্যাডমিন/সাব-অ্যাডমিন) */}
      <Route path="/doctors" element={<DoctorPanelBuilder />} />
      
      {/* প্যানেল বিল্ডার (এডিটর/অ্যাডমিন) */}
      <Route path="/edit" element={<DoctorPanelBuilder />} />
      
      {/* ড্যাশবোর্ড (অ্যাডমিন/সাব-অ্যাডমিন) */}
      <Route path="/dashboard" element={<DoctorPanelBuilder />} />
      
      {/* অ্যাডমিন প্যানেল (শুধু অ্যাডমিন) */}
      <Route path="/admin" element={<DoctorPanelBuilder />} />
      
      {/* টিভি ডিসপ্লে */}
      <Route path="/display" element={<QueueDisplay />} />
      
      {/* 👇 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;