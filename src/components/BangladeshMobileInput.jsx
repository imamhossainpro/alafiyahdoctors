// src/components/BangladeshMobileInput.jsx
// ==================================================
// 🇧🇩 BangladeshMobileInput — Normalized to international format
// ==================================================
// ✅ Display: user types 11 digits (0XXXXXXXXXX)
// ✅ onChange sends: 880XXXXXXXXXX (13 digits, international)
// ✅ Firestore stores: 880XXXXXXXXXX (consistent)
// ✅ Server: no transformation needed
// ==================================================
import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

// ✅ Valid prefixes (3 digits, with leading 0)
const BD_PREFIXES = ['013', '014', '015', '016', '017', '018', '019'];

// ==================================================
// ✅ Utility: Normalize BD number to international format
// Input:  01889885094 | 8801889885094 | 881889885094 | 1889885094
// Output: 8801889885094
// ==================================================
export const normalizeBDNumber = (input) => {
  if (!input) return '';
  let digits = String(input).replace(/[^0-9]/g, '');

  // Remove existing country code
  if (digits.startsWith('880')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('88')) {
    digits = digits.substring(2);
  }

  // Remove leading 0
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // Now digits should be 10-digit (e.g., 1889885094)
  // Add 880 prefix
  return digits ? '880' + digits : '';
};

// ==================================================
// ✅ Utility: Extract user-facing 11-digit format from stored value
// Input:  8801889885094 | 01889885094 | 1889885094
// Output: 01889885094 (for display)
// ==================================================
export const toDisplayFormat = (input) => {
  if (!input) return '';
  let digits = String(input).replace(/[^0-9]/g, '');

  // Strip country code
  if (digits.startsWith('880')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('88')) {
    digits = digits.substring(2);
  }

  // Ensure leading 0
  if (!digits.startsWith('0')) {
    digits = '0' + digits;
  }

  return digits.slice(0, 11);
};

const CSS = `
  .bd-mobile-field {
    margin-bottom: 15px;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
  }

  .bd-mobile-label {
    display: block;
    font-size: 13.5px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
  }

  .bd-mobile-label .bd-required {
    color: #dc2626;
    margin-left: 4px;
  }

  .bd-mobile-input-wrap {
    display: flex;
    align-items: center;
    width: 100%;
    background: #fff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 0 14px;
    min-height: 50px;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .bd-mobile-input-wrap.focused {
    border-color: #0d9488;
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
  }

  .bd-mobile-input-wrap.valid {
    border-color: #22c55e;
  }

  .bd-mobile-input-wrap.invalid {
    border-color: #dc2626;
  }

  .bd-mobile-flag {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
    user-select: none;
  }

  .bd-mobile-country {
    font-size: 14.5px;
    font-weight: 700;
    color: #1e293b;
    padding: 0 4px 0 8px;
    flex-shrink: 0;
    user-select: none;
    letter-spacing: 0.5px;
  }

  .bd-mobile-divider {
    width: 1px;
    height: 24px;
    background: #e2e8f0;
    margin: 0 10px;
    flex-shrink: 0;
  }

  .bd-mobile-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 15px;
    font-family: inherit;
    font-weight: 500;
    color: #1e293b;
    letter-spacing: 1px;
    padding: 12px 0;
    min-width: 0;
  }

  .bd-mobile-input::placeholder {
    color: #94a3b8;
    letter-spacing: 0.3px;
    font-weight: 400;
  }

  .bd-mobile-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .bd-mobile-counter {
    font-size: 12.5px;
    font-weight: 600;
    color: #94a3b8;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5px;
    user-select: none;
    transition: color 0.2s;
  }

  .bd-mobile-counter.valid {
    color: #16a34a;
  }

  .bd-mobile-counter.invalid {
    color: #dc2626;
  }

  .bd-mobile-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }

  .bd-mobile-icon.valid {
    background: #22c55e;
    animation: bdPop 0.3s ease;
  }

  .bd-mobile-icon.invalid {
    background: #fee2e2;
    animation: bdPop 0.3s ease;
  }

  @keyframes bdPop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .bd-mobile-error {
    font-size: 12px;
    color: #dc2626;
    margin-top: 6px;
    margin-left: 4px;
    font-weight: 600;
    font-family: inherit;
  }

  .bd-mobile-hint {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 4px;
    margin-left: 4px;
    font-family: inherit;
  }

  @media (max-width: 480px) {
    .bd-mobile-country {
      font-size: 13.5px;
      padding: 0 2px 0 6px;
    }
    .bd-mobile-flag {
      font-size: 18px;
    }
    .bd-mobile-input {
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .bd-mobile-input::placeholder {
      font-size: 12px;
    }
    .bd-mobile-counter {
      font-size: 11.5px;
    }
    .bd-mobile-icon {
      width: 20px;
      height: 20px;
    }
  }
`;

export default function BangladeshMobileInput({
  value,                    // ← international format (8801889885094)
  onChange,                 // ← receives international format
  label = 'মোবাইল নম্বর',
  required = true,
  placeholder = '01XXXXXXXXX',
  name = 'mobile',
  showHint = true,
}) {
  const [focused, setFocused] = useState(false);

  // ==================================================
  // ✅ Internal display state — 11 digits starting with 0
  // ==================================================
  const [displayValue, setDisplayValue] = useState(() =>
    toDisplayFormat(value || '')
  );

  // Sync display when external value changes
  useEffect(() => {
    const newDisplay = toDisplayFormat(value || '');
    // Only update if it's different (prevents cursor jumping)
    setDisplayValue((prev) => {
      if (prev === newDisplay) return prev;
      return newDisplay;
    });
  }, [value]);

  // ==================================================
  // ✅ Helpers
  // ==================================================
  const toEnglish = (str) => {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return String(str).replace(/[০-৯]/g, (ch) => en[bn.indexOf(ch)]);
  };

  // ==================================================
  // ✅ Validation (based on 11-digit display value)
  // ==================================================
  const digits = displayValue.replace(/[^0-9]/g, '');
  const maxLength = 11;
  const isValidLength = digits.length === 11;
  const isValidPrefix = BD_PREFIXES.includes(digits.slice(0, 3));
  const isValid = isValidLength && isValidPrefix;
  const isInvalid = isValidLength && !isValidPrefix;

  // ==================================================
  // ✅ Handle user input — sends international format to parent
  // ==================================================
  const handleChange = (e) => {
    let raw = toEnglish(e.target.value).replace(/[^0-9]/g, '');
    raw = raw.slice(0, maxLength);

    setDisplayValue(raw);

    // ✅ Always send international format to parent (even if incomplete)
    // Parent can validate based on completeness
    const international = normalizeBDNumber(raw);
    onChange(international);
  };

  // ==================================================
  // ✅ Visual State
  // ==================================================
  const wrapClass = [
    'bd-mobile-input-wrap',
    focused ? 'focused' : '',
    isValid ? 'valid' : '',
    isInvalid ? 'invalid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const counterClass = isValid ? 'valid' : isInvalid ? 'invalid' : '';

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <>
      <style>{CSS}</style>
      <div className="bd-mobile-field">
        <label className="bd-mobile-label">
          {label}
          {required && <span className="bd-required">*</span>}
        </label>

        <div className={wrapClass}>
          <span className="bd-mobile-flag">🇧🇩</span>
          <span className="bd-mobile-country">+88</span>
          <span className="bd-mobile-divider" />

          <input
            className="bd-mobile-input"
            type="tel"
            inputMode="numeric"
            name={name}
            value={displayValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete="tel-national"
          />

          <div className="bd-mobile-meta">
            <span className={`bd-mobile-counter ${counterClass}`}>
              {digits.length}/{maxLength}
            </span>

            {isValid && (
              <span className="bd-mobile-icon valid">
                <Check size={13} color="#fff" strokeWidth={3} />
              </span>
            )}

            {isInvalid && (
              <span className="bd-mobile-icon invalid">
                <AlertCircle size={13} color="#dc2626" strokeWidth={2.5} />
              </span>
            )}
          </div>
        </div>

        {isInvalid && (
          <div className="bd-mobile-error">ভুল ফরমেট</div>
        )}

        {showHint && isValid && (
          <div className="bd-mobile-hint">
            সেভ হবে: {normalizeBDNumber(digits)}
          </div>
        )}
      </div>
    </>
  );
}