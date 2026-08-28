import React, { useState } from 'react';
import { CheckCircle, XCircle, UserCheck, Archive, Trash2, Clock, Stethoscope, LayoutList, Undo2, Eye, Search } from 'lucide-react';

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

export default function AppointmentsTable({ appointments, onStatusChange, onArchive, onRestore, isArchivedView, user }) {
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDetails, setViewDetails] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'sub-admin' || user?.role === 'editor';

  const filteredAppointments = appointments.filter((appt) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (appt.name?.toLowerCase().includes(term) || '') ||
      (appt.mobile?.toLowerCase().includes(term) || '') ||
      (String(appt.serialNo || '').includes(term)) ||
      (appt.doctorName?.toLowerCase().includes(term) || '');
    return matchesSearch;
  });

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
      if (user?.role === 'admin') {
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
            <input type="text" placeholder="নাম, মোবাইল, সিরিয়াল..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', padding: '6px', fontSize: '13px', width: '200px' }} />
          </div>

          {!isArchivedView && (
            <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? '#1c5fa8' : 'transparent', color: viewMode === 'list' ? '#fff' : '#475569', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><LayoutList size={14} /> সাধারণ লিস্ট</button>
              <button onClick={() => setViewMode('doctor')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === 'doctor' ? '#1c5fa8' : 'transparent', color: viewMode === 'doctor' ? '#fff' : '#475569', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><Stethoscope size={14} /> ডাক্তার ওয়াইজ</button>
            </div>
          )}
        </div>
      </div>

      {/* সাধারণ লিস্ট ভিউ */}
      {viewMode === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ background: '#eef1f7', textAlign: 'left', color: '#1f2937' }}>
              <th style={{ padding: '12px' }}>সিরিয়াল</th>
              <th style={{ padding: '12px' }}>রোগীর নাম</th>
              <th style={{ padding: '12px' }}>বয়স</th>
              <th style={{ padding: '12px' }}>মোবাইল</th>
              <th style={{ padding: '12px' }}>বুকিং তারিখ</th>
              <th style={{ padding: '12px' }}>ডাক্তার</th>
              <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
              <th style={{ padding: '12px' }}>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 && <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>কোনো বুকিং পাওয়া যায়নি</td></tr>}
            {filteredAppointments.map((appt) => (
              <tr key={appt.id} style={{ borderBottom: '1px solid #eee', color: '#334155' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{appt.serialNo}</td>
                <td style={{ padding: '12px' }}>{appt.name}</td>
                <td style={{ padding: '12px' }}>{appt.age || '-'}</td>
                <td style={{ padding: '12px' }}>{appt.mobile}</td>
                <td style={{ padding: '12px' }}>{appt.bookingDate} ({appt.bookingDay})</td>
                <td style={{ padding: '12px' }}>{appt.doctorName}<br/><small style={{ color: '#64748b' }}>{appt.doctorDept}</small></td>
                <td style={{ padding: '12px' }}><StatusBadge status={appt.status || 'pending'} /></td>
                <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>{renderActions(appt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ডাক্তার ওয়াইজ ভিউ */}
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
                  <thead><tr style={{ background: '#f1f5f9', textAlign: 'left', fontSize: '13px' }}><th style={{ padding: '8px 12px' }}>সিরিয়াল</th><th style={{ padding: '8px 12px' }}>রোগীর নাম</th><th style={{ padding: '8px 12px' }}>স্ট্যাটাস</th><th style={{ padding: '8px 12px' }}>অ্যাকশন</th></tr></thead>
                  <tbody>
                    {info.patients.map(appt => (
                      <tr key={appt.id} style={{ borderBottom: '1px solid #eee', fontSize: '14px' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{appt.serialNo}</td>
                        <td style={{ padding: '10px 12px' }}>{appt.name}</td>
                        <td style={{ padding: '10px 12px' }}><StatusBadge status={appt.status || 'pending'} /></td>
                        <td style={{ padding: '10px 12px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{renderActions(appt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* রোগীর বিস্তারিত তথ্য দেখার মোডাল (ঠিকানা ও রেফারেল বাদ) */}
      {viewDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViewDetails(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '24px', position: 'relative', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewDetails(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            <h3 style={{ marginTop: 0, color: '#1c5fa8', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>রোগীর বিস্তারিত তথ্য</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>নাম:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.name}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>বয়স:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.age || '-'}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>মোবাইল:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.mobile}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>লিঙ্গ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.gender || '-'}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>বুকিং তারিখ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.bookingDate} ({viewDetails.bookingDay})</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>সিরিয়াল:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.serialNo}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>ডাক্তার:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.doctorName}</span></div>
              <div><strong style={{ color: '#64748b', fontSize: '13px' }}>বিভাগ:</strong><br/><span style={{ fontWeight: '700' }}>{viewDetails.doctorDept}</span></div>
              <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#64748b', fontSize: '13px' }}>স্ট্যাটাস:</strong><br/><StatusBadge status={viewDetails.status || 'pending'} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}