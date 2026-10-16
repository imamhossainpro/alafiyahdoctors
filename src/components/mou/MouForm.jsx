// src/components/admin/MoUForm.jsx
// ==================================================
// 📝 MoU Form — Create/Edit with LIVE PREVIEW
// ==================================================
// ✅ Left: Form fields
// ✅ Right: Live A4 preview (updates as you type)
// ✅ Save + Cancel + Reset
// ==================================================
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  blankClient,
  MOU_FORM_GROUPS,
  formatDateLong,
} from '../../utils/mouDefaults';
import { useHospital } from '../../context/HospitalContext';
import { subscribeToLogo } from '../../services/logoService';

// ==================================================
// ✅ CSS
// ==================================================
const FormCSS = `
.mouf-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.75);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.mouf-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 1400px;
  max-height: 96vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
}

/* Header */
.mouf-header {
  padding: 16px 24px;
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
.mouf-header-actions {
  display: flex; gap: 8px; align-items: center;
}
.mouf-icon-btn {
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
  font-family: inherit;
}
.mouf-icon-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.mouf-icon-btn.active {
  background: #1c5fa8;
  color: #fff;
  border-color: #1c5fa8;
}
.mouf-close {
  background: transparent; border: none;
  color: #64748b; cursor: pointer;
  padding: 6px; border-radius: 8px;
  display: flex; align-items: center;
}
.mouf-close:hover { background: #e2e8f0; color: #1e293b; }

/* Body — Split layout */
.mouf-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.mouf-body.single {
  display: block;
  overflow-y: auto;
  padding: 22px 24px;
}

/* Left: Form */
.mouf-form-col {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  border-right: 1px solid #e2e8f0;
  min-width: 0;
}

/* Right: Preview */
.mouf-preview-col {
  width: 50%;
  background: #dde1e7;
  overflow: auto;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
}
@media (max-width: 1024px) {
  .mouf-preview-col { display: none; }
  .mouf-body { display: block; }
  .mouf-form-col { border-right: none; }
}

/* Section */
.mouf-section {
  margin-bottom: 24px;
}
.mouf-section-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 800; color: #1c5fa8;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #e2e8f0;
}
.mouf-section-header svg { flex-shrink: 0; }

/* Grid */
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

/* Banner */
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

/* Preview A4 */
.mouf-preview-wrap {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transform-origin: top center;
}
.mouf-preview-page {
  position: relative;
  width: 595.32pt;
  min-height: 841.92pt;
  box-sizing: border-box;
  padding: 36.5pt 36pt 0;
  background: #fff;
  color: #000;
  font: 14pt/18.5pt "Times New Roman", "Liberation Serif", Times, serif;
  text-align: justify;
  overflow: hidden;
  margin-bottom: 14px;
}
.mouf-preview-watermark {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 380pt; height: 380pt;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
}
.mouf-preview-content {
  position: relative;
  z-index: 1;
}
.mouf-preview-page p { margin: 0; }
.mouf-preview-page .mou-title p {
  font-size: 25pt; line-height: 33pt; text-align: center;
}
.mouf-preview-page .mou-title { margin: -1.7pt 0 30.9pt; }
.mouf-preview-page .mou-c { text-align: center; }
.mouf-preview-page .mou-bi { font-weight: 700; font-style: italic; }
.mouf-preview-page .mou-it { position: relative; padding-left: 13.6pt; }
.mouf-preview-page .mou-it .mou-no { position: absolute; left: -4.6pt; font-weight: 700; }
.mouf-preview-page ul { list-style: none; margin: 0; padding: 0; text-align: left; }
.mouf-preview-page li { position: relative; padding-left: var(--t, 36pt); }
.mouf-preview-page li:before {
  content: "\\2022";
  position: absolute;
  left: calc(var(--t, 36pt) - 18pt);
}
.mouf-preview-page .mou-ct {
  width: 468pt;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12pt;
  line-height: 13.8pt;
}
.mouf-preview-page .mou-ct td,
.mouf-preview-page .mou-ct th {
  border: 0.75pt solid #000;
  padding: 1.5pt 4.9pt 0;
  vertical-align: top;
  text-align: left;
  font-weight: 400;
  overflow-wrap: anywhere;
}
.mouf-preview-page .mou-ct th {
  height: 39pt;
  font-weight: 700;
  text-decoration: underline;
}
.mouf-preview-page .mou-sg {
  display: grid;
  font-size: 12pt;
  line-height: 13.8pt;
  text-align: left;
  white-space: nowrap;
}
.mouf-preview-page .mou-sg .mou-d { margin-bottom: 2.6pt; }
.mouf-preview-page .mou-v {
  background: rgba(31, 95, 139, 0.08);
  border-radius: 2px;
}
.mouf-preview-page .mou-v-miss {
  background: rgba(180, 35, 24, 0.15);
}
.mouf-preview-page .mou-foot {
  position: absolute;
  left: 35pt; right: 34pt; top: 778pt;
  border-top: 1pt solid #d9d9d9;
  padding: 1.5pt 0 0 1pt;
  font: 11pt Calibri, Carlito, "Segoe UI", sans-serif;
  line-height: 13pt;
  text-align: left;
  z-index: 2;
}
.mouf-preview-page .mou-foot .mou-foot-g {
  color: #7f7f7f; letter-spacing: 0.12em;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

// ==================================================
// ✅ Section icons
// ==================================================
const SECTION_ICONS = {
  '📅 Agreement Information': Calendar,
  '🕌 Client Institution (org2)': Building2,
  '💰 Discount Terms': Percent,
  '📜 Termination Terms': ScrollText,
  '📂 Meta': Info,
};

// ==================================================
// ✅ Validation
// ==================================================
const validateField = (field, value) => {
  const v = String(value ?? '').trim();
  const isRequired = field.req === true || field.required === true;

  if (isRequired && !v) return 'এই ঘরটি পূরণ করুন';
  if (!v) return '';

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'সঠিক ইমেইল দিন';
  if (field.type === 'tel' && !/^\+?[0-9][0-9\s\-()]{6,19}$/.test(v))
    return 'সঠিক ফোন নম্বর দিন';
  if (field.type === 'date' && isNaN(new Date(v).getTime()))
    return 'সঠিক তারিখ দিন';
  if (field.type === 'number') {
    const n = Number(v);
    if (isNaN(n) || n < 0) return 'সঠিক সংখ্যা দিন';
    if (field.min !== undefined && n < field.min) return `সর্বনিম্ন ${field.min}`;
    if (field.max !== undefined && n > field.max) return `সর্বোচ্চ ${field.max}`;
  }
  return '';
};

// ==================================================
// ✅ Template builder (inline, for live preview)
// ==================================================
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );

const buildGetter = (data) => (key) => {
  if (key === 'agreement_date_fmt') return formatDateLong(data.agreement_date);
  if (key.endsWith('_nodot')) {
    const base = key.slice(0, -6);
    return String(data[base] ?? '').replace(/\.$/, '');
  }
  return String(data[key] ?? '').trim();
};

const substitute = (html, get) =>
  html
    .replace(/@@(\w+)\|?([^@]*)@@/g, (m, key, prefix) => {
      const v = get(key);
      return v ? `${prefix}{{${key}}}<br>` : '';
    })
    .replace(/\{\{(\w+)\}\}/g, (m, key) => {
      const v = get(key);
      return v
        ? `<span class="mou-v">${esc(v)}</span>`
        : '<span class="mou-v mou-v-miss">________</span>';
    })
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

const B1 = '**{{org1_name}}**';
const B2 = '**{{org2_name}}**';

const PREVIEW_PAGES = [
  // Page 1
  `
  <div class="mou-title">
    <p>Memorandum of Understanding (MoU)</p>
    <p>of</p>
    <p>Medical Services Agreement</p>
  </div>
  <p>This Agreement is made between ${B2} &amp; ${B1} at {{agreement_place}}</p>
  <p class="mou-c mou-bi" style="margin-top:14pt">Between</p>
  <p>${B2} its registered address at {{org2_address}}.</p>
  <p class="mou-c mou-bi">And</p>
  <p>${B1} having its registered address at {{org1_address}}</p>
  <p style="margin-top:18.5pt">Whereas ${B2} {{org2_description}}</p>
  <p style="margin-top:10pt">And ${B1} {{org1_description}}</p>
  <p style="margin-top:10pt">For the purpose of the agreement, the following terms shall have the meanings set forth in their respective definition, unless a different meaning is called for in the context of another provision in the agreement -</p>
  <p>Now, therefore, parties hereto enter into this medical services Agreement on the following terms &amp; conditions:</p>
  <p style="margin-top:18.5pt">${B2} acknowledge ${B1} as a corporate medical services provider.</p>
  <div class="mou-it" style="margin-top:18.4pt"><span class="mou-no">1.</span>${B2} &amp; ${B1} will work together in the areas of its kinds for better cooperation and social development.</div>
  <div class="mou-it"><span class="mou-no">2.</span>${B1} may include ${B2} in its corporate client list.</div>
  `,
  // Page 2
  `
  <div class="mou-it" style="line-height:16.1pt"><span class="mou-no">3.</span>${B1} will provide following Special discount rates &amp; facilities for the Employees &amp; Students of ${B2} along with their member.</div>
  <ul style="margin:17.2pt -24pt 0 0;line-height:17.1pt">
    <li>{{discount_pathology}}% discount on all pathological investigation (Blood, Urine, Sputum etc).</li>
    <li>{{discount_radiology}}% discount on Radiology &amp; Imaging (X-ray, ECHO, ECG &amp; Ultrasonography etc),</li>
    <li>Rate mentioned excluding the price of contrast.</li>
    <li>{{discount_bed}}% discount will be given on Hospital bed rent &amp; Service charge for admitted patients.</li>
    <li>Discount will be applicable for Member.</li>
  </ul>
  <p style="margin-top:13pt;text-align:left">4. **Identification:**</p>
  <p style="margin:11.6pt 0 0 10.9pt;text-align:left">Either one of the documents listed below to be presented</p>
  <ul style="--t:72pt;margin-top:.5pt;line-height:19.6pt">
    <li>Organization I.D Card or</li>
    <li>Organization letter with authorized signature</li>
  </ul>
  <p style="margin-top:17.3pt;text-align:left">**5. Payment terms**:</p>
  <ul style="margin-top:1.1pt"><li>For both inpatient (IPD) and outpatient (OPD) services, the patient will self-pay by cash or card.</li></ul>
  <p style="margin-top:18.4pt;text-align:left">**6. Termination:**</p>
  <ul style="margin-top:1.1pt">
    <li>By either of the parties by giving a {{notice_days}} days written notice; or</li>
    <li style="margin-top:1.1pt">By mutual agreement of the parties: or</li>
    <li style="margin-top:1.1pt">By one of the parties, with immediate effect, if the other party is in material breach of the agreement and is not capable of remedying such breach within {{remedy_days}} days of receipt of a written notice to such effect: or</li>
    <li style="margin-top:1.1pt">By one of the parties, with immediate effect, if the other party becomes bankrupt or insolvent.</li>
  </ul>
  <p style="margin-top:13.9pt">**7. Changes to the Agreement:**</p>
  <p>Any amendments or additions to the agreement shall be valid only if made in writing and signed by duly authorized representatives of both the parties hereto.</p>
  <p style="margin-top:18.6pt">**8. Copies of this agreement:**</p>
  <p>This agreement is being executed in 2(two) identical originals, one to be retained by ${B1} Authority and other copy ${B2}.</p>
  `,
  // Page 3
  `
  <p style="margin-top:17.8pt;text-align:left">**9. Contact Person:**</p>
  <table class="mou-ct">
    <colgroup><col style="width:243pt"><col style="width:225pt"></colgroup>
    <tr>
      <th>Contact Person of {{org1_name_nodot}},</th>
      <th>Contact Person of {{org2_name}}</th>
    </tr>
    <tr>
      ${[1, 2]
        .map(
          (n) => `
      <td>
        **{{org${n}_contact_name}}**<br>
        @@org${n}_contact_designation@@{{org${n}_name}}<br>
        @@org${n}_contact_phone|Mobile: @@
        @@org${n}_contact_email|Email: @@
      </td>`
        )
        .join('')}
    </tr>
  </table>
  <p style="line-height:16.1pt">The parties knowingly signed this Medical Services Agreement in duplicate as of the date set forth below.</p>
  <p style="line-height:16.1pt;text-align:left">Date: {{agreement_date_fmt}}</p>

  <div class="mou-sg" style="grid-template-columns:253.5pt 1fr;font-size:11pt;line-height:13.5pt;margin:2pt 0 0 1.4pt">
    <span>For &amp; On Behalf of **{{org1_short_name}}**</span>
    <span>On behalf of **{{org2_short_name}}**</span>
  </div>

  <div class="mou-sg" style="grid-template-columns:288pt 1fr;margin-top:61.6pt">
    <span class="mou-d">${'…'.repeat(15)}</span>
    <span class="mou-d">.${'…'.repeat(13)}</span>
    <b>{{org1_signatory_name}}</b>
    <b style="font-size:11pt">{{org2_signatory_name}}</b>
    <span>@@org1_signatory_designation|@@</span>
    <span>@@org2_signatory_designation|@@</span>
    <span>{{org1_name}}</span>
    <span>{{org2_name}}</span>
  </div>

  <p class="mou-c" style="font-size:12pt;line-height:13.8pt;margin-top:49.5pt">In presence of</p>

  <div class="mou-sg" style="grid-template-columns:252pt 1fr;margin-top:65.6pt">
    <span class="mou-d">${'…'.repeat(15)}</span>
    <span class="mou-d">${'…'.repeat(13)}</span>
    <b>{{org1_witness_name}}</b>
    <b>{{org2_witness_name}}</b>
    <span>@@org1_witness_designation|@@</span>
    <span>@@org2_witness_designation|@@</span>
    <span>{{org1_name}}</span>
    <span>{{org2_name}}</span>
  </div>
  `,
];

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function MoUForm({
  initial = null,
  onSave,
  onClose,
  saving = false,
}) {
  const isEdit = !!initial;
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [data, setData] = useState(() => {
    if (isEdit && initial) return { ...blankClient(), ...initial };
    return blankClient();
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [banner, setBanner] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const previewRef = useRef(null);

  // ✅ Subscribe to logo
  useEffect(() => {
    if (!hospitalId) return;
    const unsub = subscribeToLogo(
      hospitalId,
      (meta) => setLogoUrl(meta?.url || null),
      (err) => console.warn('Logo subscribe error:', err)
    );
    return () => unsub();
  }, [hospitalId]);

  // ✅ Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // ✅ Auto-scale preview
  useEffect(() => {
    if (!showPreview) return;

    const recalc = () => {
      const el = previewRef.current;
      if (!el) return;
      const parentWidth = el.parentElement.clientWidth - 32;
      const pageWidthPx = (595.32 * 96) / 72;
      const s = Math.min(1, parentWidth / pageWidthPx);
      el.style.transform = s < 1 ? `scale(${s})` : 'none';
      el.style.transformOrigin = 'top center';
    };
    recalc();
    window.addEventListener('resize', recalc);
    const t = setTimeout(recalc, 100);
    return () => {
      window.removeEventListener('resize', recalc);
      clearTimeout(t);
    };
  }, [showPreview]);

  const fieldsByKey = useMemo(() => {
    const map = {};
    MOU_FORM_GROUPS.forEach((group) => {
      group.fields.forEach((f) => {
        map[f.key] = f;
      });
    });
    return map;
  }, []);

  const handleChange = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
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
      const el = document.getElementById('mouf-' + firstInvalid);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.focus?.(), 300);
      }
    }
    return firstInvalid;
  };

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

    try {
      await onSave({ ...data });
    } catch (err) {
      console.error('❌ MoUForm save error:', err);
      setBanner({
        type: 'error',
        text: err?.message || 'সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
      });
    }
  };

  const handleReset = () => {
    if (!window.confirm('সব ইনপুট মুছে নতুন করে লিখতে চান?')) return;
    setData(blankClient());
    setErrors({});
    setTouched({});
    setBanner({ type: 'success', text: 'ফর্ম রিসেট হয়েছে।' });
    setTimeout(() => setBanner(null), 2000);
  };

  // ✅ Live preview HTML
  const previewHTML = useMemo(() => {
    const get = buildGetter(data);
    return PREVIEW_PAGES.map((raw) => substitute(raw, get));
  }, [data]);

  // ✅ Render field
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
          {(field.req || field.required) && <span className="req">*</span>}
          {field.hint && <span className="hint">({field.hint})</span>}
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

            <div className="mouf-header-actions">
              {/* ✅ Preview toggle */}
              <button
                type="button"
                className={`mouf-icon-btn ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview((v) => !v)}
                title={showPreview ? 'প্রিভিউ লুকান' : 'প্রিভিউ দেখুন'}
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPreview ? 'প্রিভিউ লুকান' : 'প্রিভিউ'}
              </button>

              <button
                className="mouf-close"
                onClick={() => !saving && onClose()}
                disabled={saving}
                title="বন্ধ করুন"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* ============ Body (Split) ============ */}
          <div className={`mouf-body ${!showPreview ? 'single' : ''}`}>
            {/* Left: Form */}
            <form
              className="mouf-form-col"
              onSubmit={handleSubmit}
              noValidate
            >
              {banner && (
                <div className={`mouf-banner ${banner.type}`}>
                  <AlertCircle size={16} />
                  <span>{banner.text}</span>
                </div>
              )}

              <div className="mouf-info">
                <Info size={16} />
                <span>
                  <b>আল-আফিয়া হাসপাতাল</b> (Service Provider) সবসময় fixed
                  থাকবে। শুধু ক্লায়েন্ট প্রতিষ্ঠানের তথ্য পূরণ করুন।
                </span>
              </div>

              {MOU_FORM_GROUPS.map((g) => renderGroup(g))}
            </form>

            {/* Right: Live Preview */}
            {showPreview && (
              <div className="mouf-preview-col">
                <div ref={previewRef} className="mouf-preview-wrap">
                  {previewHTML.map((html, i) => (
                    <div
                      key={i}
                      className="mouf-preview-page"
                      style={{ position: 'relative' }}
                    >
                      {/* ✅ Watermark */}
                      {logoUrl && (
                        <div
                          className="mouf-preview-watermark"
                          aria-hidden="true"
                          style={{
                            backgroundImage: `url("${logoUrl}")`,
                          }}
                        />
                      )}
                      {/* ✅ Content */}
                      <div
                        className="mouf-preview-content"
                        dangerouslySetInnerHTML={{
                          __html:
                            html +
                            `<div class="mou-foot"><b>${i + 1}</b> <span class="mou-foot-g">| P a g e</span></div>`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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