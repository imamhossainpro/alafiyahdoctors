import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle, XCircle, UserCheck, Archive, Trash2, Clock, 
  Stethoscope, LayoutList, Undo2, Eye, Search, Edit2, Save, X, 
  ArrowUpDown, XCircle as XCircleIcon
} from 'lucide-react';
import { db, doc, updateDoc, getDoc } from '../../firebase';
import { getPatientById } from '../../services/patientService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------- 📄 অফিসার-নির্দিষ্ট PDF এক্সপোর্ট (শুধু মার্কেটিং রিপোর্টের জন্য) ----------
const exportOfficerPDF = async (officerName, appointments) => {
  const officerAppointments = appointments.filter(a => a.marketingOfficer === officerName);
  if (officerAppointments.length === 0) {
    alert('এই অফিসারের জন্য কোনো রোগী নেই');
    return;
  }

  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
    const fontBase64 = btoa(binary);
    
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.addFileToVFS('NotoSansBengali-Regular.ttf', fontBase64);
    doc.addFont('NotoSansBengali-Regular.ttf', 'NotoSansBengali', 'normal');
    doc.setFont('NotoSansBengali');
    
    doc.setFontSize(18);
    doc.text(`${officerName} - মার্কেটিং রিপোর্ট`, 14, 15);
    doc.setFontSize(11);
    const today = new Date().toISOString().split('T')[0];
    doc.text(`তারিখ: ${today}`, 14, 25);
    doc.text(`মোট রোগী: ${officerAppointments.length} জন`, 14, 33);
    doc.line(14, 38, 290, 38);
    
    const rows = await Promise.all(officerAppointments.map(async (a) => {
      let patientType = 'অজানা';
      if (a.patientId) {
        const patient = await getPatientById(a.patientId);
        if (patient) {
          const visits = patient.visits || [];
          const doctorVisits = visits.filter(v => v.doctorName === a.doctorName && v.date < a.bookingDate);
          if (doctorVisits.length === 0) patientType = 'নতুন';
          else {
            const sorted = [...doctorVisits].sort((x, y) => new Date(y.date) - new Date(x.date));
            const last = sorted[0];
            const diffDays = Math.ceil(Math.abs(new Date(last.date) - new Date(a.bookingDate)) / (1000 * 60 * 60 * 24));
            patientType = diffDays <= 7 ? 'রিপোর্ট' : 'ফলোআপ';
          }
        }
      }
      return [
        a.serialNo || '-',
        a.name || '-',
        a.mobile || '-',
        a.referralSource || '-',
        a.doctorName || '-',
        a.bookingDate || '-',
        a.status || 'pending',
        patientType
      ];
    }));
    
    autoTable(doc, {
      head: [['সিরিয়াল', 'রোগীর নাম', 'মোবাইল', 'রেফারেল সোর্স', 'ডাক্তার', 'তারিখ', 'স্ট্যাটাস', 'রোগীর টাইপ']],
      body: rows,
      startY: 42,
      styles: { fontSize: 7, cellPadding: 2, font: 'NotoSansBengali' },
      headStyles: { fillColor: [28, 95, 168], textColor: 255, fontSize: 8, fontStyle: 'bold', font: 'NotoSansBengali' },
      alternateRowStyles: { fillColor: [245, 248, 250] },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' }
      }
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`পৃষ্ঠা ${i} / ${pageCount}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`${officerName}_marketing_report.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('PDF ডাউনলোড করতে সমস্যা হয়েছে।');
  }
};

// ---------- স্ট্যাটাস ব্যাজ ----------
const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
    'checked-in': { bg: '#ede9fe', color: '#6d28d9', label: 'Checked-in' },
    completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    'no-show': { bg: '#f3f4f6', color: '#4b5563', label: 'No-show' },
    archived: { bg: '#e5e7eb', color: '#374151', label: 'Archived' }
  };
  const style = styles[status] || styles.pending;
  return <span style={{ background: style.bg, color: style.color, padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>{style.label}</span>;
};

// ---------- স্ট্যাটাস ট্রানজিশন ----------
const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked-in', 'cancelled', 'no-show', 'pending'],
  'checked-in': ['completed', 'confirmed', 'pending', 'cancelled', 'no-show'],
  completed: ['checked-in', 'confirmed', 'pending', 'cancelled', 'no-show'],
  cancelled: ['pending', 'confirmed', 'checked-in', 'no-show'],
  'no-show': ['pending', 'confirmed', 'checked-in', 'completed'],
  archived: []
};

const ActionButton = ({ onClick, title, bg, icon }) => (
  <button onClick={onClick} title={title} style={{ background: bg, color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer', marginRight: '4px' }}>{icon}</button>
);

const REFERRAL_SOURCES = [
  'Walk-in / নিজে এসেছেন',
  'Refer Doctor',
  'Facebook',
  'Google',
  'Campaign / Medical Camp',
  'আত্মীয়/বন্ধু',
  'অন্যান্য'
];

export default function AppointmentsTable({ 
  appointments, 
  onStatusChange, 
  onArchive, 
  onRestore, 
  isArchivedView, 
  user,
  marketingTeam = [] 
}) {
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDetails, setViewDetails] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [patientTypes, setPatientTypes] = useState({});
  const [updatingPatient, setUpdatingPatient] = useState(null);
  const [updatingHighlight, setUpdatingHighlight] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');

  const [filterOfficer, setFilterOfficer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');

  const canEdit = user?.role === 'admin' || user?.role === 'sub-admin' || user?.role === 'editor';
  const isAdmin = user?.role === 'admin';

  // ইউনিক ডাক্তার লিস্ট
  const uniqueDoctors = useMemo(() => {
    const doctors = new Set();
    appointments.forEach(a => { if (a.doctorName) doctors.add(a.doctorName); });
    return ['all', ...Array.from(doctors)];
  }, [appointments]);

  const uniqueStatuses = ['all', 'pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'no-show'];

  // ফিল্টার ও সাজানো
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.name?.toLowerCase().includes(term) || '') ||
        (a.mobile?.toLowerCase().includes(term) || '') ||
        (String(a.serialNo || '').includes(term)) ||
        (a.doctorName?.toLowerCase().includes(term) || '')
      );
    }
    
    if (filterOfficer !== 'all') {
      filtered = filtered.filter(a => a.marketingOfficer === filterOfficer);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    if (filterDoctor !== 'all') {
      filtered = filtered.filter(a => a.doctorName === filterDoctor);
    }
    
    filtered = [...filtered].sort((a, b) => {
      const serialA = Number(a.serialNo) || 0;
      const serialB = Number(b.serialNo) || 0;
      return sortOrder === 'asc' ? serialA - serialB : serialB - serialA;
    });
    
    return filtered;
  }, [appointments, searchTerm, filterOfficer, filterStatus, filterDoctor, sortOrder]);

  // রোগীর টাইপ নির্ধারণ
  const getPatientCategory = (patient, doctorName, bookingDate) => {
    if (!patient) return 'অজানা';
    const visits = patient.visits || [];
    const doctorVisits = visits.filter(v => v.doctorName === doctorName && v.date < bookingDate);
    if (doctorVisits.length === 0) return 'নতুন';
    const sorted = [...doctorVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
    const last = sorted[0];
    const diffDays = Math.ceil(Math.abs(new Date(last.date) - new Date(bookingDate)) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 ? 'রিপোর্ট' : 'ফলোআপ';
  };

  // রোগীর টাইপ লোড
  useEffect(() => {
    const loadPatientTypes = async () => {
      const types = {};
      for (const appt of filteredAppointments) {
        if (appt.patientId && !types[appt.id]) {
          const patient = await getPatientById(appt.patientId);
          if (patient) {
            types[appt.id] = getPatientCategory(patient, appt.doctorName, appt.bookingDate);
          } else {
            types[appt.id] = 'অজানা';
          }
        }
      }
      setPatientTypes(types);
    };
    loadPatientTypes();
  }, [filteredAppointments]);

  // হাইলাইট রিমুভ
  const handleRowClick = async (apptId) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt || !appt.isNew || updatingHighlight) return;
    try {
      setUpdatingHighlight(apptId);
      await updateDoc(doc(db, 'appointments', apptId), { isNew: false });
    } catch (error) {
      console.error('Error removing highlight:', error);
    } finally {
      setUpdatingHighlight(null);
    }
  };

  // ম্যানুয়ালি ক্যাটাগরি পরিবর্তন
  const handleManualCategoryChange = async (appointmentId, patientId, newCategory) => {
    if (!isAdmin) {
      alert('শুধুমাত্র অ্যাডমিন রোগীর টাইপ পরিবর্তন করতে পারবেন।');
      return;
    }
    if (!patientId) {
      alert('এই রোগীর জন্য patientId পাওয়া যায়নি।');
      return;
    }

    try {
      setUpdatingPatient(appointmentId);
      
      const patientRef = doc(db, 'patients', patientId);
      const patientSnap = await getDoc(patientRef);
      if (!patientSnap.exists()) {
        alert('রোগী পাওয়া যায়নি।');
        return;
      }
      
      const patient = patientSnap.data();
      let visits = patient.visits || [];
      
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) {
        alert('অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।');
        return;
      }
      const doctorName = appointment.doctorName || '';
      
      if (!doctorName) {
        alert('ডাক্তারের নাম পাওয়া যায়নি।');
        return;
      }

      if (newCategory === 'নতুন') {
        visits = visits.filter(v => v.doctorName !== doctorName);
      } 
      else if (newCategory === 'রিপোর্ট') {
        const doctorVisits = visits.filter(v => v.doctorName === doctorName);
        if (doctorVisits.length === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          visits.push({ doctorName, date: yesterday.toISOString().split('T')[0] });
        } else {
          const sorted = [...doctorVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
          const last = sorted[0];
          const diffDays = Math.ceil(Math.abs(new Date(last.date) - new Date()) / (1000 * 60 * 60 * 24));
          if (diffDays > 7) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            last.date = yesterday.toISOString().split('T')[0];
          }
        }
      } 
      else if (newCategory === 'ফলোআপ') {
        const doctorVisits = visits.filter(v => v.doctorName === doctorName);
        if (doctorVisits.length === 0) {
          const eightDaysAgo = new Date();
          eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
          visits.push({ doctorName, date: eightDaysAgo.toISOString().split('T')[0] });
        } else {
          const sorted = [...doctorVisits].sort((a, b) => new Date(b.date) - new Date(a.date));
          const last = sorted[0];
          const diffDays = Math.ceil(Math.abs(new Date(last.date) - new Date()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            const eightDaysAgo = new Date();
            eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
            last.date = eightDaysAgo.toISOString().split('T')[0];
          }
        }
      }
      
      await updateDoc(patientRef, { 
        visits: visits,
        updatedAt: new Date().toISOString()
      });
      
      setPatientTypes(prev => ({
        ...prev,
        [appointmentId]: newCategory
      }));
      
      alert(`রোগীর টাইপ "${newCategory}" এ পরিবর্তন করা হয়েছে।`);
    } catch (error) {
      console.error('Error updating patient category:', error);
      alert('রোগীর টাইপ পরিবর্তন করতে সমস্যা হয়েছে।');
    } finally {
      setUpdatingPatient(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterOfficer('all');
    setFilterStatus('all');
    setFilterDoctor('all');
  };

  const startEdit = (appt) => {
    setEditingId(appt.id);
    setEditData({
      referralSource: appt.referralSource || '',
      marketingOfficer: appt.marketingOfficer || '',
      remarks: appt.remarks || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        referralSource: editData.referralSource,
        marketingOfficer: editData.marketingOfficer,
        remarks: editData.remarks
      });
      setEditingId(null);
    } catch (error) {
      alert('আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const cancelEdit = () => setEditingId(null);

  const handleDropdownChange = (id, newStatus) => {
    const appt = filteredAppointments.find(a => a.id === id);
    if (appt) {
      if (validTransitions[appt.status] && validTransitions[appt.status].includes(newStatus)) {
        onStatusChange(id, newStatus);
      } else {
        alert('Invalid Status Transition!');
      }
    }
  };

  const doctorWiseData = {};
  filteredAppointments.forEach(appt => {
    const doctorName = appt.doctorName || 'Unknown Doctor';
    if (!doctorWiseData[doctorName]) doctorWiseData[doctorName] = { dept: appt.doctorDept || '', patients: [] };
    doctorWiseData[doctorName].patients.push(appt);
  });

  const renderActions = (appt) => {
    const currentStatus = appt.status || 'pending';
    const nextStatuses = validTransitions[currentStatus] || [];
    let actions = [];

    actions.push(<ActionButton key="view" onClick={() => setViewDetails(appt)} title="বিস্তারিত দেখুন" bg="#64748b" icon={<Eye size={14} />} />);

    if (!canEdit) return <span style={{ fontSize: '12px', color: '#9ca3af' }}>(View Only)</span>;

    if (isArchivedView) {
      actions.push(<ActionButton key="restore" onClick={() => onRestore(appt.id)} title="Restore করুন" bg="#2f9e52" icon={<Undo2 size={14} />} />);
      if (isAdmin) {
        actions.push(<ActionButton key="delete" onClick={() => onStatusChange(appt.id, 'PERMANENT_DELETE')} title="Permanent Delete" bg="#ef4444" icon={<Trash2 size={14} />} />);
      }
    } else {
      if (currentStatus === 'pending') {
        actions.push(<ActionButton key="confirm" onClick={() => onStatusChange(appt.id, 'confirmed')} title="Confirm করুন" bg="#3b82f6" icon={<CheckCircle size={14} />} />);
        actions.push(<ActionButton key="cancel" onClick={() => onStatusChange(appt.id, 'cancelled')} title="Cancel করুন" bg="#d97706" icon={<XCircle size={14} />} />);
      }
      else if (currentStatus === 'confirmed') {
        actions.push(<ActionButton key="checkin" onClick={() => onStatusChange(appt.id, 'checked-in')} title="Checked-in করুন" bg="#8b5cf6" icon={<UserCheck size={14} />} />);
        actions.push(<ActionButton key="cancel" onClick={() => onStatusChange(appt.id, 'cancelled')} title="Cancel করুন" bg="#d97706" icon={<XCircle size={14} />} />);
        actions.push(<ActionButton key="noshow" onClick={() => onStatusChange(appt.id, 'no-show')} title="No-show করুন" bg="#6b7280" icon={<Clock size={14} />} />);
      }
      else if (currentStatus === 'checked-in') {
        actions.push(<ActionButton key="complete" onClick={() => onStatusChange(appt.id, 'completed')} title="Completed করুন" bg="#22c55e" icon={<CheckCircle size={14} />} />);
      }
      
      actions.push(<ActionButton key="archive" onClick={() => onArchive(appt.id)} title="Archive করুন" bg="#9ca3af" icon={<Archive size={14} />} />);
      
      actions.push(
        <select key="dropdown" value="" onChange={(e) => handleDropdownChange(appt.id, e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', background: '#ffffff' }}>
          <option value="" disabled>-- Manually Set --</option>
          {nextStatuses.map(status => <option key={status} value={status}>{status.replace('-', ' ')}</option>)}
        </select>
      );
    }
    return actions;
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', width: '100%', overflowX: 'auto', color: '#1f2937' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>{isArchivedView ? 'আর্কাইভ বুকিং লিস্ট' : 'রোগীর বুকিং লিস্ট'}</h3>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px' }}>
            <Search size={16} color="#64748b" />
            <input type="text" placeholder="নাম, মোবাইল, সিরিয়াল..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', padding: '6px', fontSize: '13px', width: '180px' }} />
          </div>

          <select value={filterOfficer} onChange={(e) => setFilterOfficer(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
            <option value="all">সব অফিসার</option>
            {marketingTeam.map((m, idx) => {
              const name = typeof m === 'string' ? m : m.name;
              const key = typeof m === 'string' ? idx : m.id || idx;
              return <option key={key} value={name}>{name}</option>;
            })}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
            <option value="all">সব স্ট্যাটাস</option>
            {uniqueStatuses.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
          </select>

          <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
            <option value="all">সব ডাক্তার</option>
            {uniqueDoctors.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <button onClick={resetFilters} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <XCircleIcon size={14} /> রিসেট
          </button>

          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ padding: '6px 12px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpDown size={14} /> {sortOrder === 'asc' ? 'ছোট→বড়' : 'বড়→ছোট'}
          </button>

          {!isArchivedView && (
            <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#1c5fa8' : 'transparent', color: viewMode === 'list' ? '#fff' : '#475569', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><LayoutList size={14} /> সাধারণ লিস্ট</button>
              <button onClick={() => setViewMode('doctor')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'doctor' ? '#1c5fa8' : 'transparent', color: viewMode === 'doctor' ? '#fff' : '#475569', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><Stethoscope size={14} /> ডাক্তার ওয়াইজ</button>
            </div>
          )}
        </div>
      </div>

      {/* ফিল্টার ইনফো */}
      {(filterOfficer !== 'all' || filterStatus !== 'all' || filterDoctor !== 'all' || searchTerm) && (
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
          🔍 ফিল্টার প্রয়োগ করা হয়েছে: 
          {filterOfficer !== 'all' && <span style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginLeft: '5px' }}>অফিসার: {filterOfficer}</span>}
          {filterStatus !== 'all' && <span style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginLeft: '5px' }}>স্ট্যাটাস: {filterStatus}</span>}
          {filterDoctor !== 'all' && <span style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginLeft: '5px' }}>ডাক্তার: {filterDoctor}</span>}
          {searchTerm && <span style={{ background: '#eef1f7', padding: '2px 10px', borderRadius: '12px', marginLeft: '5px' }}>সার্চ: {searchTerm}</span>}
          <span style={{ marginLeft: '10px', fontWeight: '600' }}>মোট: {filteredAppointments.length}টি</span>
        </div>
      )}

      {/* ---------- লিস্ট ভিউ ---------- */}
      {viewMode === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
          <thead>
            <tr style={{ background: '#eef1f7', textAlign: 'left', color: '#1f2937' }}>
              <th style={{ padding: '12px' }}>সিরিয়াল</th>
              <th style={{ padding: '12px' }}>রোগীর নাম</th>
              <th style={{ padding: '12px' }}>বয়স</th>
              <th style={{ padding: '12px' }}>মোবাইল</th>
              <th style={{ padding: '12px' }}>বুকিং তারিখ</th>
              <th style={{ padding: '12px' }}>ডাক্তার</th>
              <th style={{ padding: '12px' }}>রেফারেল</th>
              <th style={{ padding: '12px' }}>বুকিং সোর্স</th>
              <th style={{ padding: '12px' }}>রোগীর টাইপ</th>
              <th style={{ padding: '12px' }}>রিমার্কস</th>
              <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
              <th style={{ padding: '12px' }}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 && <tr><td colSpan="12" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>কোনো বুকিং পাওয়া যায়নি</td></tr>}
            {filteredAppointments.map((appt) => {
              const isEditing = editingId === appt.id;
              const patientType = patientTypes[appt.id] || 'লোড হচ্ছে...';
              const isUpdating = updatingPatient === appt.id;
              const isNew = appt.isNew === true;

              return (
                <tr 
                  key={appt.id} 
                  style={{ 
                    borderBottom: '1px solid #eee', 
                    color: '#334155',
                    background: isNew ? '#f0fdf4' : 'transparent',
                    transition: 'background 0.3s ease',
                    cursor: isNew ? 'pointer' : 'default'
                  }}
                  onClick={() => isNew && handleRowClick(appt.id)}
                  title={isNew ? 'হাইলাইট সরাতে ক্লিক করুন' : ''}
                >
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    {appt.serialNo}
                    {isNew && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#16a34a', fontWeight: 'normal' }}>● নতুন</span>}
                  </td>
                  <td style={{ padding: '12px' }}>{appt.name}</td>
                  <td style={{ padding: '12px' }}>{appt.age || '-'}</td>
                  <td style={{ padding: '12px' }}>{appt.mobile}</td>
                  <td style={{ padding: '12px' }}>{appt.bookingDate} ({appt.bookingDay})</td>
                  <td style={{ padding: '12px' }}>{appt.doctorName}<br/><small style={{ color: '#64748b' }}>{appt.doctorDept}</small></td>
                  
                  {/* রেফারেল সোর্স */}
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <select 
                        value={editData.referralSource} 
                        onChange={(e) => setEditData({...editData, referralSource: e.target.value})}
                        style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                      >
                        {REFERRAL_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                      </select>
                    ) : (
                      appt.referralSource || '-'
                    )}
                  </td>

                  {/* মার্কেটিং অফিসার */}
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <select 
                        value={editData.marketingOfficer} 
                        onChange={(e) => setEditData({...editData, marketingOfficer: e.target.value})}
                        style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' }}
                      >
                        <option value="">নির্বাচন করুন</option>
                        {marketingTeam.map((m, idx) => {
                          const name = typeof m === 'string' ? m : m.name;
                          const key = typeof m === 'string' ? idx : m.id || idx;
                          return <option key={key} value={name}>{name}</option>;
                        })}
                      </select>
                    ) : (
                      <span style={{ fontWeight: '500' }}>{appt.marketingOfficer || <span style={{ color: '#94a3b8' }}>-</span>}</span>
                    )}
                  </td>

                  {/* রোগীর টাইপ - ড্রপডাউন */}
                  <td style={{ padding: '12px' }}>
                    {isAdmin && appt.patientId ? (
                      <select
                        value={patientType}
                        onChange={(e) => handleManualCategoryChange(appt.id, appt.patientId, e.target.value)}
                        disabled={isUpdating}
                        style={{
                          padding: '8px 18px 8px 16px',
                          borderRadius: '24px',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid #e2e8f0',
                          background: patientType === 'নতুন' ? '#dcfce7' : 
                                    patientType === 'রিপোর্ট' ? '#fef3c7' : 
                                    patientType === 'ফলোআপ' ? '#dbeafe' : '#f1f5f9',
                          color: patientType === 'নতুন' ? '#166534' : 
                                 patientType === 'রিপোর্ট' ? '#92400e' : 
                                 patientType === 'ফলোআপ' ? '#1e40af' : '#64748b',
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          minWidth: '130px',
                          outline: 'none',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s ease',
                          appearance: 'auto'
                        }}
                        onFocus={(e) => {
                          e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                        }}
                      >
                        <option value="নতুন">নতুন</option>
                        <option value="রিপোর্ট">রিপোর্ট</option>
                        <option value="ফলোআপ">ফলোআপ</option>
                      </select>
                    ) : (
                      <span style={{ 
                        background: patientType === 'নতুন' ? '#dcfce7' : 
                                  patientType === 'রিপোর্ট' ? '#fef3c7' : 
                                  patientType === 'ফলোআপ' ? '#dbeafe' : '#f1f5f9',
                        color: patientType === 'নতুন' ? '#166534' : 
                               patientType === 'রিপোর্ট' ? '#92400e' : 
                               patientType === 'ফলোআপ' ? '#1e40af' : '#64748b',
                        padding: '6px 16px',
                        borderRadius: '24px',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        {patientType}
                      </span>
                    )}
                    {isUpdating && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>⏳</span>}
                  </td>

                  {/* রিমার্কস */}
                  <td style={{ padding: '12px', minWidth: '150px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input type="text" value={editData.remarks || ''} onChange={(e) => setEditData({...editData, remarks: e.target.value})} placeholder="রিমার্কস লিখুন" style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1', fontSize: '13px' }} />
                        <button onClick={() => saveEdit(appt.id)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Save size={14} /></button>
                        <button onClick={cancelEdit} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>{appt.remarks || '-'}</span>
                        {canEdit && !isArchivedView && (
                          <button onClick={() => startEdit(appt)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px' }}><StatusBadge status={appt.status || 'pending'} /></td>
                  <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>{renderActions(appt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ---------- ডাক্তার ওয়াইজ ভিউ ---------- */}
      {viewMode === 'doctor' && (
        <div>
          {Object.keys(doctorWiseData).length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>কোনো বুকিং পাওয়া যায়নি</div> : (
            Object.entries(doctorWiseData).map(([doctorName, info]) => (
              <div key={doctorName} style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#1c5fa8', fontSize: '16px' }}>{doctorName}</strong>
                  <span style={{ background: '#0d9488', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>মোট: {info.patients.length} জন</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', fontSize: '13px' }}>
                      <th style={{ padding: '8px 12px' }}>সিরিয়াল</th>
                      <th style={{ padding: '8px 12px' }}>রোগীর নাম</th>
                      <th style={{ padding: '8px 12px' }}>বয়স</th>
                      <th style={{ padding: '8px 12px' }}>মোবাইল</th>
                      <th style={{ padding: '8px 12px' }}>বুকিং তারিখ</th>
                      <th style={{ padding: '8px 12px' }}>রেফারেল</th>
                      <th style={{ padding: '8px 12px' }}>মার্কেটিং অফিসার</th>
                      <th style={{ padding: '8px 12px' }}>রোগীর টাইপ</th>
                      <th style={{ padding: '8px 12px' }}>রিমার্কস</th>
                      <th style={{ padding: '8px 12px' }}>স্ট্যাটাস</th>
                      <th style={{ padding: '8px 12px' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.patients.map((appt) => {
                      const isEditing = editingId === appt.id;
                      const patientType = patientTypes[appt.id] || 'লোড হচ্ছে...';
                      const isUpdating = updatingPatient === appt.id;
                      const isNew = appt.isNew === true;
                      
                      return (
                        <tr key={appt.id} style={{ borderBottom: '1px solid #eee', fontSize: '14px', background: isNew ? '#f0fdf4' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{appt.serialNo}</td>
                          <td style={{ padding: '10px 12px' }}>{appt.name}</td>
                          <td style={{ padding: '10px 12px' }}>{appt.age || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{appt.mobile}</td>
                          <td style={{ padding: '10px 12px' }}>{appt.bookingDate} ({appt.bookingDay})</td>
                          <td style={{ padding: '10px 12px' }}>{appt.referralSource || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>{appt.marketingOfficer || '-'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {isAdmin && appt.patientId ? (
                              <select
                                value={patientType}
                                onChange={(e) => handleManualCategoryChange(appt.id, appt.patientId, e.target.value)}
                                disabled={isUpdating}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  border: '1px solid #cbd5e1',
                                  background: patientType === 'নতুন' ? '#dcfce7' : 
                                            patientType === 'রিপোর্ট' ? '#fef3c7' : 
                                            patientType === 'ফলোআপ' ? '#dbeafe' : '#f1f5f9',
                                  color: patientType === 'নতুন' ? '#166534' : 
                                         patientType === 'রিপোর্ট' ? '#92400e' : 
                                         patientType === 'ফলোআপ' ? '#1e40af' : '#64748b',
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  minWidth: '100px'
                                }}
                              >
                                <option value="নতুন">নতুন</option>
                                <option value="রিপোর্ট">রিপোর্ট</option>
                                <option value="ফলোআপ">ফলোআপ</option>
                              </select>
                            ) : (
                              <span style={{ 
                                background: patientType === 'নতুন' ? '#dcfce7' : 
                                          patientType === 'রিপোর্ট' ? '#fef3c7' : 
                                          patientType === 'ফলোআপ' ? '#dbeafe' : '#f1f5f9',
                                color: patientType === 'নতুন' ? '#166534' : 
                                       patientType === 'রিপোর্ট' ? '#92400e' : 
                                       patientType === 'ফলোআপ' ? '#1e40af' : '#64748b',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}>
                                {patientType}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>{appt.remarks || '-'}</td>
                          <td style={{ padding: '10px 12px' }}><StatusBadge status={appt.status || 'pending'} /></td>
                          <td style={{ padding: '10px 12px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{renderActions(appt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* রোগীর বিস্তারিত তথ্য */}
      {viewDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViewDetails(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ marginTop: 0, color: '#1c5fa8', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>রোগীর বিস্তারিত তথ্য</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><strong>নাম:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.name}</span></div>
              <div><strong>বয়স:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.age || '-'}</span></div>
              <div><strong>মোবাইল:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.mobile}</span></div>
              <div><strong>লিঙ্গ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.gender || '-'}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>ঠিকানা:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.address || '-'}</span></div>
              <div><strong>বুকিং তারিখ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.bookingDate} ({viewDetails.bookingDay})</span></div>
              <div><strong>সিরিয়াল:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.serialNo}</span></div>
              <div><strong>ডাক্তার:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.doctorName}</span></div>
              <div><strong>বিভাগ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.doctorDept}</span></div>
              <div><strong>রেফারেল সোর্স:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.referralSource || '-'}</span></div>
              {viewDetails.referredDoctorName && <div style={{ gridColumn: '1 / -1' }}><strong>রেফারিং ডাক্তার:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.referredDoctorName}</span></div>}
              <div><strong>মার্কেটিং অফিসার:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.marketingOfficer || '-'}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>রোগীর টাইপ:</strong><br/><span style={{ fontWeight: '700' }}>{patientTypes[viewDetails.id] || 'অজানা'}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>রিমার্কস:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.remarks || '-'}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><strong>স্ট্যাটাস:</strong><br/><StatusBadge status={viewDetails.status || 'pending'} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}