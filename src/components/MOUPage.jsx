// src/components/MouPage.jsx
// ==================================================
// 📄 MOU Page — Public /mou route
// ==================================================
// ✅ Fully dynamic content from Firestore
// ✅ Real-time updates
// ✅ Bengali + English friendly
// ==================================================

import React, { useEffect, useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import {
  subscribeToMouContent,
  DEFAULT_MOU_CONTENT,
} from '../services/mouService';

// ==================================================
// ✅ CSS
// ==================================================
const MouCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');

  .mou-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f9ff 0%, #f0fdfa 100%);
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', Arial, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  }

  .mou-container {
    max-width: 960px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    animation: mouFadeIn 0.5s ease both;
  }

  @keyframes mouFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mou-header {
    background: linear-gradient(120deg, #1c5fa8 0%, #0d9488 100%);
    color: #ffffff;
    padding: 40px 32px;
    text-align: center;
  }

  .mou-header-logo {
    height: 90px;
    width: auto;
    object-fit: contain;
    margin-bottom: 12px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
  }

  .mou-header-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 6px 0;
    letter-spacing: 0.3px;
    line-height: 1.3;
  }

  .mou-header-subtitle {
    font-size: 15px;
    font-weight: 500;
    opacity: 0.95;
    margin: 0;
  }

  .mou-body {
    padding: 36px 32px 44px 32px;
  }

  .mou-intro {
    font-size: 18px;
    line-height: 1.9;
    color: #1e293b;
    text-align: center;
    margin: 0 0 36px 0;
    padding: 20px 24px;
    background: #f8fafc;
    border-radius: 14px;
    border-left: 5px solid #0d9488;
    text-align: left;
  }

  .mou-intro strong {
    font-weight: 800;
  }

  .mou-hospital-name {
    color: #1c5fa8;
  }

  .mou-beneficiary {
    color: #0d9488;
    background: linear-gradient(120deg, #ccfbf1, #a7f3d0);
    padding: 2px 10px;
    border-radius: 8px;
    font-weight: 800;
  }

  .mou-org-name {
    color: #7c3aed;
  }

  .mou-section-title {
    font-size: 20px;
    font-weight: 800;
    color: #1c5fa8;
    margin: 32px 0 16px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mou-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
    margin-top: 12px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .mou-table thead {
    background: #1c5fa8;
    color: #ffffff;
  }

  .mou-table th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 700;
    font-size: 14px;
  }

  .mou-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b;
  }

  .mou-table tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  .mou-table tbody tr:hover {
    background: #f0fdfa;
  }

  .mou-facilities-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
  }

  .mou-facilities-list li {
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14.5px;
    color: #115e59;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mou-facilities-list li::before {
    content: '✓';
    color: #0d9488;
    font-weight: 800;
    font-size: 16px;
  }

  .mou-terms-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0 0;
  }

  .mou-terms-list li {
    padding: 10px 0 10px 28px;
    border-bottom: 1px dashed #e2e8f0;
    font-size: 14px;
    color: #475569;
    position: relative;
    line-height: 1.6;
  }

  .mou-terms-list li::before {
    content: '⚠️';
    position: absolute;
    left: 0;
    top: 10px;
    font-size: 14px;
  }

  .mou-footer {
    background: #f8fafc;
    padding: 24px 32px;
    text-align: center;
    font-size: 13.5px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
  }

  .mou-footer strong {
    color: #1c5fa8;
  }

  .mou-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #64748b;
    font-size: 16px;
  }

  .mou-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #1c5fa8;
    border-radius: 50%;
    animation: mouSpin 0.8s linear infinite;
    margin-right: 12px;
  }

  @keyframes mouSpin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .mou-header { padding: 28px 18px; }
    .mou-header-title { font-size: 20px; }
    .mou-header-subtitle { font-size: 13px; }
    .mou-header-logo { height: 65px; }
    .mou-body { padding: 22px 18px 30px 18px; }
    .mou-intro { font-size: 15.5px; padding: 16px 18px; line-height: 1.8; }
    .mou-section-title { font-size: 17px; }
    .mou-table { font-size: 13px; }
    .mou-table th, .mou-table td { padding: 9px 10px; }
    .mou-facilities-list { grid-template-columns: 1fr; }
    .mou-footer { padding: 18px; font-size: 12.5px; }
  }
`;

// ==================================================
// ✅ Main Component
// ==================================================
export default function MouPage() {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [mou, setMou] = useState(DEFAULT_MOU_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToMouContent(
      hospitalId,
      (data) => {
        setMou(data);
        setLoading(false);
      },
      (err) => {
        console.error('MOU load error:', err);
        setLoading(false);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="mou-wrapper">
        <style>{MouCSS}</style>
        <div className="mou-loading">
          <span className="mou-spinner" />
          লোড হচ্ছে...
        </div>
      </div>
    );
  }

  return (
    <div className="mou-wrapper">
      <style>{MouCSS}</style>

      <div className="mou-container">
        {/* ============ Header ============ */}
        <div className="mou-header">
          <img
            src="/logo.png"
            alt="Al-Afiyah Hospital Logo"
            className="mou-header-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="mou-header-title">
            Memorandum of Understanding (MOU)
          </h1>
          <p className="mou-header-subtitle">
            Special Discount Rates & Facilities
          </p>
        </div>

        {/* ============ Body ============ */}
        <div className="mou-body">
          {/* ✅ Dynamic Intro Paragraph */}
          <p className="mou-intro">
            <strong className="mou-hospital-name">{mou.hospitalName}</strong>{' '}
            {mou.introText}{' '}
            <span className="mou-beneficiary">{mou.beneficiaryLabel}</span> of{' '}
            <strong className="mou-org-name">{mou.organizationName}</strong>{' '}
            {mou.memberText}.
          </p>

          {/* ✅ Discount Table (Optional) */}
          {mou.discountTable && mou.discountTable.length > 0 && (
            <>
              <h2 className="mou-section-title">
                💰 Discount Rates
              </h2>
              <table className="mou-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Service / Department</th>
                    <th>Regular Price</th>
                    <th>Discounted Price</th>
                  </tr>
                </thead>
                <tbody>
                  {mou.discountTable.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.service || '—'}</td>
                      <td>{row.regular || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#0d9488' }}>
                        {row.discount || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ✅ Facilities List (Optional) */}
          {mou.facilities && mou.facilities.length > 0 && (
            <>
              <h2 className="mou-section-title">🏥 Facilities</h2>
              <ul className="mou-facilities-list">
                {mou.facilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {/* ✅ Terms (Optional) */}
          {mou.terms && mou.terms.length > 0 && (
            <>
              <h2 className="mou-section-title">📋 Terms & Conditions</h2>
              <ul className="mou-terms-list">
                {mou.terms.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ============ Footer ============ */}
        <div className="mou-footer">
          For any queries, please contact{' '}
          <strong>Al-Afiyah Hospital & Diagnostic Centre Ltd.</strong>
        </div>
      </div>
    </div>
  );
}