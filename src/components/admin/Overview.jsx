import React from 'react';

export default function Overview({ appointments }) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = appointments.length;
  const daily = appointments.filter(a => new Date(a.timestamp || now) >= startOfToday).length;
  const weekly = appointments.filter(a => new Date(a.timestamp || now) >= startOfWeek).length;
  const monthly = appointments.filter(a => new Date(a.timestamp || now) >= startOfMonth).length;

  const doctorCounts = {};
  appointments.forEach(a => {
    doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1;
  });

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ marginBottom: '20px' }}>পরিসংখ্যান</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#666' }}>আজকের সিরিয়াল</h4>
          <h2 style={{ color: '#1c5fa8' }}>{daily}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#666' }}>এই সপ্তাহে</h4>
          <h2 style={{ color: '#1c5fa8' }}>{weekly}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#666' }}>এই মাসে</h4>
          <h2 style={{ color: '#1c5fa8' }}>{monthly}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h4 style={{ color: '#666' }}>মোট সিরিয়াল</h4>
          <h2 style={{ color: '#1c5fa8' }}>{total}</h2>
        </div>
      </div>

      <h3 style={{ margin: '30px 0 15px' }}>ডাক্তারভিত্তিক সিরিয়াল</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#1c5fa8', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>ডাক্তারের নাম</th>
            <th style={{ padding: '12px' }}>মোট সিরিয়াল</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(doctorCounts).length === 0 ? (
            <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center' }}>কোনো ডেটা নেই</td></tr>
          ) : (
            Object.entries(doctorCounts).map(([name, count]) => (
              <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{name}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}