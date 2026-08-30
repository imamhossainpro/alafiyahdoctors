import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList,
  LineChart, Line
} from 'recharts';
import { getAllPatients } from '../../services/patientService';
import { X, Users, MapPin, TrendingUp, Calendar, ChevronDown } from 'lucide-react';

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
const COLORS = ['#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3', '#e0653a', '#4438ab', '#159a72', '#8a6a2e', '#7a2d5c'];

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
  chartTitle: { fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0', color: '#1e2937', display: 'flex', alignItems: 'center', gap: '8px' },
};

const CSSString = `
  .overview-main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
  @media (max-width: 900px) { .overview-main-grid { grid-template-columns: 1fr; } }
  
  .location-drill-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .location-drill-content {
    background: #fff;
    border-radius: 16px;
    max-width: 800px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .location-drill-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  .location-drill-header h3 {
    margin: 0;
    color: #1c5fa8;
  }
  .location-drill-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
  }
  .location-drill-body table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .location-drill-body th {
    background: #f1f5f9;
    padding: 10px 12px;
    text-align: left;
    color: #475569;
    font-weight: 600;
  }
  .location-drill-body td {
    padding: 8px 12px;
    border-bottom: 1px solid #eef2f6;
  }
  .location-drill-body tr:hover td {
    background: #f8fafc;
  }
  .close-drill-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #64748b;
    padding: 4px;
    border-radius: 50%;
    transition: background 0.2s;
  }
  .close-drill-btn:hover {
    background: #f1f5f9;
  }
  .location-trend-selector {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .location-trend-selector button {
    padding: 4px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .location-trend-selector button.active {
    background: #1c5fa8;
    color: #fff;
    border-color: #1c5fa8;
  }
  .location-trend-selector button:hover:not(.active) {
    background: #f1f5f9;
  }
`;

// ---------- ড্রিল-ডাউন মোডাল ----------
const LocationDrillModal = ({ location, patients, onClose }) => {
  if (!location) return null;
  
  return (
    <div className="location-drill-modal" onClick={onClose}>
      <div className="location-drill-content" onClick={(e) => e.stopPropagation()}>
        <div className="location-drill-header">
          <h3>📍 {location} - রোগীর তালিকা</h3>
          <button className="close-drill-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="location-drill-body">
          {patients.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>এই লোকেশনে কোনো রোগী নেই</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>সিরিয়াল</th>
                  <th>রোগীর নাম</th>
                  <th>মোবাইল</th>
                  <th>ডাক্তার</th>
                  <th>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>{p.serialNo || '-'}</td>
                    <td>{p.name || '-'}</td>
                    <td>{p.mobile || '-'}</td>
                    <td>{p.doctorName || '-'}</td>
                    <td><span style={{ 
                      background: p.status === 'completed' ? '#dcfce7' : p.status === 'checked-in' ? '#ede9fe' : '#fef3c7',
                      color: p.status === 'completed' ? '#166534' : p.status === 'checked-in' ? '#6d28d9' : '#92400e',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>{p.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- মূল কম্পোনেন্ট ----------
export default function Overview({ appointments }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drillLocation, setDrillLocation] = useState(null);
  const [drillPatients, setDrillPatients] = useState([]);
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    const loadPatients = async () => {
      const data = await getAllPatients();
      setPatients(data);
      setLoading(false);
    };
    loadPatients();
  }, []);

  // ---------- ডেটা প্রসেসিং ----------
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

  const totalPatients = patients.length;
  const newPatients = patients.filter(p => p.totalVisits === 1).length;
  const repeatPatients = patients.filter(p => p.totalVisits > 1).length;
  const repeatRate = totalPatients > 0 ? (repeatPatients / totalPatients) * 100 : 0;

  const doctorCounts = {};
  appointments.forEach(a => { doctorCounts[a.doctorName] = (doctorCounts[a.doctorName] || 0) + 1; });
  const doctorData = Object.entries(doctorCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const departmentCounts = {};
  appointments.forEach(a => { departmentCounts[a.doctorDept || 'Unknown'] = (departmentCounts[a.doctorDept || 'Unknown'] || 0) + 1; });
  const departmentData = Object.entries(departmentCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

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

  const referralCounts = {};
  appointments.forEach(a => { const src = a.referralSource || 'Unknown'; referralCounts[src] = (referralCounts[src] || 0) + 1; });
  const referralData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));

  // ---------- লোকেশন ডেটা প্রসেসিং ----------
  const rawLocations = appointments.map(a => a.address).filter(Boolean);
  const groupedLocations = groupLocationsAutomatically(rawLocations);
  const locationData = groupedLocations.map(({ canonical, count }) => ({ name: canonical, count }));

  // লোকেশন-ভিত্তিক রোগী ড্রিল ডেটা
  const getPatientsByLocation = (locationName) => {
    return appointments.filter(a => {
      if (!a.address) return false;
      const normalized = normalizeLocation(a.address);
      return normalized === normalizeLocation(locationName);
    });
  };

  // ---------- ট্রেন্ড ডেটা ----------
  const getTrendData = () => {
    const days = [];
    const today = new Date();
    const banglaDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const locationCounts = {};

    // লোকেশন অনুযায়ী কাউন্ট
    locationData.forEach(loc => {
      locationCounts[loc.name] = [];
    });

    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = banglaDays[d.getDay() === 0 ? 6 : d.getDay() - 1];
      
      const dayData = { name: dayName, date: dateStr };
      let totalCount = 0;
      
      locationData.forEach(loc => {
        const count = appointments.filter(a => {
          if (!a.address) return false;
          const normalized = normalizeLocation(a.address);
          return normalized === normalizeLocation(loc.name) && a.bookingDate === dateStr;
        }).length;
        dayData[loc.name] = count;
        totalCount += count;
      });
      
      dayData.total = totalCount;
      days.push(dayData);
    }
    return days;
  };

  const trendData = getTrendData();

  // ---------- লোকেশন চার্ট ড্রিল হ্যান্ডলার ----------
  const handleLocationClick = (locationName) => {
    const patientsList = getPatientsByLocation(locationName);
    setDrillLocation(locationName);
    setDrillPatients(patientsList);
  };

  const statusData = [
    { name: 'Pending', value: pending },
    { name: 'Confirmed', value: confirmed },
    { name: 'Checked-in', value: checkedIn },
    { name: 'Completed', value: completed },
    { name: 'Cancelled', value: cancelled },
    { name: 'No-show', value: noShow }
  ];

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    const banglaDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayIndex = d.getDay();
      const dayName = banglaDays[dayIndex === 0 ? 6 : dayIndex - 1];
      
      const count = appointments.filter(a => a.bookingDate === dateStr).length;
      
      days.push({ 
        name: dayName, 
        date: dateStr,
        count: count 
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  const renderLegend = (value, entry) => {
    const totalValue = entry.payload.value;
    const percentage = total > 0 ? ((totalValue / total) * 100).toFixed(0) : 0;
    return <span style={{ color: '#475569', fontSize: '13px' }}>{value} ({percentage}%)</span>;
  };

  const kpis = [
    { label: 'Total Bookings', value: total, color: '#1c5fa8', bg: 'rgba(28, 95, 168, 0.1)' },
    { label: 'Pending', value: pending, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'Confirmed', value: confirmed, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Checked-in', value: checkedIn, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Completed', value: completed, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    { label: 'No-show', value: noShow, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    { label: 'মোট রোগী', value: totalPatients, color: '#1c5fa8', bg: 'rgba(28, 95, 168, 0.1)' },
    { label: 'নতুন রোগী', value: newPatients, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    { label: 'ফলোআপ রোগী', value: repeatPatients, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' },
    { label: 'রিপিট রেট', value: repeatRate.toFixed(1) + '%', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
  ];

  const conversions = [
    { label: 'Booking to Visit', value: bookingToVisit.toFixed(1), color: '#22c55e', prefix: '%' },
    { label: 'Checked-in Rate', value: checkedInRate.toFixed(1), color: '#8b5cf6', prefix: '%' },
    { label: 'No-show Rate', value: noShowRate.toFixed(1), color: '#6b7280', prefix: '%' },
    { label: 'Cancellation Rate', value: cancellationRate.toFixed(1), color: '#ef4444', prefix: '%' }
  ];

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>লোড হচ্ছে...</div>;

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

      {/* Referral & Location - ইন্টারঅ্যাকটিভ লোকেশন চার্ট */}
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
          <h4 style={{ ...styles.chartTitle, cursor: 'pointer' }}>
            <MapPin size={18} color="#d97706" />
            লোকেশনভিত্তিক রোগী (ক্লিক করে রোগী দেখুন)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={locationData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={150} interval={0} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="#d97706" 
                radius={[0, 5, 5, 0]} 
                barSize={20}
                onClick={(data) => handleLocationClick(data.name)}
                style={{ cursor: 'pointer' }}
              >
                <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '4px' }}>
            💡 কোনো বার ক্লিক করলে সেই লোকেশনের রোগীদের তালিকা দেখাবে
          </div>
        </div>
      </div>

      {/* 📈 লোকেশন ট্রেন্ড অ্যানালাইসিস */}
      <div style={styles.chartCard}>
        <h4 style={styles.chartTitle}>
          <TrendingUp size={18} color="#1c5fa8" />
          লোকেশন ট্রেন্ড অ্যানালাইসিস
        </h4>
        <div className="location-trend-selector">
          <button 
            className={trendDays === 7 ? 'active' : ''} 
            onClick={() => setTrendDays(7)}
          >
            গত ৭ দিন
          </button>
          <button 
            className={trendDays === 14 ? 'active' : ''} 
            onClick={() => setTrendDays(14)}
          >
            গত ১৪ দিন
          </button>
          <button 
            className={trendDays === 30 ? 'active' : ''} 
            onClick={() => setTrendDays(30)}
          >
            গত ৩০ দিন
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {locationData.slice(0, 5).map((loc, idx) => (
              <Line 
                key={loc.name} 
                type="monotone" 
                dataKey={loc.name} 
                stroke={COLORS[idx % COLORS.length]} 
                strokeWidth={2}
                dot={{ r: 3 }}
                name={loc.name}
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#1c5fa8" 
              strokeWidth={3} 
              dot={{ r: 4 }}
              name="সব"
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
          📊 প্রতিটি লোকেশনের দৈনিক রোগী সংখ্যা (শীর্ষ ৫ লোকেশন)
        </div>
      </div>

      {/* Department, Age, Doctor Leaderboard */}
      <div className="overview-main-grid">
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>বিভাগভিত্তিক রোগী</h4>
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
          <h4 style={styles.chartTitle}>👨‍⚕️ ডাক্তারভিত্তিক সিরিয়াল</h4>
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

      {/* ড্রিল-ডাউন মোডাল */}
      {drillLocation && (
        <LocationDrillModal 
          location={drillLocation} 
          patients={drillPatients} 
          onClose={() => setDrillLocation(null)} 
        />
      )}
    </div>
  );
}