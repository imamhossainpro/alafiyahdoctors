// src/components/admin/analytics/BookingTrends.jsx
// ==================================================
// 📈 BookingTrends — Daily booking trend chart
// ==================================================
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function BookingTrends({ data, loading }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>📈 Booking Trends</h4>
        <div style={skeletonStyle}>
          <div style={skeletonLineStyle} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>📈 Booking Trends</h4>
        <div style={emptyStyle}>এই সময়সীমায় কোনো ডেটা নেই</div>
      </div>
    );
  }

  // Format date for tooltip
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div style={cardStyle}>
      <h4 style={titleStyle}>📈 Booking Trends</h4>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1c5fa8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#1c5fa8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={formatDate}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1c5fa8"
            strokeWidth={2}
            fill="url(#colorTotal)"
            name="Total"
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#16a34a"
            strokeWidth={2}
            fill="url(#colorCompleted)"
            name="Completed"
          />
        </AreaChart>
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

const skeletonLineStyle = {};