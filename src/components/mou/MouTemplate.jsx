// src/components/mou/MouTemplate.jsx
// ==================================================
// 📄 MOU Document Template — 3 A4 Pages
// ==================================================
// ✅ Exact A4 size (595.32pt × 841.92pt)
// ✅ Times New Roman 14pt / 18.5pt line height
// ✅ Dynamic placeholders {{key}}, **bold**, @@optional@@
// ✅ Dynamic logo watermark (from Vercel Blob URL)
// ✅ Dynamic beneficiary label — FULL BOLD
// ✅ Footer fixed at page bottom — NO overlap, NO cut-off in print
// ==================================================
import React from 'react';
import { formatDateLong } from '../../utils/mouFields';

// ==================================================
// ✅ Placeholder replacement engine
// ==================================================
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );

const getValue = (data, key) => {
  if (key.endsWith('_nodot')) {
    const base = getValue(data, key.slice(0, -6));
    return base.replace(/\.$/, '');
  }

  if (key === 'agreement_date_fmt') {
    return formatDateLong(data.agreement_date);
  }

  // ✅ Beneficiary full text — FULL BOLD
  if (key === 'beneficiary_full_text') {
    const custom = (data.beneficiary_full_text || '').trim();
    if (custom) return `**${custom}**`;

    const label =
      (data.beneficiary_label || '').trim() ||
      data.beneficiaryLabel ||
      'Employees & Students';
    const member =
      (data.beneficiary_member_text || '').trim() ||
      data.memberText ||
      'along with their member';
    const hospital = (data.org1_name || '').trim();
    const partner = (data.org2_name || '').trim();

    if (!hospital || !partner) {
      return `**The parties will provide following Special discount rates & facilities.**`;
    }

    return `**${hospital} will provide following Special discount rates & facilities for the ${label} of ${partner} ${member}.**`;
  }

  if (key === 'beneficiary_label') {
    return (
      data.beneficiary_label ||
      data.beneficiaryLabel ||
      'Employees & Students'
    )
      .toString()
      .trim();
  }

  if (key === 'beneficiary_member_text') {
    return (
      data.beneficiary_member_text ||
      data.memberText ||
      'along with their member'
    )
      .toString()
      .trim();
  }

  return (data[key] || '').toString().trim();
};

const processTemplate = (templateStr, data) => {
  return (
    templateStr
      .replace(/@@(\w+)\|?([^@]*)@@/g, (m, k, pre) => {
        const v = getValue(data, k);
        return v ? `${pre}<span class="v">${esc(v)}</span><br>` : '';
      })
      .replace(/\{\{(\w+)\}\}/g, (m, k) => {
        const v = getValue(data, k);
        return v
          ? `<span class="v">${esc(v)}</span>`
          : '<span class="v miss">________</span>';
      })
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  );
};

// ==================================================
// ✅ Template builder
// ==================================================
export const buildPages = (data) => {
  const B1 = '**{{org1_name}}**';
  const B2 = '**{{org2_name}}**';

  const rawPages = [
    // ==================================================
    // PAGE 1
    // ==================================================
    `<div class="title">
  <p>Memorandum of Understanding (MoU)</p>
  <p>of</p>
  <p>Medical Services Agreement</p>
</div>
<p>This Agreement is made between ${B2} &amp; ${B1} at {{agreement_place}}</p>
<p class="c bi" style="margin-top:14pt">Between</p>
<p>${B2} its registered address at {{org2_address}}.</p>
<p class="c bi">And</p>
<p>${B1} having its registered address at {{org1_address}}</p>
<p style="margin-top:18.5pt">Whereas ${B2} {{org2_description}}</p>
<p style="margin-top:10pt">And ${B1} {{org1_description}}</p>
<p style="margin-top:10pt">For the purpose of the agreement, the following terms shall have the meanings set forth in their respective definition, unless a different meaning is called for in the context of another provision in the agreement -</p>
<p>Now, therefore, parties hereto enter into this medical services Agreement on the following terms &amp; conditions:</p>
<p style="margin-top:18.5pt">${B2} acknowledge ${B1} as a corporate medical services provider.</p>
<div class="it" style="margin-top:18.4pt"><span class="no">1.</span>${B2} &amp; ${B1} will work together in the areas of its kinds for better cooperation and social development.</div>
<div class="it"><span class="no">2.</span>${B1} may include ${B2} in its corporate client list.</div>`,

    // ==================================================
    // PAGE 2
    // ==================================================
    `<div class="it" style="line-height:16.1pt"><span class="no">3.</span>{{beneficiary_full_text}}</div>
<ul style="margin:17.2pt -24pt 0 0;line-height:17.1pt">
  <li>{{discount_pathology}}% discount on all pathological investigation (Blood, Urine, Sputum etc).</li>
  <li>{{discount_radiology}}% discount on Radiology &amp; Imaging (X-ray, ECHO, ECG &amp; Ultrasonography etc),</li>
  <li>Rate mentioned excluding the price of contrast.</li>
  <li>{{discount_bed}}% discount will be given on Hospital bed rent &amp; Service Charge for admitted patients.</li>
  <li>Discount will be applicable for Member.</li>
</ul>
<p style="margin-top:13pt;text-align:left">4. **Identification:**</p>
<p style="margin:11.6pt 0 0 10.9pt;text-align:left">Either one of the documents listed below to be presented</p>
<ul style="--t:72pt;margin-top:.5pt;line-height:19.6pt">
  <li>Organization I.D Card or</li>
  <li>Organization letter with authorized signature</li>
</ul>
<p style="margin-top:17.3pt;text-align:left">**5. Payment terms**:</p>
<ul style="margin-top:1.1pt">
  <li>For both inpatient (IPD) and outpatient (OPD) services, the patient will self-pay by cash or card.</li>
</ul>
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
<p>This agreement is being executed in 2(two) identical originals, one to be retained by ${B1} Authority and other copy ${B2}.</p>`,

    // ==================================================
    // PAGE 3
    // ==================================================
    `<p style="margin-top:6pt;text-align:left">**9. Contact Person:**</p>
<table class="ct">
  <colgroup><col style="width:243pt"><col style="width:225pt"></colgroup>
  <tr>
    <th>Contact Person of {{org1_name_nodot}},</th>
    <th>Contact Person of {{org2_name}}</th>
  </tr>
  <tr>
    <td>@@org1_contact_name|**@@<br>@@org1_contact_designation|@@{{org1_name}}<br>@@org1_contact_phone|Mobile: @@@@org1_contact_email|Email: @@</td>
    <td>@@org2_contact_name|**@@<br>@@org2_contact_designation|@@{{org2_name}}<br>@@org2_contact_phone|Mobile: @@@@org2_contact_email|Email: @@</td>
  </tr>
</table>
<p style="line-height:16.1pt;margin-top:10pt">The parties knowingly signed this Medical Services Agreement in duplicate as of the date set forth below.</p>
<p style="line-height:16.1pt;text-align:left">Date: {{agreement_date_fmt}}</p>
<div class="sg" style="grid-template-columns:253.5pt 1fr;font-size:11pt;line-height:13.5pt;margin:2pt 0 0 1.4pt">
  <span>For &amp; On Behalf of **{{org1_short_name}}**</span>
  <span>On behalf of **{{org2_short_name}}**</span>
</div>
<div class="sg" style="grid-template-columns:288pt 1fr;margin-top:30pt">
  <span class="d">${'…'.repeat(15)}</span>
  <span class="d">.${'…'.repeat(13)}</span>
  <b>{{org1_signatory_name}}</b>
  <b style="font-size:11pt">{{org2_signatory_name}}</b>
  <span>@@org1_signatory_designation|@@</span>
  <span>@@org2_signatory_designation|@@</span>
  <span>{{org1_name}}</span>
  <span>{{org2_name}}</span>
</div>
<p class="c" style="font-size:12pt;line-height:13.8pt;margin-top:26pt">In presence of</p>
<div class="sg" style="grid-template-columns:252pt 1fr;margin-top:32pt">
  <span class="d">${'…'.repeat(15)}</span>
  <span class="d">${'…'.repeat(13)}</span>
  <b>{{org1_witness_name}}</b>
  <b>{{org2_witness_name}}</b>
  <span>@@org1_witness_designation|@@</span>
  <span>@@org2_witness_designation|@@</span>
  <span>{{org1_name}}</span>
  <span>{{org2_name}}</span>
</div>`,
  ];

  return rawPages.map((h) => processTemplate(h, data));
};

// ==================================================
// ✅ Print Styles
// ==================================================
export const MOU_PRINT_CSS = `
  .mou-pages {
    width: 595.32pt;
    margin: 0 auto;
    transform-origin: top left;
  }

  .mou-page {
    position: relative;
    width: 595.32pt;
    height: 841.92pt;
    box-sizing: border-box;
    padding: 36.5pt 36pt 60pt;   /* ✅ bottom padding: content শেষ হবে footer-এর আগে */
    margin: 0 0 14px;
    background: #ffffff;
    color: #000000;
    box-shadow: 0 2px 14px rgba(0,0,0,0.2);
    font: 14pt/18.5pt "Times New Roman", "Liberation Serif", Times, serif;
    text-align: justify;
    overflow: hidden;
  }

  .mou-page p { margin: 0; }

  .mou-page .title p {
    font-size: 25pt;
    line-height: 33pt;
    text-align: center;
  }
  .mou-page .title { margin: -1.7pt 0 30.9pt; }

  .mou-page .c { text-align: center; }
  .mou-page .bi { font-weight: 700; font-style: italic; }

  .mou-page .it {
    position: relative;
    padding-left: 13.6pt;
  }
  .mou-page .it .no {
    position: absolute;
    left: -4.6pt;
    font-weight: 700;
  }

  .mou-page ul {
    list-style: none;
    margin: 0;
    padding: 0;
    text-align: left;
  }
  .mou-page li {
    position: relative;
    padding-left: var(--t, 36pt);
  }
  .mou-page li:before {
    content: "\\2022";
    position: absolute;
    left: calc(var(--t, 36pt) - 18pt);
  }

  /* ✅ Footer — Screen preview: absolute bottom; Print: fixed bottom */
  .mou-page .foot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 14pt;
    padding: 3pt 36pt 0 35pt;
    border-top: 1pt solid #d9d9d9;
    font: 11pt Calibri, Carlito, "Segoe UI", sans-serif;
    line-height: 13pt;
    text-align: left;
    background: #ffffff;
    z-index: 5;
    box-sizing: border-box;
  }
  .mou-page .foot .g { color: #7f7f7f; letter-spacing: 0.12em; }

  .mou-page table.ct {
    width: 468pt;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 12pt;
    line-height: 13.8pt;
    text-align: left;
  }
  .mou-page .ct td,
  .mou-page .ct th {
    border: 0.75pt solid #000000;
    padding: 1.5pt 4.9pt 0;
    vertical-align: top;
    text-align: left;
    font-weight: 400;
    overflow-wrap: anywhere;
  }
  .mou-page .ct th {
    height: 39pt;
    font-weight: 700;
    text-decoration: underline;
  }

  .mou-page .sg {
    display: grid;
    font-size: 12pt;
    line-height: 13.8pt;
    text-align: left;
    white-space: nowrap;
  }
  .mou-page .sg .d { margin-bottom: 2.6pt; }

  .mou-page .v {
    background: rgba(31, 95, 139, 0.1);
    border-radius: 2px;
  }
  .mou-page .v.miss {
    background: rgba(180, 35, 24, 0.15);
  }

  /* ==================================================
     ✅ PRINT — footer becomes fixed at page bottom
     ================================================== */
  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    html, body {
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .mou-pages {
      transform: none !important;
      width: 100%;
      height: auto !important;
    }

    .mou-page {
      margin: 0;
      box-shadow: none;
      height: 297mm;               /* ✅ exact A4 height in mm */
      width: 210mm;                /* ✅ exact A4 width in mm */
      padding: 12.9mm 12.7mm 21mm; /* ✅ bottom padding for footer */
      break-after: page;
      page-break-after: always;
      overflow: hidden;
      box-sizing: border-box;
    }

    .mou-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    /* ✅ Footer stays at physical page bottom */
    .mou-page .foot {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 8mm;                 /* ✅ fixed distance from page bottom */
      padding: 2mm 12.7mm 0 12.3mm;
      background: #ffffff;
      z-index: 10;
    }

    /* ✅ Hide background highlight in print */
    .mou-page .v,
    .mou-page .v.miss {
      background: none !important;
    }
  }
`;

// ==================================================
// ✅ Rendered Pages Component
// ==================================================
export default function MouTemplate({ data, pagesRef, logoUrl }) {
  if (!data) return null;

  const pages = buildPages(data);

  const watermarkStyle = logoUrl
    ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '380pt',
        height: '380pt',
        backgroundImage: `url("${logoUrl}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'contain',
        opacity: 0.08,
        pointerEvents: 'none',
        zIndex: 0,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact',
      }
    : null;

  return (
    <>
      <style>{MOU_PRINT_CSS}</style>
      <div className="mou-pages" id="mou-pages" ref={pagesRef}>
        {pages.map((html, i) => (
          <section
            key={i}
            className="mou-page"
            style={{ position: 'relative' }}
          >
            {logoUrl && (
              <div aria-hidden="true" style={watermarkStyle} />
            )}

            <div
              style={{
                position: 'relative',
                zIndex: 1,
              }}
              dangerouslySetInnerHTML={{
                __html:
                  html +
                  `<div class="foot"><b>${i + 1}</b> <span class="g">| P a g e</span></div>`,
              }}
            />
          </section>
        ))}
      </div>
    </>
  );
}