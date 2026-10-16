// src/components/admin/analytics/StatusBreakdown.jsx
// ==================================================
// 🥧 StatusBreakdown — Booking status pie chart
// ==================================================
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  'checked-in': '#8b5cf6',
  completed: '#16a34a',
  cancelled: '#dc2626',
  'no-show': '#6b7280',
};

export default function StatusBreakdown({ data, loading }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>🥧 Status Breakdown</h4>
        <div style={skeletonStyle} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>🥧 Status Breakdown</h4>
        <div style={emptyStyle}>কোনো ডেটা নেই</div>
      </div>
    );
  }

  const filteredData = data.filter((d) => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div style={cardStyle}>
        <h4 style={titleStyle}>🥧 Status Breakdown</h4>
        <div style={emptyStyle}>এই সময়সীমায় কোনো booking নেই</div>
      </div>
    );
  }

  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={cardStyle}>
      <h4 style={titleStyle}>🥧 Status Breakdown</h4>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={filteredData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.key] || '#64748b'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const count = entry.payload.value;
              const pct = ((count / total) * 100).toFixed(0);
              return `${value} (${pct}%)`;
            }}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
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