// src/components/MOUGenerator.jsx
// ==================================================
// 📄 MOU Generator — Main Component
// ==================================================
// ✅ Login বাধ্যতামূলক (guests redirect to /login)
// ✅ Firestore real-time sync (hospitals/{id}/mous)
// ✅ Empty state with "New MOU" button
// ✅ Save / Duplicate / Delete / Reset
// ✅ Live A4 preview with auto-scaling
// ✅ Print + PDF download
// ✅ Auto-fill org1 fields from existing MOU
// ✅ Dynamic logo watermark from Firebase Storage
// ==================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Save,
  Copy,
  Trash2,
  RotateCcw,
  Printer,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';

// ✅ Correct relative paths (up one level from components/)
import { useHospital } from '../context/HospitalContext';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToMous,
  createMou,
  updateMou,
  deleteMou,
  duplicateMou,
} from '../services/mouService';
import { subscribeToLogo } from '../services/logoService';
import { MOU_DEFAULTS, makeBlankMou } from '../utils/mouFields';

// ✅ Subfolders of components/ use ./ (not ../)
import MouForm, { validateAllMouFields } from './mou/MouForm';
import MouTemplate, { MOU_PRINT_CSS } from './mou/MouTemplate';
import LogoUploader from './mou/LogoUploader';
import { AppShellSkeleton } from './ui/SkeletonScreens';

// ==================================================
// ✅ Main Component
// ==================================================
export default function MOUGenerator() {
  const navigate = useNavigate();
  const { currentHospital } = useHospital();
  const { user, loading: authLoading } = useAuth();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  // ==================================================
  // ✅ State
  // ==================================================
  const [mous, setMous] = useState([]);
  const [activeMouId, setActiveMouId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info',
  });

  const previewWrapRef = useRef(null);
  const pagesRef = useRef(null);

  // ==================================================
  // ✅ Toast helper
  // ==================================================
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: '', type: 'info' }),
      2600
    );
  };

  // ==================================================
  // ✅ Redirect guests to /login
  // ==================================================
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ==================================================
  // ✅ Subscribe to MOU list (real-time)
  // ==================================================
  useEffect(() => {
    if (!user || !hospitalId) return;

    setLoading(true);
    const unsub = subscribeToMous(
      hospitalId,
      (list) => {
        setMous(list);
        setLoading(false);

        // Auto-select first MOU if none selected
        setActiveMouId((prev) => {
          if (prev && list.some((m) => m.id === prev)) return prev;
          return list.length > 0 ? list[0].id : null;
        });
      },
      (err) => {
        console.error('MOU subscription error:', err);
        showToast('MOU লোড করতে সমস্যা হয়েছে', 'error');
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hospitalId]);

  // ==================================================
  // ✅ Subscribe to logo (real-time)
  // ==================================================
  useEffect(() => {
    if (!user || !hospitalId) return;

    const unsub = subscribeToLogo(
      hospitalId,
      (meta) => {
        setLogoUrl(meta?.url || null);
      },
      (err) => {
        console.warn('Logo subscription error:', err);
        setLogoUrl(null);
      }
    );

    return () => unsub();
  }, [user, hospitalId]);

  // ==================================================
  // ✅ Load draft when active MOU changes
  // ==================================================
  useEffect(() => {
    if (!activeMouId) {
      setDraft(null);
      setIsDirty(false);
      setErrors({});
      return;
    }

    const active = mous.find((m) => m.id === activeMouId);
    if (active) {
      // Strip Firestore metadata
      const {
        id,
        createdAt,
        updatedAt,
        createdBy,
        createdByName,
        updatedBy,
        updatedByName,
        title,
        hospitalId: hid,
        ...dataFields
      } = active;

      // Merge with defaults
      setDraft({
        ...makeBlankMou(),
        ...dataFields,
      });
      setIsDirty(false);
      setErrors({});
    }
  }, [activeMouId, mous]);

  // ==================================================
  // ✅ Preview auto-scaling
  // ==================================================
  useEffect(() => {
    if (!previewWrapRef.current || !pagesRef.current) return;

    const fit = () => {
      const wrap = previewWrapRef.current;
      const pages = pagesRef.current;
      if (!wrap || !pages) return;

      const availableWidth = wrap.clientWidth;
      // A4 width in px at 96 DPI: 595.32pt * 96/72 = 793.76px
      const a4WidthPx = (595.32 * 96) / 72;
      const scale = Math.min(1, availableWidth / a4WidthPx);

      pages.style.transform = scale < 1 ? `scale(${scale})` : '';
      pages.style.transformOrigin = 'top left';
      wrap.style.height =
        scale < 1 ? `${pages.offsetHeight * scale}px` : 'auto';
    };

    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);

    // Re-fit after render
    const t = setTimeout(fit, 50);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, [draft, mous.length, logoUrl]);

  // ==================================================
  // ✅ Print preview reset
  // ==================================================
  useEffect(() => {
    const beforePrint = () => {
      if (pagesRef.current) pagesRef.current.style.transform = '';
    };
    const afterPrint = () => {
      window.dispatchEvent(new Event('resize'));
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // ==================================================
  // ✅ Field change handler
  // ==================================================
  const handleFieldChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);

    // Clear error for this field as user types
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ==================================================
  // ✅ Save current draft
  // ==================================================
  const handleSave = async () => {
    if (!draft || !activeMouId) return;

    const { errors: validationErrors, firstErrorKey, isValid } =
      validateAllMouFields(draft);

    if (!isValid) {
      setErrors(validationErrors);
      showToast('অনুগ্রহ করে লাল চিহ্নিত field ঠিক করুন', 'error');

      if (firstErrorKey) {
        const el = document.getElementById(`mou_${firstErrorKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await updateMou(hospitalId, activeMouId, draft, user);
      setIsDirty(false);
      showToast('✅ MOU সংরক্ষণ করা হয়েছে', 'success');
    } catch (err) {
      console.error('Save error:', err);
      showToast('সংরক্ষণ ব্যর্থ: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // ✅ New MOU
  // ==================================================
  const handleNew = async () => {
    if (isDirty && !window.confirm('অসংরক্ষিত পরিবর্তন মুছে ফেলবেন?')) {
      return;
    }
    try {
      const template =
        mous.length > 0
          ? {
              ...makeBlankMou(),
              // Copy org1 fields from most recent MOU
              org1_name: mous[0].org1_name || MOU_DEFAULTS.org1_name,
              org1_short_name:
                mous[0].org1_short_name || MOU_DEFAULTS.org1_short_name,
              org1_address: mous[0].org1_address || MOU_DEFAULTS.org1_address,
              org1_description:
                mous[0].org1_description || MOU_DEFAULTS.org1_description,
              org1_contact_name:
                mous[0].org1_contact_name || MOU_DEFAULTS.org1_contact_name,
              org1_contact_designation:
                mous[0].org1_contact_designation ||
                MOU_DEFAULTS.org1_contact_designation,
              org1_contact_phone:
                mous[0].org1_contact_phone || MOU_DEFAULTS.org1_contact_phone,
              org1_contact_email:
                mous[0].org1_contact_email || MOU_DEFAULTS.org1_contact_email,
              org1_signatory_name:
                mous[0].org1_signatory_name ||
                MOU_DEFAULTS.org1_signatory_name,
              org1_signatory_designation:
                mous[0].org1_signatory_designation ||
                MOU_DEFAULTS.org1_signatory_designation,
              org1_witness_name:
                mous[0].org1_witness_name || MOU_DEFAULTS.org1_witness_name,
              org1_witness_designation:
                mous[0].org1_witness_designation ||
                MOU_DEFAULTS.org1_witness_designation,
            }
          : makeBlankMou();

      const created = await createMou(hospitalId, template, user);
      setActiveMouId(created.id);
      showToast('✅ নতুন MOU তৈরি হয়েছে', 'success');
    } catch (err) {
      console.error('Create error:', err);
      showToast('তৈরি করতে সমস্যা: ' + err.message, 'error');
    }
  };

  // ==================================================
  // ✅ Duplicate
  // ==================================================
  const handleDuplicate = async () => {
    if (!activeMouId) return;
    try {
      const created = await duplicateMou(hospitalId, activeMouId, user);
      setActiveMouId(created.id);
      showToast('✅ MOU কপি করা হয়েছে', 'success');
    } catch (err) {
      console.error('Duplicate error:', err);
      showToast('কপি করতে সমস্যা: ' + err.message, 'error');
    }
  };

  // ==================================================
  // ✅ Delete
  // ==================================================
  const handleDelete = async () => {
    if (!activeMouId) return;
    if (!window.confirm('এই MOU স্থায়ীভাবে মুছে ফেলবেন?')) return;

    try {
      await deleteMou(hospitalId, activeMouId);
      showToast('✅ MOU মুছে ফেলা হয়েছে', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('মুছতে সমস্যা: ' + err.message, 'error');
    }
  };

  // ==================================================
  // ✅ Reset (discard changes)
  // ==================================================
  const handleReset = () => {
    if (!isDirty) return;
    if (!window.confirm('অসংরক্ষিত পরিবর্তন বাতিল করবেন?')) return;

    const active = mous.find((m) => m.id === activeMouId);
    if (!active) return;

    const {
      id,
      createdAt,
      updatedAt,
      createdBy,
      createdByName,
      updatedBy,
      updatedByName,
      title,
      hospitalId: hid,
      ...dataFields
    } = active;

    setDraft({ ...makeBlankMou(), ...dataFields });
    setIsDirty(false);
    setErrors({});
    showToast('🔄 পরিবর্তন বাতিল করা হয়েছে', 'info');
  };

  // ==================================================
  // ✅ Print
  // ==================================================
  const handlePrint = () => {
    if (!draft) return;
    const { isValid } = validateAllMouFields(draft);
    if (!isValid) {
      showToast('প্রিন্ট করার আগে সব field পূরণ করুন', 'error');
      return;
    }
    window.print();
  };

  // ==================================================
  // ✅ Download PDF
  // ==================================================
  const handleDownloadPDF = () => {
    if (!draft) return;
    const { isValid } = validateAllMouFields(draft);
    if (!isValid) {
      showToast('PDF ডাউনলোডের আগে সব field পূরণ করুন', 'error');
      return;
    }
    showToast('💡 Print dialog-এ "Save as PDF" নির্বাচন করুন', 'info');
    setTimeout(() => window.print(), 700);
  };

  // ==================================================
  // ✅ Active MOU
  // ==================================================
  const activeMou = useMemo(
    () => mous.find((m) => m.id === activeMouId),
    [mous, activeMouId]
  );

  // ==================================================
  // ✅ Loading state (auth)
  // ==================================================
  if (authLoading) {
    return (
      <>
        <style>{MOU_PRINT_CSS}</style>
        <AppShellSkeleton />
      </>
    );
  }

  // ==================================================
  // ✅ Guest check
  // ==================================================
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6fa',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '40px 32px',
            borderRadius: '16px',
            border: '1px solid #d9dde5',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <AlertCircle
            size={48}
            color="#b42318"
            style={{ marginBottom: '16px' }}
          />
          <h2
            style={{
              margin: '0 0 8px',
              color: '#1d2330',
              fontSize: '20px',
            }}
          >
            লগইন প্রয়োজন
          </h2>
          <p
            style={{
              color: '#667085',
              margin: '0 0 20px',
              fontSize: '14px',
            }}
          >
            MOU জেনারেটর ব্যবহার করতে আপনাকে লগইন করতে হবে।
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 24px',
              background: '#1c5fa8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            লগইন করুন
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // ✅ Initial loading
  // ==================================================
  if (loading) {
    return (
      <>
        <style>{MOU_PRINT_CSS}</style>
        <AppShellSkeleton />
      </>
    );
  }

  // ==================================================
  // ✅ RENDER
  // ==================================================
  return (
    <div
      className="mou-generator"
      style={{
        minHeight: '100vh',
        background: '#e9ebef',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        color: '#1d2330',
      }}
    >
      <style>{MOU_PRINT_CSS}</style>

      {/* Print CSS overrides */}
      <style>{`
        @media print {
          .mou-generator-topbar,
          .mou-generator-form-panel,
          .mou-generator-toast { display: none !important; }
          .mou-generator { background: #fff !important; }
          .mou-generator-preview-panel { padding: 0 !important; }
          .mou-generator-preview-wrap { height: auto !important; overflow: visible !important; }
        }
      `}</style>

      {/* ============ Top Bar ============ */}
      <div
        className="mou-generator-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#ffffff',
          borderBottom: '1px solid #d9dde5',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#475569',
          }}
        >
          <ChevronLeft size={14} /> ফিরে যান
        </button>

        <select
          value={activeMouId || ''}
          onChange={(e) => {
            if (
              isDirty &&
              !window.confirm('অসংরক্ষিত পরিবর্তন মুছে ফেলবেন?')
            )
              return;
            setActiveMouId(e.target.value);
          }}
          style={{
            minWidth: '240px',
            maxWidth: '100%',
            padding: '6px 10px',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            background: '#ffffff',
            fontSize: '13.5px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          {mous.length === 0 ? (
            <option value="">— কোনো MOU নেই —</option>
          ) : (
            mous.map((m, i) => (
              <option key={m.id} value={m.id}>
                #{i + 1} · {m.title || 'Untitled MOU'}
              </option>
            ))
          )}
        </select>

        {isDirty && (
          <span
            style={{
              color: '#b42318',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            ● অসংরক্ষিত
          </span>
        )}

        <span style={{ flex: 1 }} />

        <button
          onClick={handleNew}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#1d2330',
          }}
        >
          <Plus size={14} /> নতুন
        </button>

        <button
          onClick={handleSave}
          disabled={!draft || saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 14px',
            background: saving || !draft ? '#94a3b8' : '#1f5f8b',
            border: 'none',
            borderRadius: '6px',
            cursor: saving || !draft ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#ffffff',
            fontWeight: '600',
          }}
        >
          {saving ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <Save size={14} />
          )}
          {saving ? 'সংরক্ষণ...' : 'Save'}
        </button>

        <button
          onClick={handleDuplicate}
          disabled={!activeMouId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            cursor: !activeMouId ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#1d2330',
            opacity: !activeMouId ? 0.5 : 1,
          }}
        >
          <Copy size={14} /> কপি
        </button>

        <button
          onClick={handleReset}
          disabled={!isDirty}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            cursor: !isDirty ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#1d2330',
            opacity: !isDirty ? 0.5 : 1,
          }}
        >
          <RotateCcw size={14} /> রিসেট
        </button>

        <button
          onClick={handleDelete}
          disabled={!activeMouId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            cursor: !activeMouId ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#b42318',
            opacity: !activeMouId ? 0.5 : 1,
          }}
        >
          <Trash2 size={14} /> মুছুন
        </button>

        <button
          onClick={handlePrint}
          disabled={!draft}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#ffffff',
            border: '1px solid #d9dde5',
            borderRadius: '6px',
            cursor: !draft ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#1d2330',
            opacity: !draft ? 0.5 : 1,
          }}
        >
          <Printer size={14} /> প্রিন্ট
        </button>

        {/* ✅ Logo uploader */}
        <LogoUploader
          hospitalId={hospitalId}
          logoUrl={logoUrl}
          user={user}
          onChange={setLogoUrl}
        />

        <button
          onClick={handleDownloadPDF}
          disabled={!draft}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: '#1f5f8b',
            border: 'none',
            borderRadius: '6px',
            cursor: !draft ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            color: '#ffffff',
            fontWeight: '600',
            opacity: !draft ? 0.5 : 1,
          }}
        >
          <Download size={14} /> PDF
        </button>
      </div>

      {/* ============ Main Layout ============ */}
      {mous.length === 0 ? (
        // EMPTY STATE
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1f5f8b, #4fa3d1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 24px rgba(31,95,139,0.3)',
            }}
          >
            <FileText size={48} color="#fff" />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              color: '#1d2330',
              fontSize: '22px',
              fontWeight: '700',
            }}
          >
            কোনো MOU ডকুমেন্ট নেই
          </h2>
          <p
            style={{
              margin: '0 0 24px',
              color: '#667085',
              fontSize: '14px',
              maxWidth: '400px',
              lineHeight: 1.6,
            }}
          >
            একটি নতুন সমঝোতা স্মারক (Memorandum of Understanding) তৈরি করুন।
            হাসপাতালের তথ্য স্বয়ংক্রিয়ভাবে পূরণ হবে।
          </p>
          <button
            onClick={handleNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              background: '#1f5f8b',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(31,95,139,0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={18} /> নতুন MOU তৈরি করুন
          </button>
        </div>
      ) : (
        // FORM + PREVIEW
        <div
          className="mou-generator-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 380px) minmax(0, 1fr)',
            gap: '16px',
            padding: '16px',
            alignItems: 'start',
          }}
        >
          {/* LEFT: Form Panel */}
          <div
            className="mou-generator-form-panel"
            style={{
              position: 'sticky',
              top: '70px',
              maxHeight: 'calc(100vh - 90px)',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {draft ? (
              <MouForm
                data={draft}
                errors={errors}
                onChange={handleFieldChange}
              />
            ) : (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #d9dde5',
                  borderRadius: '10px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#667085',
                }}
              >
                <Loader2 size={24} className="spin" />
                <p style={{ marginTop: '12px', fontSize: '14px' }}>
                  লোড হচ্ছে...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview */}
          <div
            className="mou-generator-preview-panel"
            style={{
              minWidth: 0,
              padding: '4px',
            }}
          >
            <div
              ref={previewWrapRef}
              className="mou-generator-preview-wrap"
              style={{
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {draft && (
                <MouTemplate
                  data={draft}
                  pagesRef={pagesRef}
                  logoUrl={logoUrl}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ Toast ============ */}
      {toast.show && (
        <div
          className="mou-generator-toast"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '30px',
            transform: 'translateX(-50%)',
            background:
              toast.type === 'error'
                ? '#b42318'
                : toast.type === 'success'
                ? '#166534'
                : '#1d2330',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'mouToastIn 0.3s ease',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        @keyframes mouToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 900px) {
          .mou-generator-layout {
            grid-template-columns: 1fr !important;
            padding: 10px !important;
          }
          .mou-generator-form-panel {
            position: static !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}