import React, { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { ChevronDown, Building2 } from 'lucide-react';

export default function HospitalSwitcher() {
  const { currentHospital, hospitals, switchHospital, isSuperAdmin } = useHospital();
  const [isOpen, setIsOpen] = useState(false);

  if (!isSuperAdmin || !hospitals || hospitals.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: '#f1f5f9',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#0f172a'
        }}
      >
        <Building2 size={16} />
        <span>{currentHospital?.name || 'Select Hospital'}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          zIndex: 100,
          minWidth: '220px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {hospitals.map(h => (
            <button
              key={h.id}
              onClick={() => { switchHospital(h.id); setIsOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: currentHospital?.id === h.id ? '#f0fdf4' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                color: '#1e293b',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              {h.name}
              {currentHospital?.id === h.id && <span style={{ marginLeft: '8px', color: '#22c55e' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}