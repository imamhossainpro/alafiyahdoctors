// src/components/mou/MouForm.jsx
// ==================================================
// 📝 MOU Form — 40+ fields grouped into 4 sections
// ==================================================
// ✅ Field-by-field validation
// ✅ Error display (Bengali + English)
// ✅ Real-time updates via onChange callback
// ✅ Responsive (mobile-friendly)
// ==================================================
import React from 'react';
import { MOU_GROUPS, validateMouField } from '../../utils/mouFields';

// ==================================================
// ✅ Single field renderer
// ==================================================
function MouField({ field, value, error, onChange }) {
  const id = `mou_${field.key}`;
  const inputType = field.type === 'num' ? 'number' : field.type;

  const baseStyle = {
    width: '100%',
    boxSizing: 'border-box',
    font: 'inherit',
    color: '#1d2330',
    background: '#ffffff',
    border: '1px solid ' + (error ? '#b42318' : '#d9dde5'),
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const handleChange = (e) => {
    onChange(field.key, e.target.value);
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#1f5f8b';
    e.target.style.boxShadow = '0 0 0 3px rgba(31,95,139,0.12)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? '#b42318' : '#d9dde5';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '12.5px',
          color: '#667085',
          marginBottom: '4px',
          fontWeight: '500',
        }}
      >
        {field.label}
        {field.req && (
          <span style={{ color: '#b42318', marginLeft: '4px', fontStyle: 'normal' }}>
            *
          </span>
        )}
      </label>

      {field.type === 'area' ? (
        <textarea
          id={id}
          name={field.key}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={4}
          aria-invalid={!!error}
          style={{ ...baseStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      ) : (
        <input
          id={id}
          name={field.key}
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          min={field.type === 'num' ? '0' : undefined}
          style={baseStyle}
        />
      )}

      {error && (
        <small
          style={{
            display: 'block',
            color: '#b42318',
            fontSize: '11.5px',
            marginTop: '4px',
            fontWeight: '500',
          }}
        >
          ⚠️ {error}
        </small>
      )}
    </div>
  );
}

// ==================================================
// ✅ Main Form Component
// ==================================================
export default function MouForm({ data, errors = {}, onChange }) {
  if (!data) return null;

  // Compute error for a field (real-time validation as user types)
  const getError = (field) => {
    // If already validated & has error, show it
    if (errors[field.key]) return errors[field.key];
    // Otherwise, do not show error while typing (avoid annoying UX)
    return '';
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #d9dde5',
        borderRadius: '10px',
        padding: '4px 14px 16px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        color: '#1d2330',
      }}
    >
      {MOU_GROUPS.map((group) => (
        <fieldset
          key={group.title}
          style={{
            border: 0,
            padding: 0,
            margin: '14px 0 0',
          }}
        >
          <legend
            style={{
              fontWeight: '600',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#1f5f8b',
              padding: '0 0 6px',
              borderBottom: '1px solid #d9dde5',
              width: '100%',
              marginBottom: '10px',
              display: 'block',
            }}
          >
            {group.title}
          </legend>

          {group.fields.map((field) => (
            <MouField
              key={field.key}
              field={field}
              value={data[field.key]}
              error={getError(field)}
              onChange={onChange}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

// ==================================================
// ✅ Validation helper (used by parent)
// ==================================================
export const validateAllMouFields = (data) => {
  const errors = {};
  let firstErrorKey = null;

  MOU_GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      const err = validateMouField(field, data[field.key]);
      if (err) {
        errors[field.key] = err;
        if (!firstErrorKey) firstErrorKey = field.key;
      }
    });
  });

  return { errors, firstErrorKey, isValid: !firstErrorKey };
};