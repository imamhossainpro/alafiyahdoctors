// PreviewPanel.jsx-এর শুরুতে
import React, { useState, useEffect, useRef } from 'react';
import { subscribeToOffDoctors } from '../services/doctorOverrideService';
import { useHospital } from '../context/HospitalContext';

function PreviewPanel({ panel, departments, checkedIds, footer, onBack, user }) {
  const printRef = useRef(null);
  const isAdmin = user?.role === 'admin';
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  // ✅ Subscribe to today's OFF doctors
  const [offDoctorIds, setOffDoctorIds] = useState(new Set());
  const today = getBDTodayString();

  useEffect(() => {
    const unsub = subscribeToOffDoctors(
      hospitalId,
      today,
      (ids) => setOffDoctorIds(ids),
      (err) => console.error('Off doctors sub error:', err)
    );
    return () => unsub();
  }, [hospitalId, today]);

  // ...existing code...

  // ✅ Doctors render করার সময় isOffToday prop পাঠান
  {dept.doctors.map((doc) => (
    <DoctorEntry
      key={doc.id}
      doc={doc}
      accentColor={dept.color}
      isOffToday={offDoctorIds.has(doc.id)}   // ✅ যোগ করুন
    />
  ))}
}