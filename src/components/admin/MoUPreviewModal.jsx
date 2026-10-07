// src/components/admin/MoUPreviewModal.jsx
// ==================================================
// 📄 MoU Preview Modal — A4 layout + Print + PDF
// ==================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDateLong } from '../../utils/mouDefaults';
import {
  downloadMoUAsPDF,
  downloadMoUAsPNG,
  printMoU,
} from '../../utils/mouPdfExport';

// ==================================================
// ✅ Escaping + variable substitution
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

// ✅ Template syntax:
//   {{var}}       → required value (empty হলে ________)
//   @@var|prefix@@ → optional line (empty হলে পুরো line skip)
//   **bold**      → bold
const substitute = (html, get) =>
  html
    // optional line: @@key|prefix@@ → prefix + value + <br>
    .replace(/@@(\w+)\|?([^@]*)@@/g, (m, key, prefix) => {
      const v = get(key);
      return v ? `${prefix}{{${key}}}<br>` : '';
    })
    // required variable
    .replace(/\{\{(\w+)\}\}/g, (m, key) => {
      const v = get(key);
      return v
        ? `<span class="mou-v">${esc(v)}</span>`
        : '<span class="mou-v mou-v-miss">________</span>';
    })
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// ==================================================
// ✅ MoU Template Pages — আপনার HTML এর হুবহু কপি
// ==================================================
const B1 = '**{{org1_name}}**';
const B2 = '**{{org2_name}}**';

const PAGES = [
  // ---------- Page 1 ----------
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

  // ---------- Page 2 ----------
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

  // ---------- Page 3 ----------
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
// ✅ CSS (modal + A4 pages + print)
// ==================================================
const MoUCSS = `
/* ===== Modal shell ===== */
.mou-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.65);
  z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.mou-modal {
  background: #e9ebef;
  border-radius: 14px;
  width: 100%;
  max-width: 1100px;
  max-height: 96vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 70px rgba(0,0,0,0.35);
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
}

/* ===== Header ===== */
.mou-modal-header {
  background: #ffffff;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; flex-wrap: wrap;
}
.mou-modal-header-left {
  display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;
}
.mou-modal-title {
  margin: 0;
  font-size: 16px; font-weight: 800; color: #1e293b;
  display: flex; align-items: center; gap: 8px;
}
.mou-modal-sub {
  margin: 2px 0 0 0;
  font-size: 12.5px; color: #64748b;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mou-modal-actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.mou-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.mou-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.mou-btn-primary {
  background: #1c5fa8; color: #fff;
  box-shadow: 0 3px 10px rgba(28, 95, 168, 0.3);
}
.mou-btn-primary:hover:not(:disabled) {
  background: #154a82; transform: translateY(-1px);
}
.mou-btn-secondary {
  background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;
}
.mou-btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}
.mou-btn-danger {
  background: #fff; color: #dc2626;
  border: 1px solid #fecaca;
}
.mou-btn-danger:hover:not(:disabled) {
  background: #fee2e2;
}
.mou-btn-icon {
  padding: 8px; width: 34px; height: 34px;
  justify-content: center;
  background: transparent; color: #64748b;
}
.mou-btn-icon:hover { background: #f1f5f9; }

/* ===== Preview area ===== */
.mou-preview-body {
  flex: 1; overflow: auto;
  padding: 20px;
  background: #dde1e7;
  display: flex; justify-content: center;
}
.mou-pages-wrapper {
  transform-origin: top center;
}
.mou-pages {
  display: flex; flex-direction: column; gap: 14px;
  align-items: center;
}

/* ===== A4 Page (595.32 x 841.92 pt) ===== */
.mou-page {
  position: relative;
  width: 595.32pt;
  min-height: 841.92pt;
  box-sizing: border-box;
  padding: 36.5pt 36pt 0;
  background: #fff;
  color: #000;
  box-shadow: 0 2px 14px rgba(0,0,0,0.2);
  font: 14pt/18.5pt "Times New Roman", "Liberation Serif", Times, serif;
  text-align: justify;
}
.mou-page p { margin: 0; }
.mou-title p {
  font-size: 25pt; line-height: 33pt; text-align: center;
}
.mou-title { margin: -1.7pt 0 30.9pt; }
.mou-c { text-align: center; }
.mou-bi { font-weight: 700; font-style: italic; }

.mou-it { position: relative; padding-left: 13.6pt; }
.mou-it .mou-no { position: absolute; left: -4.6pt; font-weight: 700; }

.mou-page ul { list-style: none; margin: 0; padding: 0; text-align: left; }
.mou-page li { position: relative; padding-left: var(--t, 36pt); }
.mou-page li:before {
  content: "\\2022";
  position: absolute;
  left: calc(var(--t, 36pt) - 18pt);
}

/* ===== Footer ===== */
.mou-foot {
  position: absolute;
  left: 35pt; right: 34pt; top: 778pt;
  border-top: 1pt solid #d9d9d9;
  padding: 1.5pt 0 0 1pt;
  font: 11pt Calibri, Carlito, "Segoe UI", sans-serif;
  line-height: 13pt;
  text-align: left;
}
.mou-foot .mou-foot-g {
  color: #7f7f7f; letter-spacing: 0.12em;
}

/* ===== Contact table ===== */
.mou-ct {
  width: 468pt;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12pt;
  line-height: 13.8pt;
  text-align: left;
}
.mou-ct td, .mou-ct th {
  border: 0.75pt solid #000;
  padding: 1.5pt 4.9pt 0;
  vertical-align: top;
  text-align: left;
  font-weight: 400;
  overflow-wrap: anywhere;
}
.mou-ct th {
  height: 39pt;
  font-weight: 700;
  text-decoration: underline;
}

/* ===== Signature grid ===== */
.mou-sg {
  display: grid;
  font-size: 12pt;
  line-height: 13.8pt;
  text-align: left;
  white-space: nowrap;
}
.mou-sg .mou-d { margin-bottom: 2.6pt; }

/* ===== Value highlight (only in screen) ===== */
.mou-v {
  background: rgba(31, 95, 139, 0.08);
  border-radius: 2px;
}
.mou-v-miss {
  background: rgba(180, 35, 24, 0.15);
}

/* ==================================================
   ✅ PRINT MODE
   ================================================== */
@media print {
  @page { size: A4; margin: 0; }

  body.mou-printing * { visibility: hidden !important; }
  body.mou-printing .mou-modal-overlay,
  body.mou-printing .mou-modal-overlay *,
  body.mou-printing .mou-preview-body,
  body.mou-printing .mou-pages,
  body.mou-printing .mou-pages * {
    visibility: visible !important;
  }

  body.mou-printing .mou-modal-overlay {
    position: absolute !important;
    inset: 0 !important;
    background: #fff !important;
    padding: 0 !important;
    backdrop-filter: none !important;
    display: block !important;
  }
  body.mou-printing .mou-modal {
    background: #fff !important;
    border-radius: 0 !important;
    max-height: none !important;
    box-shadow: none !important;
    max-width: none !important;
    width: auto !important;
    display: block !important;
    overflow: visible !important;
  }
  body.mou-printing .mou-modal-header,
  body.mou-printing .mou-no-print {
    display: none !important;
  }
  body.mou-printing .mou-preview-body {
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
    display: block !important;
  }
  body.mou-printing .mou-pages {
    gap: 0 !important;
    display: block !important;
  }
  body.mou-printing .mou-pages-wrapper {
    transform: none !important;
  }
  body.mou-printing .mou-page {
    margin: 0 !important;
    box-shadow: none !important;
    min-height: 0 !important;
    height: 841.92pt !important;
    break-after: page;
    page-break-after: always;
  }
  body.mou-printing .mou-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  body.mou-printing .mou-v,
  body.mou-printing .mou-v-miss {
    background: none !important;
  }
}

/* ==================================================
   ✅ EXPORT MODE (html2canvas capture)
   ================================================== */
body.mou-exporting .mou-modal-header,
body.mou-exporting .mou-no-export {
  display: none !important;
}
body.mou-exporting .mou-preview-body {
  padding: 0 !important;
  background: #fff !important;
}
body.mou-exporting .mou-pages-wrapper {
  transform: none !important;
}
body.mou-exporting .mou-v,
body.mou-exporting .mou-v-miss {
  background: none !important;
}

/* Responsive */
@media (max-width: 800px) {
  .mou-preview-body { padding: 10px; }
  .mou-modal-header { padding: 10px 14px; }
  .mou-modal-title { font-size: 14px; }
}
`;

// ==================================================
// ✅ Component
// ==================================================
export default function MoUPreviewModal({
  client,
  onClose,
  canPrint = true,
  canExportPDF = true,
}) {
  const pagesRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(null); // 'pdf' | 'png' | null

  // ✅ Escape key to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  // ✅ Auto-scale A4 to fit modal width
  useEffect(() => {
    const recalc = () => {
      if (!wrapperRef.current) return;
      const containerWidth = wrapperRef.current.clientWidth - 40;
      const pageWidthPx = (595.32 * 96) / 72; // 793.76 px
      const s = Math.min(1, containerWidth / pageWidthPx);
      setScale(s > 0 ? s : 1);
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  // ✅ Build pages HTML
  const pagesHTML = useMemo(() => {
    if (!client) return [];
    const get = buildGetter(client);
    return PAGES.map((raw, i) => {
      const inner = substitute(raw, get);
      return { index: i, html: inner };
    });
  }, [client]);

  // ✅ Export handlers
  const handlePrint = () => {
    if (!canPrint) return;
    setBusy('print');
    printMoU();
    setTimeout(() => setBusy(null), 800);
  };

  const handlePDF = async () => {
    if (!canExportPDF || !pagesRef.current) return;
    setBusy('pdf');
    try {
      const safeName =
        (client?.org2_short_name || client?.org2_name || 'MoU')
          .replace(/[^\w\u0980-\u09FF\u0600-\u06FF\- ]/g, '')
          .trim()
          .replace(/\s+/g, '_') || 'MoU';
      await downloadMoUAsPDF(pagesRef.current, `${safeName}_MoU.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setBusy(null);
    }
  };

  const handlePNG = async () => {
    if (!canExportPDF || !pagesRef.current) return;
    setBusy('png');
    try {
      const safeName =
        (client?.org2_short_name || client?.org2_name || 'MoU')
          .replace(/[^\w\u0980-\u09FF\u0600-\u06FF\- ]/g, '')
          .trim()
          .replace(/\s+/g, '_') || 'MoU';
      await downloadMoUAsPNG(pagesRef.current, `${safeName}_MoU.png`);
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('PNG তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setBusy(null);
    }
  };

  if (!client) return null;

  return (
    <>
      <style>{MoUCSS}</style>
      <div
        className="mou-modal-overlay"
        onClick={() => !busy && onClose()}
      >
        <div
          className="mou-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============ Header ============ */}
          <div className="mou-modal-header mou-no-print">
            <div className="mou-modal-header-left">
              <div>
                <h3 className="mou-modal-title">
                  📄 MoU Preview
                </h3>
                <p className="mou-modal-sub">
                  {client.org2_name || 'Untitled Client'}
                </p>
              </div>
            </div>

            <div className="mou-modal-actions">
              {canPrint && (
                <button
                  className="mou-btn mou-btn-primary"
                  onClick={handlePrint}
                  disabled={!!busy}
                  title="প্রিন্ট করুন"
                >
                  <Printer size={15} />
                  Print
                </button>
              )}

              {canExportPDF && (
                <>
                  <button
                    className="mou-btn mou-btn-secondary"
                    onClick={handlePDF}
                    disabled={!!busy}
                    title="PDF ডাউনলোড"
                  >
                    {busy === 'pdf' ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <FileDown size={15} />
                    )}
                    PDF
                  </button>

                  <button
                    className="mou-btn mou-btn-secondary"
                    onClick={handlePNG}
                    disabled={!!busy}
                    title="PNG ডাউনলোড"
                  >
                    {busy === 'png' ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <ImageIcon size={15} />
                    )}
                    PNG
                  </button>
                </>
              )}

              <button
                className="mou-btn mou-btn-icon"
                onClick={() => !busy && onClose()}
                disabled={!!busy}
                title="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ============ Preview body ============ */}
          <div className="mou-preview-body" ref={wrapperRef}>
            <div
              className="mou-pages-wrapper"
              style={
                scale < 1
                  ? {
                      transform: `scale(${scale})`,
                      marginBottom: `-${(1 - scale) * 100}%`,
                    }
                  : undefined
              }
            >
              <div className="mou-pages" ref={pagesRef}>
                {pagesHTML.map(({ index, html }) => (
                  <section
                    key={index}
                    className="mou-page"
                    dangerouslySetInnerHTML={{
                      __html: `${html}
                        <div class="mou-foot">
                          <b>${index + 1}</b>
                          <span class="mou-foot-g"> | P a g e</span>
                        </div>`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </>
  );
}