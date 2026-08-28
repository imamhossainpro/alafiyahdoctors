import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';

const COLORS = ['#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3', '#e0653a', '#4438ab'];

const styles = {
  dashboardContainer: { display: 'flex', flexDirection: 'column', gap: '24px', color: '#1e293b' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' },
  kpiCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiLabel: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
  kpiValue: { fontSize: '30px', fontWeight: '800', lineHeight: '1.2' },
  kpiIconBox: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  conversionCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  conversionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' },
  chartCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  chartTitle: { fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: '#1e2937' },
};

const CSSString = `
  .overview-main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
  @media (max-width: 900px) { .overview-main-grid { grid-template-columns: 1fr; } }
`;

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

  // ডাক্তারভিত্তিক ডেটা (লিডারবোর্ড)
  const doctorCounts = {};
  appointments.forEach(a => { doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1; });
  const doctorData = Object.entries(doctorCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // বিভাগভিত্তিক ডেটা
  const departmentCounts = {};
  appointments.forEach(a => { departmentCounts[a.doctorDept || 'Unknown'] = (departmentCounts[a.doctorDept || 'Unknown'] || 0) + 1; });
  const departmentData = Object.entries(departmentCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // বয়স ডেটা
  const ageGroups = { '০-১২': 0, '১৩-২০': 0, '২১-৩০': 0, '৩১-৪০': 0, '৪১-৫০': 0, '৫০+': 0 };
  appointments.forEach(a => {
    if (a.age) {
      if (a.age <= 12) ageGroups['০-১২']++;
      else if (a.age <= 20) ageGroups['১৩-২০']++;
      else if (a.age <= 30) ageGroups['২১-৩০']++;
      else if (a.age <= 40) ageGroups['৩১-৪০']++;
      else if (a.age <= 50) ageGroups['৪১-৫০']++;
      else ageGroups['৫০+']++;
    }
  });
  const ageData = Object.entries(ageGroups).map(([name, count]) => ({ name, count }));

  // স্ট্যাটাস ডেটা
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

  const renderLegend = (value, entry) => {
    const totalValue = entry.payload.value;
    const percentage = total > 0 ? ((totalValue / total) * 100).toFixed(0) : 0;
    return <span style={{ color: '#475569', fontSize: '13px' }}>{value} ({percentage}%)</span>;
  };

  const kpis = [
    { label: 'Total', value: total, color: '#1c5fa8', bg: 'rgba(28, 95, 168, 0.1)' },
    { label: 'Pending', value: pending, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Confirmed', value: confirmed, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Checked-in', value: checkedIn, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Completed', value: completed, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'No-show', value: noShow, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' }
  ];

  const conversions = [
    { label: 'Booking to Visit', value: bookingToVisit.toFixed(1), color: '#22c55e', prefix: '%' },
    { label: 'Checked-in Rate', value: checkedInRate.toFixed(1), color: '#8b5cf6', prefix: '%' },
    { label: 'No-show Rate', value: noShowRate.toFixed(1), color: '#6b7280', prefix: '%' },
    { label: 'Cancellation Rate', value: cancellationRate.toFixed(1), color: '#ef4444', prefix: '%' }
  ];

  return (
    <div style={styles.dashboardContainer}>
      <style>{CSSString}</style>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <div key={index} style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>{kpi.label}</span>
              <div style={{ ...styles.kpiIconBox, background: kpi.bg }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: kpi.color }} />
              </div>
            </div>
            <div style={{ ...styles.kpiValue, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Conversion Metrics */}
      <div style={styles.conversionCard}>
        <h4 style={styles.chartTitle}>কনভার্সন মেট্রিক্স</h4>
        <div style={styles.conversionGrid}>
          {conversions.map((conv, index) => (
            <div key={index} style={{ borderLeft: `4px solid ${conv.color}`, paddingLeft: '10px' }}>
              <strong style={{ color: '#475569', fontSize: '13px' }}>{conv.label}</strong>
              <br/>
              <span style={{ fontSize: '24px', fontWeight: '800', color: conv.color }}>
                {conv.value}{conv.prefix}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend & Status */}
      <div className="overview-main-grid">
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>সিরিয়াল ট্রেন্ড (গত ৭ দিন)</h4>
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

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>স্ট্যাটাস ডিস্ট্রিবিউশন</h4>
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
      </div>

      {/* Department & Age & Doctor */}
      <div className="overview-main-grid">
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>বিভাগভিত্তিক রোগী (Department-wise)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0e8ca3" radius={[0, 5, 5, 0]} barSize={20}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>রোগীর বয়স পরিসীমা</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2f9e52" radius={[5, 5, 0, 0]} barSize={40}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>👨‍⚕️ ডাক্তারভিত্তিক সিরিয়াল (লিডারবোর্ড)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={doctorData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={200} 
                interval={0}
                tick={{ fontSize: 12, fill: '#334155' }}
              />
              <Tooltip formatter={(value) => [`${value} সিরিয়াল`, 'মোট']} />
              <Bar dataKey="count" fill="#9c3a9c" radius={[0, 5, 5, 0]} barSize={20}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 14, fontWeight: 700, fill: '#6d28d9' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}