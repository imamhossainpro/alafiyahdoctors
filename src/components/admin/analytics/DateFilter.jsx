// src/components/admin/analytics/DateFilter.jsx
// ==================================================
// 📅 DateFilter — Reusable date range selector
// ==================================================
import React from 'react';
import { Calendar, Filter } from 'lucide-react';

const PRESETS = [
  { key: 'today', label: 'আজ' },
  { key: 'week', label: 'গত ৭ দিন' },
  { key: 'month', label: 'গত ৩০ দিন' },
  { key: 'year', label: 'গত ১ বছর' },
  { key: 'all', label: 'সব সময়' },
  { key: 'custom', label: 'কাস্টম' },
];

export default function DateFilter({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        <Calendar size={14} color="#1c5fa8" />
        <strong style={{ fontSize: '13px', color: '#1e293b' }}>
          তারিখ অনুযায়ী ফিল্টার
        </strong>
      </div>

      {/* Preset Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPresetChange(p.key)}
            style={{
              padding: '5px 12px',
              background: preset === p.key ? '#1c5fa8' : '#fff',
              color: preset === p.key ? '#fff' : '#334155',
              border:
                '1px solid ' + (preset === p.key ? '#1c5fa8' : '#cbd5e1'),
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {(preset === 'custom' || startDate || endDate) && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              শুরু তারিখ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                background: '#fff',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '4px',
              }}
            >
              শেষ তারিখ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                background: '#fff',
              }}
            />
          </div>

          {startDate && endDate && (
            <div
              style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '18px',
              }}
            >
              <Filter size={12} />
              {startDate} → {endDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}