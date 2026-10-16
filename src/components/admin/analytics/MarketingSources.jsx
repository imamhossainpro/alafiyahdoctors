// src/components/admin/analytics/MarketingSources.jsx
// ==================================================
// 📢 MarketingSources — Referral source bar chart
// ==================================================
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

export default function MarketingSources({ data, loading }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>📢 Marketing Sources</h4>
        <div style={skeletonStyle} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>📢 Marketing Sources</h4>
        <div style={emptyStyle}>কোনো marketing data নেই</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h4 style={titleStyle}>📢 Marketing Sources</h4>
      <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: '#334155' }}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name, props) => [
              `${value} bookings (${props.payload.completed} completed)`,
              props.payload.name,
            ]}
          />
          <Bar dataKey="total" fill="#0e8ca3" radius={[0, 6, 6, 0]} barSize={22}>
            <LabelList
              dataKey="total"
              position="right"
              style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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

const emptyStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#94a3b8',
  fontSize: '13px',
};

const skeletonStyle = {
  height: '260px',
  background: '#f1f5f9',
  borderRadius: '8px',
  animation: 'pulse 1.5s ease-in-out infinite',
};