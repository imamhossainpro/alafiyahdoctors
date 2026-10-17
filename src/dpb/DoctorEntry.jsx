// src/dpb/DoctorEntry.jsx
// ==================================================
// 🏥 Doctor Entry — Preview Panel Item
// ==================================================
// ✅ Chamber OFF হলে লাল বক্স দেখায়
// ✅ "সিরিয়াল দিন" বাটন disabled হয়
// ✅ Next available date-এর জন্য বাটন দেখায়
// ==================================================
import React, { useState, useEffect } from 'react';
import { CalendarPlus, ChevronRight, Ban, Calendar } from 'lucide-react';
import { buildBookingUrl } from './utils';
import { trackEvent } from '../firebase';
import { trackMetaEvent } from '../utils/metaPixel';
import { useHospital } from '../context/HospitalContext';

const getBDTodayString = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 60 * 60000);
  return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(bd.getDate()).padStart(2, '0')}`;
};

export default function DoctorEntry({ doc, accentColor, isOffToday = false }) {
  const hasValidId =
    doc.id && typeof doc.id === 'string' && doc.id.trim() !== '';

  const bookingUrl = hasValidId
    ? buildBookingUrl(doc.id, doc.nameEn || doc.name || '', 'direct')
    : null;

  const handleBookClick = () => {
    if (!hasValidId || isOffToday) return;

    console.log('🎯 [DoctorEntry] Button clicked:', doc.name);

    trackEvent('booking_button_click', {
      doctor_id: doc.id,
      doctor_name: doc.name,
      department: doc.deptName || 'unknown',
      source: 'website_button',
    });

    trackMetaEvent('InitiateCheckout', {
      content_ids: [doc.id],
      content_name: doc.name,
      content_category: 'Doctor',
      content_type: 'product',
      currency: 'BDT',
      value: 0,
    });
  };

  return (
    <div
      className="doctor-entry"
      style={{ borderLeftColor: accentColor }}
    >
      {/* Doctor Name */}
      <div className="doctor-name">{doc.name}</div>

      {/* Qualifications */}
      {doc.quals ? <div className="doctor-quals">{doc.quals}</div> : null}

      {/* Specialty */}
      {doc.specialty ? (
        <div className="doctor-specialty">{doc.specialty}</div>
      ) : null}

      {/* Workplace */}
      {doc.workplace ? (
        <div className="doctor-workplace">{doc.workplace}</div>
      ) : null}

      {/* Time Slots */}
      {doc.timeSlots && doc.timeSlots.length > 0 && (
        <div className="doctor-time-slots">
          {doc.timeSlots.map((slot, idx) => (
            <span key={idx} className="doctor-time-slot-item">
              <span className="doctor-time-label">⏱ সাক্ষাতের সময়ঃ</span>{' '}
              {slot.start} - {slot.end}
            </span>
          ))}
        </div>
      )}

      {/* ✅ Chamber OFF alert */}
      {isOffToday && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: 10,
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Ban size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
              আজকে ডাক্তার চেম্বার অফ রেখেছেন
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              আপনি চাইলে পরবর্তী চেম্বারে দিন সিরিয়াল নিতে পারবেন।
            </div>
          </div>
        </div>
      )}

      {/* ✅ Booking button OR disabled state */}
      {hasValidId && (
        <>
          {isOffToday ? (
            // ❌ Disabled when OFF
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                marginTop: 14,
                padding: '14px 24px',
                background: '#f1f5f9',
                color: '#94a3b8',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 12,
                cursor: 'not-allowed',
                border: '2px dashed #cbd5e1',
                boxSizing: 'border-box',
              }}
            >
              <Ban size={18} />
              <span>আজ চেম্বার বন্ধ</span>
            </div>
          ) : (
            // ✅ Active booking button
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="serial-booking-button"
              aria-label={`${doc.name} এর সিরিয়াল দিন`}
              onClick={handleBookClick}
            >
              <CalendarPlus size={18} className="btn-icon-left" />
              <span>সিরিয়াল দিন</span>
              <ChevronRight size={18} className="btn-icon-right" />
            </a>
          )}
        </>
      )}
    </div>
  );
}