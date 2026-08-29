import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { getAllPatients } from '../../services/patientService';

// ---------- অটোমেটিক লোকেশন গ্রুপিং ইউটিলিটি ----------
const banglaToEnglishMap = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
  'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
  'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u',
  'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n'
};

const transliterateBangla = (str) => {
  let result = '';
  for (const char of str) {
    result += banglaToEnglishMap[char] || char;
  }
  return result;
};

const cleanText = (str) => {
  return str
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')
    .normalize('NFKC');
};

const removeSuffixes = (str) => {
  const suffixes = [
    'রোড', 'এক্সেস রোড', 'access road', 'road', 'bazar', 'hat', 'more', 'mor',
    'শাহ', 'shah', 'সিটি', 'city', 'জেলা', 'district', 'থানা', 'upazila',
    'পৌরসভা', 'municipality', 'corporation', 'কলোনি', 'colony', 'আবাসিক', 'residential',
    'লেন', 'সড়ক', 'আলি', 'হাউস', 'বাড়ি', 'রোড', 'এক্সেস'
  ];
  let cleaned = str;
  for (const suf of suffixes) {
    const regex = new RegExp(`\\s*${suf}\\s*$`, 'i');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.trim();
};

const normalizeLocation = (raw) => {
  if (!raw) return '';
  let cleaned = raw.trim();
  const hasBangla = /[\u0980-\u09FF]/.test(cleaned);
  if (hasBangla) {
    cleaned = transliterateBangla(cleaned);
  }
  cleaned = cleanText(cleaned);
  cleaned = removeSuffixes(cleaned);
  return cleaned;
};

const getBigrams = (str) => {
  const bigrams = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
};

const jaccardSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const bigrams1 = new Set(getBigrams(str1));
  const bigrams2 = new Set(getBigrams(str2));
  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
  const union = new Set([...bigrams1, ...bigrams2]);
  return intersection.size / (union.size || 1);
};

const groupLocationsAutomatically = (rawLocations) => {
  const valid = rawLocations.filter(loc => loc && loc.trim().length > 0);
  if (valid.length === 0) return [];

  const normalized = valid.map(loc => ({
    raw: loc,
    normalized: normalizeLocation(loc)
  }));

  const groups = [];
  const used = new Set();

  for (let i = 0; i < normalized.length; i++) {
    if (used.has(i)) continue;
    const group = {
      items: [normalized[i].raw],
      normalizedKeys: [normalized[i].normalized]
    };
    used.add(i);

    for (let j = i + 1; j < normalized.length; j++) {
      if (used.has(j)) continue;
      const sim = jaccardSimilarity(normalized[i].normalized, normalized[j].normalized);
      if (sim > 0.6) {
        group.items.push(normalized[j].raw);
        group.normalizedKeys.push(normalized[j].normalized);
        used.add(j);
      }
    }
    groups.push(group);
  }

  const result = groups.map(group => {
    const freq = {};
    group.items.forEach(item => { freq[item] = (freq[item] || 0) + 1; });
    const canonical = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
    return { canonical, count: group.items.length };
  });

  result.sort((a, b) => b.count - a.count);
  return result;
};

// ---------- রঙ ও স্টাইল ----------
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

// ---------- মূল কম্পোনেন্ট ----------
export default function Overview({ appointments }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 রোগী ডেটা লোড
  useEffect(() => {
    const loadPatients = async () => {
      const data = await getAllPatients();
      setPatients(data);
      setLoading(false);
    };
    loadPatients();
  }, []);

  // ---------- অ্যাপয়েন্টমেন্ট থেকে KPI ----------
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

  // 🆕 রোগী-ভিত্তিক KPI
  const totalPatients = patients.length;
  const newPatients = patients.filter(p => p.totalVisits === 1).length;
  const followUpPatients = patients.filter(p => p.totalVisits > 1).length;
  const repeatRate = totalPatients > 0 ? (followUpPatients / totalPatients) * 100 : 0;

  // ডাক্তারভিত্তিক ডেটা
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
      const age = Number(a.age);
      if (age <= 12) ageGroups['০-১২']++;
      else if (age <= 20) ageGroups['১৩-২০']++;
      else if (age <= 30) ageGroups['২১-৩০']++;
      else if (age <= 40) ageGroups['৩১-৪০']++;
      else if (age <= 50) ageGroups['৪১-৫০']++;
      else ageGroups['৫০+']++;
    }
  });
  const ageData = Object.entries(ageGroups).map(([name, count]) => ({ name, count }));

  // রেফারেল ডেটা
  const referralCounts = {};
  appointments.forEach(a => { const src = a.referralSource || 'Unknown'; referralCounts[src] = (referralCounts[src] || 0) + 1; });
  const referralData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));

  // লোকেশন ডেটা
  const rawLocations = appointments.map(a => a.address).filter(Boolean);
  const groupedLocations = groupLocationsAutomatically(rawLocations);
  const locationData = groupedLocations.map(({ canonical, count }) => ({ name: canonical, count }));

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

  // KPI কার্ড (অ্যাপয়েন্টমেন্ট + রোগী)
  const kpis = [
    { label: 'Total Bookings', value: total, color: '#1c5fa8', bg: 'rgba(28, 95, 168, 0.1)' },
    { label: 'Pending', value: pending, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Confirmed', value: confirmed, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Checked-in', value: checkedIn, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Completed', value: completed, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'No-show', value: noShow, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    // 🆕 রোগী KPI
    { label: 'Total Patients', value: totalPatients, color: '#1c5fa8', bg: 'rgba(28, 95, 168, 0.1)' },
    { label: 'New Patients', value: newPatients, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Follow-up', value: followUpPatients, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Repeat Rate', value: repeatRate.toFixed(1) + '%', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
  ];

  const conversions = [
    { label: 'Booking to Visit', value: bookingToVisit.toFixed(1), color: '#22c55e', prefix: '%' },
    { label: 'Checked-in Rate', value: checkedInRate.toFixed(1), color: '#8b5cf6', prefix: '%' },
    { label: 'No-show Rate', value: noShowRate.toFixed(1), color: '#6b7280', prefix: '%' },
    { label: 'Cancellation Rate', value: cancellationRate.toFixed(1), color: '#ef4444', prefix: '%' }
  ];

  if (loading) return <div style={{ padding: '20px' }}>লোড হচ্ছে...</div>;

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

      {/* Referral & Location */}
      <div className="overview-main-grid">
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>রেফারেল সোর্স</h4>
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

        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>লোকেশনভিত্তিক রোগী (অটোমেটিক গ্রুপকৃত)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={locationData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" radius={[0, 5, 5, 0]} barSize={20}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department, Age, Doctor Leaderboard */}
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