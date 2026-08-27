import React, { useState, useEffect } from 'react';
import { subscribeToAppointments, updateAppointmentStatus, deleteAppointment } from '../services/appointmentService';
import Overview from './admin/Overview';
import AppointmentsTable from './admin/AppointmentsTable';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAppointments((data) => {
      setAppointments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id) => {
    await updateAppointmentStatus(id, 'approved');
  };

  const handlePending = async (id) => {
    await updateAppointmentStatus(id, 'pending');
  };

  const handleDelete = async (id) => {
    if (confirm('আপনি কি নিশ্চিত এই সিরিয়ালটি ডিলিট করতে চান?')) {
      await deleteAppointment(id);
    }
  };

  if (loading) return <div>লোড হচ্ছে...</div>;

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>অ্যাডমিন ড্যাশবোর্ড</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setTab('overview')} 
            style={{ padding: '8px 16px', background: tab === 'overview' ? '#1c5fa8' : '#eef1f7', color: tab === 'overview' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >পরিসংখ্যান</button>
          <button 
            onClick={() => setTab('appointments')} 
            style={{ padding: '8px 16px', background: tab === 'appointments' ? '#1c5fa8' : '#eef1f7', color: tab === 'appointments' ? '#fff' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >বুকিং লিস্ট</button>
        </div>
      </div>

      {tab === 'overview' && <Overview appointments={appointments} />}
      {tab === 'appointments' && (
        <AppointmentsTable 
          appointments={appointments} 
          onApprove={handleApprove} 
          onPending={handlePending} 
          onDelete={handleDelete} 
        />
      )}
    </div>
  );
}