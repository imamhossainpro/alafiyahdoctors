import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3', '#e0653a', '#4438ab'];

export default function Overview({ appointments, filter, customRange }) {
  
  // ফিল্টার অনুযায়ী ডেটা ফিল্টার করা
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStr = startOfWeek.toISOString().split('T')[0];
    const monthStr = startOfMonth.toISOString().split('T')[0];

    if (filter === 'today') return appointments.filter(a => a.bookingDate === todayStr);
    if (filter === 'week') return appointments.filter(a => a.bookingDate && a.bookingDate >= weekStr);
    if (filter === 'month') return appointments.filter(a => a.bookingDate && a.bookingDate >= monthStr);
    if (filter === 'custom' && customRange && customRange.startDate && customRange.endDate) {
      return appointments.filter(a => a.bookingDate && a.bookingDate >= customRange.startDate && a.bookingDate <= customRange.endDate);
    }
    return appointments;
  }, [appointments, filter, customRange]);

  const total = filteredData.length;
  const pending = filteredData.filter(a => a.status === 'pending').length;
  const confirmed = filteredData.filter(a => a.status === 'confirmed').length;
  const checkedIn = filteredData.filter(a => a.status === 'checked-in').length;
  const completed = filteredData.filter(a => a.status === 'completed').length;
  const cancelled = filteredData.filter(a => a.status === 'cancelled').length;
  const noShow = filteredData.filter(a => a.status === 'no-show').length;

  const bookingToVisit = total > 0 ? ((completed + checkedIn) / total) * 100 : 0;
  const checkedInRate = total > 0 ? (checkedIn / total) * 100 : 0;
  const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

  const doctorCounts = {};
  filteredData.forEach(a => { doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1; });
  const doctorData = Object.entries(doctorCounts).map(([name, count]) => ({ name, count }));

  // রেফারেল সোর্স ডেটা তৈরি
  const referralCounts = {};
  filteredData.forEach(a => { const src = a.referralSource || 'Unknown'; referralCounts[src] = (referralCounts[src] || 0) + 1; });
  const referralData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Pending', value: pending },
    { name: 'Confirmed', value: confirmed },
    { name: 'Checked-in', value: checkedIn },
    { name: 'Completed', value: completed },
    { name: 'Cancelled', value: cancelled },
    { name: 'No-show', value: noShow }
  ];

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
    last7Days.push({ name: dayName, count: appointments.filter(a => a.bookingDate === dayStr).length });
  }

  // কাস্টম লেজেন্ড ফরম্যাটার (শতকরা হার সহ)
  const renderLegend = (value, entry) => {
    const totalValue = entry.payload.value;
    const percentage = total > 0 ? ((totalValue / total) * 100).toFixed(0) : 0;
    return <span style={{ color: '#475569', fontSize: '13px' }}>{value} ({percentage}%)</span>;
  };

  return (
    <div style={{ width: '100%', color: '#1f2937' }}>
      {/* KPI কার্ডস */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Total</h4>
          <h2 style={{ color: '#1c5fa8', margin: '5px 0' }}>{total}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Pending</h4>
          <h2 style={{ color: '#d97706', margin: '5px 0' }}>{pending}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Confirmed</h4>
          <h2 style={{ color: '#3b82f6', margin: '5px 0' }}>{confirmed}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Checked-in</h4>
          <h2 style={{ color: '#8b5cf6', margin: '5px 0' }}>{checkedIn}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Completed</h4>
          <h2 style={{ color: '#22c55e', margin: '5px 0' }}>{completed}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>Cancelled</h4>
          <h2 style={{ color: '#ef4444', margin: '5px 0' }}>{cancelled}</h2>
        </div>
        <div style={{ background: '#ffffff', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px' }}>No-show</h4>
          <h2 style={{ color: '#6b7280', margin: '5px 0' }}>{noShow}</h2>
        </div>
      </div>

      {/* কনভার্সন মেট্রিক্স */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '15px', color: '#1f2937' }}>কনভার্সন মেট্রিক্স</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ borderLeft: '4px solid #22c55e', paddingLeft: '10px' }}>
            <strong style={{ color: '#475569' }}>Booking to Visit</strong><br/><span style={{ fontSize: '18px', fontWeight: '800', color: '#1c5fa8' }}>{bookingToVisit.toFixed(1)}%</span>
          </div>
          <div style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '10px' }}>
            <strong style={{ color: '#475569' }}>Checked-in Rate</strong><br/><span style={{ fontSize: '18px', fontWeight: '800', color: '#1c5fa8' }}>{checkedInRate.toFixed(1)}%</span>
          </div>
          <div style={{ borderLeft: '4px solid #6b7280', paddingLeft: '10px' }}>
            <strong style={{ color: '#475569' }}>No-show Rate</strong><br/><span style={{ fontSize: '18px', fontWeight: '800', color: '#1c5fa8' }}>{noShowRate.toFixed(1)}%</span>
          </div>
          <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '10px' }}>
            <strong style={{ color: '#475569' }}>Cancellation Rate</strong><br/><span style={{ fontSize: '18px', fontWeight: '800', color: '#1c5fa8' }}>{cancellationRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* লাইন চার্ট */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '15px', color: '#1f2937' }}>সিরিয়াল ট্রেন্ড</h4>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1c5fa8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1c5fa8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#1c5fa8" strokeWidth={3} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* দুটি পাই চার্ট (স্ট্যাটাস ও রেফারেল) একদম একই রকম করে সাজানো */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* স্ট্যাটাস ডিস্ট্রিবিউশন */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginBottom: '10px', color: '#1f2937' }}>স্ট্যাটাস ডিস্ট্রিবিউশন</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} formatter={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* রেফারেল সোর্স (এখন হুবহু একই রকম দেখাবে) */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginBottom: '10px', color: '#1f2937' }}>রেফারেল সোর্স</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={referralData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {referralData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              {/* 👇 এই লাইনটি যুক্ত করা হয়েছে যাতে স্ট্যাটাসের মতো নিচে শতকরা হারসহ লেবেল দেখায় */}
              <Legend verticalAlign="bottom" height={36} formatter={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ডাক্তারভিত্তিক সিরিয়াল */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h4 style={{ marginBottom: '15px', color: '#1f2937' }}>ডাক্তারভিত্তিক সিরিয়াল</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={doctorData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#0d9488" radius={[0, 5, 5, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}