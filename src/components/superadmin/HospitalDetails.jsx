import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, collection, getDocs } from '../../firebase';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Users, Stethoscope, CreditCard } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export default function HospitalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { switchHospital } = useHospital();
  const [hospital, setHospital] = useState(null);
  const [stats, setStats] = useState({ users: 0, doctors: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const hSnap = await getDoc(doc(db, 'hospitals', id));
        if (!hSnap.exists()) { setLoading(false); return; }
        setHospital({ id: hSnap.id, ...hSnap.data() });

        const userSnap = await getDocs(collection(db, 'hospitals', id, 'users'));
        const deptSnap = await getDocs(collection(db, 'hospitals', id, 'departments'));
        let doctors = 0;
        deptSnap.docs.forEach(d => {
          const data = d.data();
          if (data.doctors) doctors += data.doctors.length;
        });
        const apptSnap = await getDocs(collection(db, 'hospitals', id, 'appointments'));
        setStats({ users: userSnap.size, doctors, bookings: apptSnap.size });
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSwitch = () => {
    switchHospital(id);
    navigate('/');
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (!hospital) return <div style={{ padding: '40px', textAlign: 'center' }}>Hospital not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/super-admin/hospitals')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Hospitals
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{hospital.name}</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>ID: {hospital.id}</p>
        </div>
        <button onClick={handleSwitch} style={{ padding: '8px 20px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Switch to this Hospital</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}><Users size={16} /> Users</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.users}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}><Stethoscope size={16} /> Doctors</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.doctors}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}><Calendar size={16} /> Bookings</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.bookings}</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}><CreditCard size={16} /> Subscription</div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{hospital.subscription || 'Trial'}</div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><strong>Address:</strong> {hospital.address || 'N/A'}</div>
          <div><strong>Phone:</strong> {hospital.phone || 'N/A'}</div>
          <div><strong>Email:</strong> {hospital.email || 'N/A'}</div>
          <div><strong>Status:</strong> {hospital.isActive !== false ? 'Active' : 'Inactive'}</div>
          <div><strong>Created:</strong> {hospital.createdAt ? new Date(hospital.createdAt).toLocaleDateString() : 'N/A'}</div>
          <div><strong>Plan:</strong> {hospital.plan || 'Trial'}</div>
        </div>
      </div>
    </div>
  );
}