// src/components/admin/MoUForm.jsx
// ==================================================
// 📄 MoU Form — Create / Edit MoU Client
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  Building2,
  Percent,
  ScrollText,
  Calendar,
  Info,
} from 'lucide-react';
import {
  blankClient,
  ORG1_DEFAULTS,
  MOU_FORM_GROUPS,
} from '../../utils/mouDefaults';

// ==================================================
// ✅ CSS
// ==================================================
const FormCSS = `
.mouf-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.mouf-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 920px;
  max-height: 94vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
}

/* Header */
.mouf-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap;
}
.mouf-header-left { flex: 1; min-width: 0; }
.mouf-title {
  margin: 0;
  font-size: 18px; font-weight: 800; color: #1e293b;
  display: flex; align-items: center; gap: 8px;
}
.mouf-sub {
  margin: 4px 0 0 0;
  font-size: 13px; color: #64748b;
}
.mouf-close {
  background: transparent; border: none;
  color: #64748b; cursor: pointer;
  padding: 6px; border-radius: 8px;
  display: flex; align-items: center;
}
.mouf-close:hover { background: #e2e8f0; color: #1e293b; }

/* Body */
.mouf-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 24px;
  background: #ffffff;
}

/* Section */
.mouf-section {
  margin-bottom: 26px;
}
.mouf-section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; color: #1c5fa8;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #e2e8f0;
}
.mouf-section-header svg { flex-shrink: 0; }

/* Field */
.mouf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 700px) {
  .mouf-grid { grid-template-columns: 1fr; }
}
.mouf-field { display: flex; flex-direction: column; gap: 4px; }
.mouf-field.mouf-full { grid-column: 1 / -1; }

.mouf-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  display: flex; align-items: center; gap: 6px;
}
.mouf-label .req { color: #dc2626; font-weight: 700; }
.mouf-label .hint {
  font-size: 11px; color: #94a3b8; font-weight: 400;
}

.mouf-input,
.mouf-textarea,
.mouf-select {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: #1e293b;
  background: #fff;
  transition: all 0.2s;
  box-sizing: border-box;
}
.mouf-input:focus,
.mouf-textarea:focus,
.mouf-select:focus {
  outline: none;
  border-color: #1c5fa8;
  box-shadow: 0 0 0 3px rgba(28, 95, 168, 0.14);
}
.mouf-input.error,
.mouf-textarea.error,
.mouf-select.error {
  border-color: #dc2626;
  background: #fef2f2;
}
.mouf-textarea {
  resize: vertical;
  min-height: 66px;
  line-height: 1.5;
}

.mouf-error {
  font-size: 11.5px;
  color: #dc2626;
  font-weight: 600;
  margin-top: 2px;
}

/* Info box */
.mouf-info {
  display: flex; gap: 8px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 12.5px;
  color: #0c4a6e;
  line-height: 1.6;
}
.mouf-info svg { flex-shrink: 0; margin-top: 2px; }

/* Footer */
.mouf-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex; justify-content: flex-end; gap: 10px;
  flex-wrap: wrap;
}
.mouf-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}
.mouf-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.mouf-btn-primary {
  background: #1c5fa8; color: #fff;
  box-shadow: 0 4px 12px rgba(28, 95, 168, 0.3);
}
.mouf-btn-primary:hover:not(:disabled) {
  background: #154a82; transform: translateY(-1px);
}
.mouf-btn-secondary {
  background: transparent;
  color: #475569;
  border: 1.5px solid #cbd5e1;
}
.mouf-btn-secondary:hover:not(:disabled) {
  background: #f1f5f9;
}

/* Loading banner (top) */
.mouf-banner {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.mouf-banner.error {
  background: #fee2e2;
  color: #991b1b;
}
.mouf-banner.success {
  background: #dcfce7;
  color: #166534;
}

/* Icon helper */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

// ==================================================
// ✅ Validators
// ==================================================
const validateField = (field, value) => {
  const v = String(value ?? '').trim();

  if (field.required && !v) {
    return 'এই ঘরটি পূরণ করুন';
  }
  if (!v) return '';

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return 'সঠিক ইমেইল দিন';
  }
  if (
    field.type === 'tel' &&
    !/^\+?[0-9][0-9\s\-()]{6,19}$/.test(v)
  ) {
    return 'সঠিক ফোন নম্বর দিন (+, digits, space, hyphen)';
  }
  if (field.type === 'date' && isNaN(new Date(v).getTime())) {
    return 'সঠিক তারিখ দিন';
  }
  if (field.type === 'number') {
    const n = Number(v);
    if (isNaN(n) || n < 0) return 'সঠিক সংখ্যা দিন';
    if (field.min !== undefined && n < field.min)
      return `সর্বনিম্ন ${field.min}`;
    if (field.max !== undefined && n > field.max)
      return `সর্বোচ্চ ${field.max}`;
  }
  return '';
};

// ==================================================
// ✅ Section icons map
// ==================================================
const SECTION_ICONS = {
  '📅 Agreement Information': Calendar,
  '🕌 Client Institution (org2)': Building2,
  '💰 Discount Terms': Percent,
  '📜 Termination Terms': ScrollText,
  '📂 Meta': Info,
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function MoUForm({
  initial = null,   // existing client (edit mode) | null (create mode)
  onSave,
  onClose,
  saving = false,   // parent-provided saving state
}) {
  const isEdit = !!initial;

  // ✅ form data (never mutate props)
  const [data, setData] = useState(() => {
    if (isEdit && initial) {
      // merge org1 defaults (in case old doc missing keys)
      return { ...ORG1_DEFAULTS, ...initial };
    }
    return blankClient();
  });

  // ✅ validation errors
  const [errors, setErrors] = useState({});

  // ✅ touched flags (only show error after user interaction)
  const [touched, setTouched] = useState({});

  // ✅ banner state
  const [banner, setBanner] = useState(null);

  // ==================================================
  // ✅ Escape key to close
  // ==================================================
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // ==================================================
  // ✅ Build fields meta (flat map)
  // ==================================================
  const fieldsByKey = useMemo(() => {
    const map = {};
    MOU_FORM_GROUPS.forEach((group) => {
      group.fields.forEach((f) => {
        map[f.key] = f;
      });
    });
    return map;
  }, []);

  // ==================================================
  // ✅ Update handler
  // ==================================================
  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));

    // validate on the fly if touched
    if (touched[key]) {
      const field = fieldsByKey[key];
      setErrors((prev) => ({
        ...prev,
        [key]: validateField(field, value),
      }));
    }
  };

  const handleBlur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const field = fieldsByKey[key];
    setErrors((prev) => ({
      ...prev,
      [key]: validateField(field, data[key]),
    }));
  };

  // ==================================================
  // ✅ Validate all → returns first invalid key or null
  // ==================================================
  const validateAll = () => {
    const newErrors = {};
    let firstInvalid = null;

    MOU_FORM_GROUPS.forEach((group) => {
      group.fields.forEach((f) => {
        const err = validateField(f, data[f.key]);
        if (err) {
          newErrors[f.key] = err;
          if (!firstInvalid) firstInvalid = f.key;
        }
      });
    });

    setErrors(newErrors);
    setTouched((prev) => {
      const allTouched = { ...prev };
      Object.keys(newErrors).forEach((k) => (allTouched[k] = true));
      return allTouched;
    });

    if (firstInvalid) {
      // scroll to first invalid field
      const el = document.getElementById('mouf-' + firstInvalid);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.focus?.(), 300);
      }
    }

    return firstInvalid;
  };

  // ==================================================
  // ✅ Submit
  // ==================================================
  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    setBanner(null);

    const firstInvalid = validateAll();
    if (firstInvalid) {
      setBanner({
        type: 'error',
        text: 'কিছু ঘর সঠিকভাবে পূরণ করুন। লাল চিহ্নিত ঘরগুলো দেখুন।',
      });
      return;
    }

    // ✅ sanitize numbers → string-safe copy
    const payload = { ...data };

    try {
      await onSave(payload);
      // Parent decides when to close & show toast
    } catch (err) {
      console.error('❌ MoUForm save error:', err);
      setBanner({
        type: 'error',
        text: err?.message || 'সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
      });
    }
  };

  // ==================================================
  // ✅ Reset (only create mode)
  // ==================================================
  const handleReset = () => {
    if (
      !window.confirm(
        'সব ইনপুট মুছে নতুন করে লিখতে চান? সংরক্ষিত তথ্য মুছে যাবে।'
      )
    )
      return;
    setData(blankClient());
    setErrors({});
    setTouched({});
    setBanner({ type: 'success', text: 'ফর্ম রিসেট হয়েছে।' });
    setTimeout(() => setBanner(null), 2000);
  };

  // ==================================================
  // ✅ Render one field
  // ==================================================
  const renderField = (field) => {
    const value = data[field.key] ?? '';
    const error = touched[field.key] ? errors[field.key] : '';
    const hasError = !!error;
    const inputId = 'mouf-' + field.key;
    const fullWidth =
      field.type === 'textarea' ||
      field.key === 'org2_name' ||
      field.key === 'org2_address' ||
      field.key === 'org2_description' ||
      field.key === 'internalNotes';

    const commonProps = {
      id: inputId,
      name: field.key,
      className:
        (field.type === 'textarea'
          ? 'mouf-textarea'
          : field.type === 'select'
          ? 'mouf-select'
          : 'mouf-input') + (hasError ? ' error' : ''),
      value,
      onChange: (e) => handleChange(field.key, e.target.value),
      onBlur: () => handleBlur(field.key),
    };

    return (
      <div
        key={field.key}
        className={`mouf-field ${fullWidth ? 'mouf-full' : ''}`}
      >
        <label className="mouf-label" htmlFor={inputId}>
          {field.label}
          {field.required && <span className="req">*</span>}
          {field.hint && (
            <span className="hint">({field.hint})</span>
          )}
        </label>

        {field.type === 'textarea' && (
          <textarea
            {...commonProps}
            rows={field.rows || 2}
            placeholder={field.placeholder || ''}
          />
        )}

        {field.type === 'select' && (
          <select {...commonProps}>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type !== 'textarea' && field.type !== 'select' && (
          <input
            {...commonProps}
            type={
              field.type === 'number'
                ? 'number'
                : field.type === 'tel'
                ? 'tel'
                : field.type === 'email'
                ? 'email'
                : field.type === 'date'
                ? 'date'
                : 'text'
            }
            min={field.min}
            max={field.max}
            placeholder={field.placeholder || ''}
          />
        )}

        {hasError && <div className="mouf-error">⚠️ {error}</div>}
      </div>
    );
  };

  // ==================================================
  // ✅ Render a group
  // ==================================================
  const renderGroup = (group) => {
    const Icon = SECTION_ICONS[group.title] || Info;
    return (
      <div className="mouf-section" key={group.title}>
        <div className="mouf-section-header">
          <Icon size={16} />
          <span>{group.title}</span>
        </div>
        <div className="mouf-grid">
          {group.fields.map((f) => renderField(f))}
        </div>
      </div>
    );
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <>
      <style>{FormCSS}</style>
      <div
        className="mouf-overlay"
        onClick={() => !saving && onClose()}
      >
        <div
          className="mouf-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============ Header ============ */}
          <div className="mouf-header">
            <div className="mouf-header-left">
              <h3 className="mouf-title">
                {isEdit ? '✏️ MoU এডিট করুন' : '➕ নতুন MoU ক্লায়েন্ট'}
              </h3>
              <p className="mouf-sub">
                {isEdit
                  ? `ক্লায়েন্ট: ${initial?.org2_name || 'Untitled'}`
                  : 'নতুন ক্লায়েন্টের তথ্য পূরণ করুন'}
              </p>
            </div>
            <button
              className="mouf-close"
              onClick={() => !saving && onClose()}
              disabled={saving}
              title="বন্ধ করুন"
            >
              <X size={22} />
            </button>
          </div>

          {/* ============ Body ============ */}
          <form
            className="mouf-body"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Banner */}
            {banner && (
              <div className={`mouf-banner ${banner.type}`}>
                <AlertCircle size={16} />
                <span>{banner.text}</span>
              </div>
            )}

            {/* Info note */}
            <div className="mouf-info">
              <Info size={16} />
              <span>
                <b>আল-আফিয়া হাসপাতাল</b> (Service Provider) সবসময় fixed
                থাকবে। শুধু ক্লায়েন্ট প্রতিষ্ঠানের তথ্য পূরণ করুন।
                Description-এ <code>**bold**</code> দিয়ে bold করা যাবে।
              </span>
            </div>

            {/* Groups */}
            {MOU_FORM_GROUPS.map((g) => renderGroup(g))}
          </form>

          {/* ============ Footer ============ */}
          <div className="mouf-footer">
            {!isEdit && (
              <button
                type="button"
                className="mouf-btn mouf-btn-secondary"
                onClick={handleReset}
                disabled={saving}
              >
                🔄 Reset
              </button>
            )}
            <button
              type="button"
              className="mouf-btn mouf-btn-secondary"
              onClick={() => !saving && onClose()}
              disabled={saving}
            >
              বাতিল
            </button>
            <button
              type="button"
              className="mouf-btn mouf-btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}