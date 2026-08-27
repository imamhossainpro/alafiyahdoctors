import React from 'react';
import { CheckCircle, XCircle, UserCheck, Archive, Trash2, Clock } from 'lucide-react';

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
  confirmed: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['completed'],
  completed: [],
  cancelled: [],
  'no-show': [],
  archived: []
};

const ActionButton = ({ onClick, title, bg, icon }) => (
  <button
    onClick={onClick}
    title={title}
    style={{ background: bg, color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer', marginRight: '4px' }}
  >{icon}</button>
);

export default function AppointmentsTable({ appointments, onStatusChange, onArchive, isArchivedView }) {
  const handleDropdownChange = (id, newStatus) => {
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      if (validTransitions[appt.status] && validTransitions[appt.status].includes(newStatus)) {
        onStatusChange(id, newStatus);
      } else {
        alert('Invalid Status Transition!');
      }
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', width: '100%', overflowX: 'auto', color: '#1f2937' }}>
      <h3 style={{ marginBottom: '15px', color: '#1f2937' }}>{isArchivedView ? 'আর্কাইভ বুকিং লিস্ট' : 'রোগীর বুকিং লিস্ট'}</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
        <thead>
          <tr style={{ background: '#eef1f7', textAlign: 'left', color: '#1f2937' }}>
            <th style={{ padding: '12px' }}>সিরিয়াল</th>
            <th style={{ padding: '12px' }}>রোগীর নাম</th>
            <th style={{ padding: '12px' }}>বয়স</th>
            <th style={{ padding: '12px' }}>মোবাইল</th>
            <th style={{ padding: '12px' }}>বুকিং তারিখ</th>
            <th style={{ padding: '12px' }}>ডাক্তার</th>
            <th style={{ padding: '12px' }}>রেফারেল</th>
            <th style={{ padding: '12px' }}>বর্তমান স্ট্যাটাস</th>
            <th style={{ padding: '12px' }}>অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const currentStatus = appt.status || 'pending';
            const nextStatuses = validTransitions[currentStatus] || [];
            let actions = [];
            
            // 🔥 আর্কাইভ ভিউ (Archived List) হলে UI আলাদা এবং পরিষ্কার
            if (isArchivedView) {
              actions.push(
                <button 
                  key="delete" 
                  onClick={() => onStatusChange(appt.id, 'PERMANENT_DELETE')} 
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer' }}
                  title="Permanent Delete"
                ><Trash2 size={14} /></button>
              );
            } else {
              // Active List-এর Action গুলো
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
              
              // ড্রপডাউন
              actions.push(
                <select
                  key="dropdown"
                  value=""
                  onChange={(e) => handleDropdownChange(appt.id, e.target.value)}
                  style={{ padding: '5px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', background: '#ffffff' }}
                >
                  <option value="" disabled>-- Manually Set --</option>
                  {nextStatuses.map(status => (
                    <option key={status} value={status}>{status.replace('-', ' ')}</option>
                  ))}
                </select>
              );
            }

            return (
              <tr key={appt.id} style={{ borderBottom: '1px solid #eee', color: '#334155' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{appt.serialNo}</td>
                <td style={{ padding: '12px' }}>{appt.name}</td>
                <td style={{ padding: '12px' }}>{appt.age || '-'}</td>
                <td style={{ padding: '12px' }}>{appt.mobile}</td>
                <td style={{ padding: '12px' }}>{appt.bookingDate} ({appt.bookingDay})</td>
                <td style={{ padding: '12px' }}>{appt.doctorName}<br/><small style={{color:'#64748b'}}>{appt.doctorDept}</small></td>
                <td style={{ padding: '12px' }}>{appt.referralSource || '-'}</td>
                <td style={{ padding: '12px' }}><StatusBadge status={currentStatus} /></td>
                <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {actions}
                </td>
              </tr>
            );
          })}
          {appointments.length === 0 && (
            <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>{isArchivedView ? 'কোনো আর্কাইভ করা রেকর্ড নেই' : 'কোনো বুকিং পাওয়া যায়নি'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}