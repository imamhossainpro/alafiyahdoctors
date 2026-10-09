// src/components/admin/MouSettings.jsx
// ==================================================
// 📝 MOU Settings — Admin panel
// ==================================================
// ✅ Edit beneficiary label, org name, intro text etc.
// ✅ Live preview
// ✅ Discount table + facilities + terms editor
// ==================================================

import React, { useEffect, useState } from 'react';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import {
  getMouContent,
  updateMouContent,
  DEFAULT_MOU_CONTENT,
} from '../../services/mouService';

// ==================================================
// ✅ Inline Styles
// ==================================================
const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 14,
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function MouSettings() {
  const { currentHospital } = useHospital();
  const { user } = useAuth();
  const { can } = usePermission();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [form, setForm] = useState({
    hospitalName: '',
    introText: '',
    beneficiaryLabel: '',
    organizationName: '',
    memberText: '',
    discountTable: [],
    facilities: [],
    terms: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const canEdit =
    user?.role === 'admin' || user?.role === 'sub-admin' || can('settings.edit');

  // ==================================================
  // ✅ Load data
  // ==================================================
  useEffect(() => {
    getMouContent(hospitalId).then((data) => {
      setForm({
        hospitalName: data.hospitalName || '',
        introText: data.introText || '',
        beneficiaryLabel: data.beneficiaryLabel || '',
        organizationName: data.organizationName || '',
        memberText: data.memberText || '',
        discountTable: Array.isArray(data.discountTable)
          ? data.discountTable
          : [],
        facilities: Array.isArray(data.facilities) ? data.facilities : [],
        terms: Array.isArray(data.terms) ? data.terms : [],
      });
      setLoading(false);
    });
  }, [hospitalId]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ==================================================
  // ✅ Save
  // ==================================================
  const handleSave = async () => {
    if (!canEdit) {
      setMessage('❌ আপনার edit permission নেই');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await updateMouContent(hospitalId, form, user);
      setMessage('✅ সফলভাবে সংরক্ষণ হয়েছে');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ সংরক্ষণ ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // ✅ Reset to default
  // ==================================================
  const handleReset = () => {
    if (!window.confirm('Default value-তে reset করতে চান?')) return;
    setForm({
      hospitalName: DEFAULT_MOU_CONTENT.hospitalName,
      introText: DEFAULT_MOU_CONTENT.introText,
      beneficiaryLabel: DEFAULT_MOU_CONTENT.beneficiaryLabel,
      organizationName: DEFAULT_MOU_CONTENT.organizationName,
      memberText: DEFAULT_MOU_CONTENT.memberText,
      discountTable: [],
      facilities: [],
      terms: [],
    });
    setMessage('✅ Default value-তে reset হয়েছে (Save করুন)');
  };

  // ==================================================
  // ✅ Discount table handlers
  // ==================================================
  const addDiscountRow = () =>
    setForm((prev) => ({
      ...prev,
      discountTable: [
        ...prev.discountTable,
        { service: '', regular: '', discount: '' },
      ],
    }));

  const removeDiscountRow = (idx) =>
    setForm((prev) => ({
      ...prev,
      discountTable: prev.discountTable.filter((_, i) => i !== idx),
    }));

  const updateDiscountRow = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      discountTable: prev.discountTable.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      ),
    }));

  // ==================================================
  // ✅ Facilities handlers
  // ==================================================
  const addFacility = () =>
    setForm((prev) => ({ ...prev, facilities: [...prev.facilities, ''] }));

  const removeFacility = (idx) =>
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== idx),
    }));

  const updateFacility = (idx, value) =>
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.map((f, i) => (i === idx ? value : f)),
    }));

  // ==================================================
  // ✅ Terms handlers
  // ==================================================
  const addTerm = () =>
    setForm((prev) => ({ ...prev, terms: [...prev.terms, ''] }));

  const removeTerm = (idx) =>
    setForm((prev) => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== idx),
    }));

  const updateTerm = (idx, value) =>
    setForm((prev) => ({
      ...prev,
      terms: prev.terms.map((t, i) => (i === idx ? value : t)),
    }));

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        লোড হচ্ছে...
      </div>
    );
  }

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div
      style={{
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#1e293b',
            }}
          >
            📝 MOU Content Settings
          </h3>
          <p
            style={{
              color: '#64748b',
              fontSize: 13,
              margin: '6px 0 0 0',
            }}
          >
            এখানে পরিবর্তন করলে{' '}
            <code
              style={{
                background: '#f1f5f9',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              /mou
            </code>{' '}
            পেজে সাথে সাথে আপডেট হবে।
          </p>
        </div>
        {!canEdit && (
          <span
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            🔒 Read-only
          </span>
        )}
      </div>

      {/* ============ Basic Fields ============ */}
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={labelStyle}>Hospital Name</label>
          <input
            name="hospitalName"
            value={form.hospitalName}
            onChange={handleChange}
            disabled={!canEdit}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Intro Text</label>
          <input
            name="introText"
            value={form.introText}
            onChange={handleChange}
            disabled={!canEdit}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            🎯 Beneficiary Label{' '}
            <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            name="beneficiaryLabel"
            value={form.beneficiaryLabel}
            onChange={handleChange}
            disabled={!canEdit}
            placeholder="যেমন: Employees & Students / Teachers / Staff Members"
            style={{
              ...inputStyle,
              borderColor: '#0d9488',
              fontWeight: 700,
              color: '#0d9488',
            }}
          />
          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '4px 0 0 0',
            }}
          >
            এই অংশটাই বোল্ড হয়ে MOU পেজে দেখাবে।
          </p>
        </div>

        <div>
          <label style={labelStyle}>Organization Name</label>
          <input
            name="organizationName"
            value={form.organizationName}
            onChange={handleChange}
            disabled={!canEdit}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Member Text</label>
          <input
            name="memberText"
            value={form.memberText}
            onChange={handleChange}
            disabled={!canEdit}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ============ Live Preview ============ */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: '#f8fafc',
          borderRadius: 10,
          border: '1px dashed #cbd5e1',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748b',
            marginBottom: 8,
          }}
        >
          👁️ Live Preview
        </div>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: '#1e293b',
            margin: 0,
          }}
        >
          <strong style={{ color: '#1c5fa8' }}>{form.hospitalName}</strong>{' '}
          {form.introText}{' '}
          <span
            style={{
              background: 'linear-gradient(120deg, #ccfbf1, #a7f3d0)',
              color: '#0d9488',
              padding: '2px 8px',
              borderRadius: 6,
              fontWeight: 800,
            }}
          >
            {form.beneficiaryLabel || '(beneficiary)'}
          </span>{' '}
          of{' '}
          <strong style={{ color: '#7c3aed' }}>
            {form.organizationName}
          </strong>{' '}
          {form.memberText}.
        </p>
      </div>

      {/* ============ Discount Table Editor ============ */}
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h4 style={{ margin: 0, color: '#1e293b' }}>
            💰 Discount Table ({form.discountTable.length})
          </h4>
          {canEdit && (
            <button
              onClick={addDiscountRow}
              style={btnSecondary}
              type="button"
            >
              <Plus size={14} /> Add Row
            </button>
          )}
        </div>

        {form.discountTable.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            কোনো discount row নেই। উপরের "Add Row" বাটনে ক্লিক করুন।
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {form.discountTable.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  placeholder="Service"
                  value={row.service || ''}
                  onChange={(e) =>
                    updateDiscountRow(idx, 'service', e.target.value)
                  }
                  disabled={!canEdit}
                  style={inputStyle}
                />
                <input
                  placeholder="Regular"
                  value={row.regular || ''}
                  onChange={(e) =>
                    updateDiscountRow(idx, 'regular', e.target.value)
                  }
                  disabled={!canEdit}
                  style={inputStyle}
                />
                <input
                  placeholder="Discount"
                  value={row.discount || ''}
                  onChange={(e) =>
                    updateDiscountRow(idx, 'discount', e.target.value)
                  }
                  disabled={!canEdit}
                  style={inputStyle}
                />
                {canEdit && (
                  <button
                    onClick={() => removeDiscountRow(idx)}
                    style={btnDangerIcon}
                    title="Remove"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ Facilities Editor ============ */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h4 style={{ margin: 0, color: '#1e293b' }}>
            🏥 Facilities ({form.facilities.length})
          </h4>
          {canEdit && (
            <button onClick={addFacility} style={btnSecondary} type="button">
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {form.facilities.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            কোনো facility নেই।
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {form.facilities.map((fac, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  value={fac}
                  onChange={(e) => updateFacility(idx, e.target.value)}
                  disabled={!canEdit}
                  placeholder="যেমন: Free OPD consultation"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {canEdit && (
                  <button
                    onClick={() => removeFacility(idx)}
                    style={btnDangerIcon}
                    title="Remove"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ Terms Editor ============ */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h4 style={{ margin: 0, color: '#1e293b' }}>
            📋 Terms & Conditions ({form.terms.length})
          </h4>
          {canEdit && (
            <button onClick={addTerm} style={btnSecondary} type="button">
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {form.terms.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: '#94a3b8',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            কোনো term নেই।
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {form.terms.map((term, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  value={term}
                  onChange={(e) => updateTerm(idx, e.target.value)}
                  disabled={!canEdit}
                  placeholder="যেমন: Valid ID card must be shown"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {canEdit && (
                  <button
                    onClick={() => removeTerm(idx)}
                    style={btnDangerIcon}
                    title="Remove"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ Action Buttons ============ */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving || !canEdit}
          style={{
            padding: '10px 24px',
            background: saving || !canEdit ? '#94a3b8' : '#1c5fa8',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: saving || !canEdit ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
          }}
        >
          {saving ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </button>

        {canEdit && (
          <button
            onClick={handleReset}
            type="button"
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13.5,
            }}
          >
            <RotateCcw size={14} /> Reset to Default
          </button>
        )}

        {message && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: message.includes('✅') ? '#16a34a' : '#dc2626',
            }}
          >
            {message}
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ==================================================
// ✅ Button styles
// ==================================================
const btnSecondary = {
  padding: '7px 14px',
  background: '#f1f5f9',
  color: '#334155',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12.5,
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
};

const btnDangerIcon = {
  padding: '8px 10px',
  background: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};