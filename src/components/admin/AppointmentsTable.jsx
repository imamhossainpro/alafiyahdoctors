import React from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function AppointmentsTable({ appointments, onApprove, onPending, onDelete }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', width: '100%' }}>
      <h3 style={{ marginBottom: '15px' }}>রোগীর বুকিং তালিকা</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eef1f7', textAlign: 'left' }}>
            <th style={{ padding: '12px' }}>সিরিয়াল</th>
            <th style={{ padding: '12px' }}>নাম</th>
            <th style={{ padding: '12px' }}>ডাক্তার</th>
            <th style={{ padding: '12px' }}>মোবাইল</th>
            <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
            <th style={{ padding: '12px' }}>অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{appt.serialNo}</td>
              <td style={{ padding: '12px' }}>{appt.name}</td>
              <td style={{ padding: '12px' }}>{appt.doctorName}</td>
              <td style={{ padding: '12px' }}>{appt.mobile}</td>
              <td style={{ padding: '12px' }}>
                {appt.status === 'approved' ? (
                  <span style={{ color: '#2f9e52', fontWeight: 'bold' }}>অ্যাপ্রুভড</span>
                ) : appt.status === 'deleted' ? (
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>ডিলিটেড</span>
                ) : (
                  <span style={{ color: '#d97706', fontWeight: 'bold' }}>পেন্ডিং</span>
                )}
              </td>
              <td style={{ padding: '12px', display: 'flex', gap: '5px' }}>
                {appt.status !== 'approved' && (
                  <button onClick={() => onApprove(appt.id)} style={{ background: '#2f9e52', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer' }}><CheckCircle size={14} /></button>
                )}
                {appt.status !== 'pending' && (
                  <button onClick={() => onPending(appt.id)} style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer' }}><XCircle size={14} /></button>
                )}
                <button onClick={() => onDelete(appt.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>কোনো বুকিং পাওয়া যায়নি</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}