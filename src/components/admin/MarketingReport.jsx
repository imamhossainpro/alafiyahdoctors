// src/components/admin/MarketingReport.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText, Trash2, Calendar, Filter, Loader2 } from 'lucide-react';
import { db, doc, setDoc, collection, query, where, getDocs, updateDoc } from '../../firebase';
import { getAllPatients } from '../../services/patientService';
import { useHospital } from '../../context/HospitalContext';
import { logActivity, LOG_MODULES, LOG_ACTIONS } from '../../services/activityLogService';

// ==================================================
// ✅ Bangladesh Timezone Helpers
// ==================================================
const BD_OFFSET_MINUTES = 6 * 60;

const getBDDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (BD_OFFSET_MINUTES * 60000));
};

const toDateString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ Booking date → YYYY-MM-DD
const normalizeBookingDate = (bookingDate) => {
  if (!bookingDate) return null;
  if (typeof bookingDate === 'string') return bookingDate.split('T')[0];
  if (bookingDate?.toDate) return toDateString(bookingDate.toDate());
  if (bookingDate?.seconds) return toDateString(new Date(bookingDate.seconds * 1000));
  try { return toDateString(new Date(bookingDate)); } catch { return null; }
};

// ==================================================
// ✅ Date Display Helpers (DD-MM-YYYY ↔ YYYY-MM-DD)
// ==================================================
const isoToDisplay = (iso) => {
  if (!iso) return '';
  const parts = String(iso).split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
};

const displayToIso = (display) => {
  if (!display) return '';
  const parts = String(display).split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return display;
};

const isValidDisplayDate = (val) => /^\d{2}-\d{2}-\d{4}$/.test(val);

// ==================================================
// ✅ Date Range Presets (Calendar-based, Bangladesh time)
// ==================================================
const getDateRange = (preset) => {
  const today = getBDDate();
  const todayStr = toDateString(today);

  switch (preset) {
    case 'today':
      return { start: todayStr, end: todayStr };

    case 'week': {
      const d = new Date(today);
      d.setDate(today.getDate() - 6);
      return { start: toDateString(d), end: todayStr };
    }

    case 'month': {
      // ✅ ঠিক ১ মাস আগে (calendar-based, month-end clamp)
      const targetMonth = today.getMonth() - 1;
      const targetYear = today.getFullYear();
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const day = Math.min(today.getDate(), lastDay);
      const d = new Date(targetYear, targetMonth, day);
      return { start: toDateString(d), end: todayStr };
    }

    case 'year': {
      // ✅ ঠিক ১ বছর আগে
      const d = new Date(today);
      d.setFullYear(today.getFullYear() - 1);
      return { start: toDateString(d), end: todayStr };
    }

    case 'all':
    default:
      return { start: '2020-01-01', end: '2030-12-31' };
  }
};

// ==================================================
// ✅ SINGLE SOURCE OF TRUTH – Report Calculation
// ==================================================
const getMarketingReportData = ({ bookings, startDate, endDate, selectedOfficer, normalizedTeam, patientMap }) => {
  const filtered = bookings.filter((a) => {
    const apptDate = normalizeBookingDate(a.bookingDate);
    if (!apptDate) return false;
    if (apptDate < startDate || apptDate > endDate) return false;

    if (selectedOfficer === 'all') return true;
    if (a.marketingOfficerId && a.marketingOfficerId === selectedOfficer) return true;

    const selectedOfficerObj = normalizedTeam.find((o) => o.id === selectedOfficer);
    if (selectedOfficerObj && a.marketingOfficer) {
      return a.marketingOfficer.trim().toLowerCase() === selectedOfficerObj.name.trim().toLowerCase();
    }
    return false;
  });

  const officerMap = {};
  normalizedTeam.forEach((o) => {
    officerMap[o.id] = {
      id: o.id,
      name: o.name,
      total: 0,
      newPatients: 0,
      repeatPatients: 0,
      sources: {},
      completed: 0,
      checkedIn: 0,
    };
  });

  const nameToId = {};
  normalizedTeam.forEach((o) => {
    nameToId[o.name.trim().toLowerCase()] = o.id;
  });

  filtered.forEach((a) => {
    let officerId = a.marketingOfficerId;
    const officerName = (a.marketingOfficer || '').trim();

    if (!officerId && officerName) {
      const matchedId = nameToId[officerName.toLowerCase()];
      if (matchedId) officerId = matchedId;
    }

    if (!officerId) return;

    if (!officerMap[officerId]) {
      officerMap[officerId] = {
        id: officerId,
        name: officerName || 'অজানা অফিসার',
        total: 0,
        newPatients: 0,
        repeatPatients: 0,
        sources: {},
        completed: 0,
        checkedIn: 0,
      };
    }

    const entry = officerMap[officerId];
    entry.total++;

    const patient = patientMap[a.patientId];
    if (patient) {
      if (patient.totalVisits === 1) entry.newPatients++;
      else entry.repeatPatients++;
    }

    const src = a.referralSource || 'Unknown';
    entry.sources[src] = (entry.sources[src] || 0) + 1;
    if (a.status === 'completed') entry.completed++;
    if (a.status === 'checked-in') entry.checkedIn++;
  });

  const rows = Object.values(officerMap)
    .filter((r) => r.name && r.name !== 'Unassigned')
    .map((entry) => ({
      ...entry,
      conversionRate: entry.total > 0 ? (((entry.completed + entry.checkedIn) / entry.total) * 100).toFixed(1) : '0.0',
      repeatRate: entry.total > 0 ? ((entry.repeatPatients / entry.total) * 100).toFixed(1) : '0.0',
    }));

  return { filtered, rows };
};

// ==================================================
// ✅ PDF Generation – Confirmed + Checked-in + Completed
// ==================================================
const exportOfficerPDF = async (officer, filteredBookings, dateRange) => {
  const officerName = officer.name;
  const officerId = officer.id;

  const ALLOWED_STATUSES = ['confirmed', 'checked-in', 'completed'];

  const officerAppointments = filteredBookings
    .filter((a) => {
      const status = (a.status || '').toLowerCase();
      if (!ALLOWED_STATUSES.includes(status)) return false;

      if (officerId && a.marketingOfficerId) {
        return a.marketingOfficerId === officerId;
      }
      const apptOfficer = (a.marketingOfficer || '').trim().toLowerCase();
      return apptOfficer === officerName.trim().toLowerCase();
    })
    .sort((a, b) => {
      const dateA = normalizeBookingDate(a.bookingDate) || '';
      const dateB = normalizeBookingDate(b.bookingDate) || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return Number(a.serialNo || 0) - Number(b.serialNo || 0);
    });

  if (officerAppointments.length === 0) {
    alert(`"${officerName}" এর এই তারিখ সীমায় কোনো Confirmed / Checked-in / Completed রোগী নেই`);
    return;
  }

  const statusCounts = {
    confirmed: officerAppointments.filter((a) => (a.status || '').toLowerCase() === 'confirmed').length,
    checkedIn: officerAppointments.filter((a) => (a.status || '').toLowerCase() === 'checked-in').length,
    completed: officerAppointments.filter((a) => (a.status || '').toLowerCase() === 'completed').length,
  };

  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = "'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif";
    container.style.width = '1200px';
    document.body.appendChild(container);

    // Header
    const header = document.createElement('h2');
    header.textContent = `${officerName} - মার্কেটিং রিপোর্ট`;
    header.style.marginBottom = '8px';
    header.style.color = '#1c5fa8';
    container.appendChild(header);

    // সময়কাল – DD-MM-YYYY
    const rangeInfo = document.createElement('p');
    rangeInfo.textContent = `সময়কাল: ${isoToDisplay(dateRange.start)} থেকে ${isoToDisplay(dateRange.end)}`;
    rangeInfo.style.marginBottom = '4px';
    rangeInfo.style.fontWeight = '600';
    rangeInfo.style.color = '#475569';
    rangeInfo.style.fontSize = '14px';
    container.appendChild(rangeInfo);

    // প্রিন্ট তারিখ – DD-MM-YYYY
    const dateInfo = document.createElement('p');
    const today = toDateString(getBDDate());
    dateInfo.textContent = `প্রিন্ট তারিখ: ${isoToDisplay(today)}  |  মোট: ${officerAppointments.length} জন`;
    dateInfo.style.marginBottom = '8px';
    dateInfo.style.fontSize = '13px';
    dateInfo.style.color = '#64748b';
    container.appendChild(dateInfo);

    // Status summary
    const statusSummary = document.createElement('p');
    statusSummary.innerHTML = `
      <span style="background:#dbeafe; color:#1e40af; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; margin-right:6px;">
        ✅ Confirmed: ${statusCounts.confirmed}
      </span>
      <span style="background:#ede9fe; color:#6d28d9; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; margin-right:6px;">
        🔄 Checked-in: ${statusCounts.checkedIn}
      </span>
      <span style="background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
        ✔ Completed: ${statusCounts.completed}
      </span>
    `;
    statusSummary.style.marginBottom = '16px';
    container.appendChild(statusSummary);

    // Table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '14px';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // ✅ হেডারে "রেফার" কলাম যুক্ত করা হয়েছে
    ['ক্রমিক নং', 'তারিখ', 'রোগীর নাম', 'ডাক্তার', 'মোবাইল', 'রেফার', 'স্ট্যাটাস'].forEach((text) => {
      const th = document.createElement('th');
      th.textContent = text;
      th.style.padding = '10px';
      th.style.background = '#1c5fa8';
      th.style.color = '#fff';
      th.style.border = '1px solid #ddd';
      th.style.textAlign = 'left';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    officerAppointments.forEach((a, index) => {
      const tr = document.createElement('tr');
      const statusText =
        (a.status || '').toLowerCase() === 'confirmed' ? 'Confirmed'
        : (a.status || '').toLowerCase() === 'checked-in' ? 'Checked-in'
        : (a.status || '').toLowerCase() === 'completed' ? 'Completed'
        : a.status || '-';

      // ✅ ডেটার মধ্যে "রেফার" (a.remarks) যুক্ত করা হয়েছে
      [
        (index + 1).toString(),
        isoToDisplay(normalizeBookingDate(a.bookingDate)),   // ✅ DD-MM-YYYY
        a.name || '-',
        a.doctorName || '-',
        a.mobile || '-',
        a.remarks || '-',  // 👈 এখানে বুকিং লিস্টের রিমার্কস (remarks) বসবে
        statusText,
      ].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        td.style.padding = '8px 10px';
        td.style.border = '1px solid #ddd';
        td.style.textAlign = 'left';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Footer
    const footer = document.createElement('p');
    footer.textContent = `মোট: ${officerAppointments.length} জন রোগী (Confirmed + Checked-in + Completed)`;
    footer.style.marginTop = '15px';
    footer.style.fontSize = '13px';
    footer.style.fontWeight = '600';
    footer.style.color = '#1c5fa8';
    container.appendChild(footer);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Filename – DD-MM-YYYY
    const safeName = officerName.replace(/[^\u0980-\u09FFa-zA-Z0-9_-]/g, '_');
    const startFmt = isoToDisplay(dateRange.start);
    const endFmt = isoToDisplay(dateRange.end);
    pdf.save(`${safeName}_${startFmt}_to_${endFmt}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('PDF ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
  }
};

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function MarketingReport({
  appointments,
  marketingTeam,
  onTeamUpdate,
  user,
}) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  // ✅ Default = "গত ১ মাস"
  const defaultRange = getDateRange('month');

  const [selectedOfficer, setSelectedOfficer] = useState('all');
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [datePreset, setDatePreset] = useState('month');
  const [deletingId, setDeletingId] = useState(null);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [patientMap, setPatientMap] = useState({});

  // ✅ Local state for text input display (DD-MM-YYYY)
  const [startInput, setStartInput] = useState(isoToDisplay(defaultRange.start));
  const [endInput, setEndInput] = useState(isoToDisplay(defaultRange.end));

  // ✅ Hidden date picker refs
  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Sync text input with state
  useEffect(() => {
    setStartInput(isoToDisplay(startDate));
  }, [startDate]);
  useEffect(() => {
    setEndInput(isoToDisplay(endDate));
  }, [endDate]);

  // Normalize team
  const normalizedTeam = useMemo(() => {
    return (marketingTeam || []).map((m, idx) => {
      if (typeof m === 'string') return { id: `legacy_${idx}_${m}`, name: m };
      return { id: m.id || `legacy_${idx}_${m.name}`, name: m.name || 'নাম নেই' };
    });
  }, [marketingTeam]);

  // Load patients
  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        const patients = await getAllPatients(hospitalId);
        if (!mounted) return;
        const map = {};
        patients.forEach((p) => { map[p.id] = p; });
        setPatientMap(map);
      } catch (err) {
        console.error('Patients load error:', err);
      }
    };
    loadPatients();
    return () => { mounted = false; };
  }, [hospitalId]);

  // Preset change
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const range = getDateRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
  };

  // ✅ Text input handlers
  const handleStartInputChange = (e) => {
    const val = e.target.value;
    if (!/^[\d-]*$/.test(val)) return;
    setStartInput(val);
    if (isValidDisplayDate(val)) {
      const iso = displayToIso(val);
      const d = new Date(iso + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setStartDate(iso);
        setDatePreset('custom');
      }
    }
  };

  const handleEndInputChange = (e) => {
    const val = e.target.value;
    if (!/^[\d-]*$/.test(val)) return;
    setEndInput(val);
    if (isValidDisplayDate(val)) {
      const iso = displayToIso(val);
      const d = new Date(iso + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setEndDate(iso);
        setDatePreset('custom');
      }
    }
  };

  const handleStartBlur = () => {
    if (!isValidDisplayDate(startInput)) {
      setStartInput(isoToDisplay(startDate));
    }
  };

  const handleEndBlur = () => {
    if (!isValidDisplayDate(endInput)) {
      setEndInput(isoToDisplay(endDate));
    }
  };

  // ✅ Native picker handlers
  const handleStartPickerChange = (e) => {
    setStartDate(e.target.value);
    setDatePreset('custom');
  };

  const handleEndPickerChange = (e) => {
    setEndDate(e.target.value);
    setDatePreset('custom');
  };

  // ✅ SINGLE SOURCE OF TRUTH
  const { filtered, rows: reportData } = useMemo(() => {
    return getMarketingReportData({
      bookings: appointments,
      startDate,
      endDate,
      selectedOfficer,
      normalizedTeam,
      patientMap,
    });
  }, [appointments, startDate, endDate, selectedOfficer, normalizedTeam, patientMap]);

  // ✅ PDF export
  const handleExportPDF = async (officer) => {
    try {
      setPdfLoadingId(officer.id || officer.name);

      const freshCalc = getMarketingReportData({
        bookings: appointments,
        startDate,
        endDate,
        selectedOfficer,
        normalizedTeam,
        patientMap,
      });

      const freshOfficer = freshCalc.rows.find(
        (r) => r.id === officer.id || r.name === officer.name
      );

      if (!freshOfficer) {
        alert('এই অফিসারের কোনো ডেটা পাওয়া যায়নি।');
        return;
      }

      await exportOfficerPDF(
        freshOfficer,
        freshCalc.filtered,
        { start: startDate, end: endDate }
      );
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setPdfLoadingId(null);
    }
  };

  // Delete
  const handleDelete = async (officer) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন অফিসার ডিলিট করতে পারবেন।');
      return;
    }
    if (!hospitalId) {
      alert('হাসপাতাল আইডি পাওয়া যায়নি!');
      return;
    }

    const officerName = officer.name;
    const officerId = officer.id;

    if (!confirm(`আপনি কি "${officerName}" অফিসারকে ডিলিট করতে চান?`)) return;
    if (!confirm(`আপনি কি নিশ্চিত? "${officerName}" অফিসারকে স্থায়ীভাবে মুছে ফেলা হবে!`)) return;

    try {
      setDeletingId(officerId || officerName);

      const updatedTeam = normalizedTeam
        .filter((o) => o.id !== officerId)
        .map((o) => ({ id: o.id, name: o.name }));

      await setDoc(
        doc(db, 'hospitals', hospitalId, 'settings', 'marketingTeam'),
        { members: updatedTeam }
      );

      const apptsRef = collection(db, 'hospitals', hospitalId, 'appointments');
      const promises = [];

      if (officerId) {
        const q1 = query(apptsRef, where('marketingOfficerId', '==', officerId));
        const snap1 = await getDocs(q1);
        snap1.forEach((d) => {
          promises.push(updateDoc(d.ref, { marketingOfficer: '', marketingOfficerId: null }));
        });
      }

      if (officerName && officerName !== 'Unassigned') {
        const q2 = query(apptsRef, where('marketingOfficer', '==', officerName));
        const snap2 = await getDocs(q2);
        snap2.forEach((d) => {
          promises.push(updateDoc(d.ref, { marketingOfficer: '', marketingOfficerId: null }));
        });
      }

      await Promise.all(promises);

      try {
        await logActivity({
          hospitalId,
          module: LOG_MODULES.MARKETING,
          action: LOG_ACTIONS.DELETE,
          recordId: officerId || null,
          description: `Marketing Officer "${officerName}" ডিলিট করা হয়েছে`,
          oldValue: { id: officerId, name: officerName, total: officer.total, completed: officer.completed },
          newValue: null,
          user,
        });
      } catch (logErr) {
        console.error('Delete log error:', logErr);
      }

      if (onTeamUpdate) onTeamUpdate(updatedTeam);
      alert(`${officerName} সফলভাবে ডিলিট করা হয়েছে।`);
    } catch (error) {
      console.error('Delete error:', error);
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>📊 মার্কেটিং রিপোর্ট</h3>

      {/* Filter Section */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Filter size={16} color="#1c5fa8" />
          <strong style={{ fontSize: '14px', color: '#1e293b' }}>ফিল্টার</strong>
        </div>

        {/* Quick Preset Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {[
            { key: 'month', label: 'গত ১ মাস' },
            { key: 'today', label: 'আজ' },
            { key: 'week', label: 'গত ৭ দিন' },
            { key: 'year', label: 'গত ১ বছর' },
            { key: 'all', label: 'সব সময়' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              style={{
                padding: '6px 14px',
                background: datePreset === p.key ? '#1c5fa8' : '#fff',
                color: datePreset === p.key ? '#fff' : '#334155',
                border: '1px solid ' + (datePreset === p.key ? '#1c5fa8' : '#e2e8f0'),
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Officer + Custom Date */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>অফিসার</label>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', minWidth: '180px', background: '#fff' }}
            >
              <option value="all">সব অফিসার</option>
              {normalizedTeam.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* ✅ Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />শুরু
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={startInput}
                onChange={handleStartInputChange}
                onBlur={handleStartBlur}
                maxLength={10}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '140px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#1c5fa8'}
              />
              {/* Hidden native date picker */}
              <input
                ref={startPickerRef}
                type="date"
                value={startDate}
                onChange={handleStartPickerChange}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => startPickerRef.current?.showPicker?.()}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  fontSize: '14px',
                }}
                title="ক্যালেন্ডার থেকে নির্বাচন করুন"
              >
                📅
              </button>
            </div>
          </div>

          {/* ✅ End Date */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />শেষ
            </label>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={endInput}
                onChange={handleEndInputChange}
                onBlur={handleEndBlur}
                maxLength={10}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '140px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#1c5fa8'}
              />
              <input
                ref={endPickerRef}
                type="date"
                value={endDate}
                onChange={handleEndPickerChange}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => endPickerRef.current?.showPicker?.()}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  fontSize: '14px',
                }}
                title="ক্যালেন্ডার থেকে নির্বাচন করুন"
              >
                📅
              </button>
            </div>
          </div>

          <div style={{ background: '#dbeafe', color: '#1e40af', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
            📊 মোট {filtered.length} টি booking
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>অফিসার</th>
              <th style={{ padding: '10px 12px' }}>মোট</th>
              <th style={{ padding: '10px 12px' }}>🆕 নতুন</th>
              <th style={{ padding: '10px 12px' }}>🔄 ফলোআপ</th>
              <th style={{ padding: '10px 12px' }}>রিপিট রেট</th>
              <th style={{ padding: '10px 12px' }}>চেক-ইন</th>
              <th style={{ padding: '10px 12px' }}>✅ কমপ্লিট</th>
              <th style={{ padding: '10px 12px' }}>কনভার্সন</th>
              <th style={{ padding: '10px 12px' }}>সোর্স ব্রেকডাউন</th>
              {isAdmin && <th style={{ padding: '10px 12px', textAlign: 'center' }}>অ্যাকশন</th>}
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  এই তারিখ সীমায় কোনো ডেটা পাওয়া যায়নি
                </td>
              </tr>
            ) : (
              reportData.map((row, i) => (
                <tr key={(row.id || row.name) + i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{row.name}</span>
                      <button
                        onClick={() => handleExportPDF(row)}
                        disabled={pdfLoadingId === (row.id || row.name)}
                        title={`${row.name} এর সম্পন্ন রোগীদের রিপোর্ট`}
                        style={{
                          background: pdfLoadingId === (row.id || row.name) ? '#94a3b8' : '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 10px',
                          cursor: pdfLoadingId === (row.id || row.name) ? 'not-allowed' : 'pointer',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600',
                        }}
                      >
                        {pdfLoadingId === (row.id || row.name) ? (
                          <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> PDF</>
                        ) : (
                          <><FileText size={13} /> PDF</>
                        )}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>{row.total}</td>
                  <td style={{ padding: '10px 12px', color: '#22c55e', fontWeight: '600' }}>{row.newPatients}</td>
                  <td style={{ padding: '10px 12px', color: '#d97706', fontWeight: '600' }}>{row.repeatPatients}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>{row.repeatRate}%</td>
                  <td style={{ padding: '10px 12px' }}>{row.checkedIn}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#166534' }}>{row.completed}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: Number(row.conversionRate) > 50 ? '#22c55e' : '#d97706' }}>{row.conversionRate}%</td>
                  <td style={{ padding: '10px 12px' }}>
                    {Object.entries(row.sources).map(([k, v]) => (
                      <span key={k} style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginRight: '4px', fontSize: '12px', display: 'inline-block', marginBottom: '4px' }}>
                        {k}: {v}
                      </span>
                    ))}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === (row.id || row.name)}
                        style={{
                          background: deletingId === (row.id || row.name) ? '#94a3b8' : '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          cursor: deletingId === (row.id || row.name) ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                        {deletingId === (row.id || row.name) ? 'ডিলিট হচ্ছে...' : 'ডিলিট'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}