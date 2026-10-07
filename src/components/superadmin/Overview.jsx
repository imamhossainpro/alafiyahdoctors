import React, { useState, useEffect } from 'react';
import { db, collection, getDocs, doc, getDoc } from '../../firebase';
import { useHospital } from '../../context/HospitalContext';
import { Hospital, Users, Stethoscope, Calendar, Activity, Building2 } from 'lucide-react';

const KpiCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div style={{
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{value}</div>
        {subtitle && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>}
      </div>
      <div style={{ background: color + '15', padding: '10px', borderRadius: '10px' }}>
        <Icon size={20} color={color} />
      </div>
    </div>
  </div>
);

export default function Overview() {
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    inactiveHospitals: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalBookings: 0,
    todayBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Hospitals
        const hospitalSnap = await getDocs(collection(db, 'hospitals'));
        const hospitals = hospitalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = hospitals.filter(h => h.isActive !== false);
        const inactive = hospitals.filter(h => h.isActive === false);

        // Users (from all hospitals + global users)
        const userSnap = await getDocs(collection(db, 'users'));
        const users = userSnap.docs.length;

        // Doctors (count from departments across hospitals)
        let doctorCount = 0;
        for (const h of hospitals) {
          const deptSnap = await getDocs(collection(db, 'hospitals', h.id, 'departments'));
          deptSnap.docs.forEach(d => {
            const data = d.data();
            if (data.doctors) doctorCount += data.doctors.length;
          });
        }

        // Bookings
        let totalBookings = 0;
        let todayBookings = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        for (const h of hospitals) {
          const apptSnap = await getDocs(collection(db, 'hospitals', h.id, 'appointments'));
          apptSnap.docs.forEach(d => {
            const data = d.data();
            totalBookings++;
            if (data.bookingDate === todayStr) todayBookings++;
          });
        }

        setStats({
          totalHospitals: hospitals.length,
          activeHospitals: active.length,
          inactiveHospitals: inactive.length,
          totalUsers: users,
          totalDoctors: doctorCount,
          totalBookings,
          todayBookings
        });
      } catch (err) {
        console.error('Overview stats error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;

  const cards = [
    { title: 'Total Hospitals', value: stats.totalHospitals, icon: Building2, color: '#8b5cf6' },
    { title: 'Active Hospitals', value: stats.activeHospitals, icon: Hospital, color: '#22c55e', subtitle: `${stats.inactiveHospitals} inactive` },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: '#3b82f6' },
    { title: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: '#ec4899' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: '#f59e0b' },
    { title: "Today's Bookings", value: stats.todayBookings, icon: Activity, color: '#14b8a6' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Platform Overview</h1>
        <p style={{ color: '#64748b', marginTop: '4px' }}>Global statistics across all hospitals</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {cards.map((card, i) => (
          <KpiCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
}