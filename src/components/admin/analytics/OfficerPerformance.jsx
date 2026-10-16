// src/components/admin/analytics/OfficerPerformance.jsx
// ==================================================
// 👥 OfficerPerformance — Marketing officer table
// ==================================================
import React from 'react';

export default function OfficerPerformance({ data, loading }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>👥 Marketing Officer Performance</h4>
        <div style={skeletonStyle} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>👥 Marketing Officer Performance</h4>
        <div style={emptyStyle}>এই সময়সীমায় কোনো officer data নেই</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h4 style={titleStyle}>👥 Marketing Officer Performance</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={headRowStyle}>
              <th style={thStyle}>Officer</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Completed</th>
              <th style={thStyle}>Cancelled</th>
              <th style={thStyle}>নতুন</th>
              <th style={thStyle}>রিপোর্ট</th>
              <th style={thStyle}>ফলোআপ</th>
              <th style={thStyle}>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {data.map((officer, i) => (
              <tr key={i} style={bodyRowStyle}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#1c5fa8' }}>
                  {officer.name}
                </td>
                <td style={tdStyle}>{officer.total}</td>
                <td style={{ ...tdStyle, color: '#16a34a', fontWeight: 600 }}>
                  {officer.completed}
                </td>
                <td style={{ ...tdStyle, color: '#dc2626', fontWeight: 600 }}>
                  {officer.cancelled}
                </td>
                <td style={tdStyle}>{officer.newPatients}</td>
                <td style={tdStyle}>{officer.reportPatients}</td>
                <td style={tdStyle}>{officer.followupPatients}</td>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 700,
                    color:
                      parseFloat(officer.conversionRate) > 50
                        ? '#16a34a'
                        : '#d97706',
                  }}
                >
                  {officer.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
};

const titleStyle = {
  margin: '0 0 16px 0',
  fontSize: '15px',
  color: '#1e293b',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
  minWidth: '700px',
};

const headRowStyle = {
  background: '#f1f5f9',
  textAlign: 'left',
};

const thStyle = {
  padding: '10px 12px',
  fontWeight: 700,
  color: '#475569',
  fontSize: '12px',
};

const bodyRowStyle = {
  borderBottom: '1px solid #f1f5f9',
};

const tdStyle = {
  padding: '10px 12px',
};

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#94a3b8',
  fontSize: '13px',
};

const skeletonStyle = {
  height: '180px',
  background: '#f1f5f9',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',
};