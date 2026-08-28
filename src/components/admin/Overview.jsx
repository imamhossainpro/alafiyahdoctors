import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3', '#e0653a', '#4438ab'];

export default function Overview({ appointments }) {
  const total = appointments.length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const checkedIn = appointments.filter(a => a.status === 'checked-in').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const noShow = appointments.filter(a => a.status === 'no-show').length;

  const bookingToVisit = total > 0 ? ((completed + checkedIn) / total) * 100 : 0;
  const checkedInRate = total > 0 ? (checkedIn / total) * 100 : 0;
  const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
  const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

  const doctorCounts = {};
  appointments.forEach(a => { doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1; });
  const doctorData = Object.entries(doctorCounts).map(([name, count]) => ({ name, count }));

  const referralCounts = {};
  appointments.forEach(a => { const src = a.referralSource || 'Unknown'; referralCounts[src] = (referralCounts[src] || 0) + 1; });
  const referralData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Pending', value: pending },
    { name: 'Confirmed', value: confirmed },
    { name: 'Checked-in', value: checkedIn },
    { name: 'Completed', value: completed },
    { name: 'Cancelled', value: cancelled },
    { name: 'No-show', value: noShow }
  ];

  // লোকেশন ডেটা প্রসেস করা (ঠিকানা থেকে জেলা বের করা)
  const locationCounts = {};
  appointments.forEach(a => {
    if (a.address) {
      const parts = a.address.split(',').map(s => s.trim()).filter(Boolean);
      const location = parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    } else {
      locationCounts['Unknown'] = (locationCounts['Unknown'] || 0) + 1;
    }
  });

  const locationData = Object.entries(locationCounts).map(([name, count]) => ({ name, count }));

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
    last7Days.push({ name: dayName, count: appointments.filter(a => a.bookingDate === dayStr).length });
  }

  const renderLegend = (value, entry) => {
    const totalValue = entry.payload.value;
    const percentage = total > 0 ? ((totalValue / total) * 100).toFixed(0) : 0;
    return <span style={{ color: '#475569', fontSize: '13px' }}>{value} ({percentage}%)</span>;
  };

  const kpis = [
    { label: 'Total', value: total, color: '#1c5fa8' },
    { label: 'Pending', value: pending, color: '#d97706' },
    { label: 'Confirmed', value: confirmed, color: '#3b82f6' },
    { label: 'Checked-in', value: checkedIn, color: '#8b5cf6' },
    { label: 'Completed', value: completed, color: '#22c55e' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444' },
    { label: 'No-show', value: noShow, color: '#6b7280' }
  ];

  return (
    <div style={{ width: '100%', color: '#1f2937' }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{ 
            flex: '1 1 130px', 
            background: '#ffffff', 
            padding: '15px', 
            borderRadius: '10px', 
            border: '1px solid #e2e8f0',
            minWidth: '130px'
          }}>
            <h4 style={{ color: '#64748b', fontSize: '14px' }}>{kpi.label}</h4>
            <h2 style={{ color: kpi.color, margin: '5px 0' }}>{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* Conversion Metrics */}
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

      {/* Trend Chart */}
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

      {/* Status & Referral Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ marginBottom: '10px', color: '#1f2937' }}>রেফারেল সোর্স</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={referralData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {referralData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} formatter={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 👇 লোকেশনভিত্তিক ভিজ্যুয়াল ডেটা (Donut Chart) */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px', color: '#1f2937' }}>লোকেশন ডিস্ট্রিবিউশন (Donut Chart)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={locationData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
              {locationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 👇 লোকেশনভিত্তিক ভিজ্যুয়াল ডেটা (Horizontal Bar Chart) */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '15px', color: '#1f2937' }}>লোকেশনভিত্তিক রোগী (জেলা/শহর)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#d97706" radius={[0, 5, 5, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Doctor wise Bar Chart */}
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