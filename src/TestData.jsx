import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TestData() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ১. ডিপার্টমেন্ট লোড
        const deptSnap = await getDocs(collection(db, 'hospitals', 'alafiyah_main', 'departments'));
        console.log('📂 ডিপার্টমেন্ট:', deptSnap.size);
        const deptList = deptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDepartments(deptList);

        // ২. প্রতিটি ডিপার্টমেন্টের ডাক্তার লোড
        let allDocs = [];
        for (const dept of deptList) {
          const docSnap = await getDocs(collection(db, 'hospitals', 'alafiyah_main', 'departments', dept.id, 'doctors'));
          console.log(`👨‍⚕️ ${dept.name} তে ডাক্তার:`, docSnap.size);
          docSnap.forEach(d => {
            allDocs.push({ id: d.id, ...d.data(), department: dept.name });
          });
        }
        setDoctors(allDocs);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error:', err);
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div>লোড হচ্ছে...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 ডেটাবেজ চেক</h2>
      <h3>ডিপার্টমেন্ট: {departments.length}</h3>
      <pre>{JSON.stringify(departments, null, 2)}</pre>
      <h3>ডাক্তার: {doctors.length}</h3>
      <pre>{JSON.stringify(doctors, null, 2)}</pre>
    </div>
  );
}