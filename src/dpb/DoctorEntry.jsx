// src/dpb/DoctorEntry.jsx
// ==================================================
// 🏥 Doctor Entry — Preview Panel Item
// ==================================================
// ✅ Chamber OFF হলে একটাই ক্লিয়ার মেসেজ (ডাক্তারের নাম সহ)
// ✅ "সিরিয়াল দিন" বাটন disabled হয়
// ==================================================
import React from 'react';
import { CalendarPlus, ChevronRight, Ban } from 'lucide-react';
import { buildBookingUrl } from './utils';
import { trackEvent } from '../firebase';
import { trackMetaEvent } from '../utils/metaPixel';

export default function DoctorEntry({ doc, accentColor, isOffToday = false }) {
  const hasValidId =
    doc.id && typeof doc.id === 'string' && doc.id.trim() !== '';

  const bookingUrl = hasValidId
    ? buildBookingUrl(doc.id, doc.nameEn || doc.name || '', 'direct')
    : null;

  const handleBookClick = () => {
    if (!hasValidId || isOffToday) return;

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

      {/* ✅ Chamber OFF alert — একটাই ক্লিয়ার মেসেজ */}
      {isOffToday && (
        <div
          style={{
            marginTop: 14,
            padding: '16px 18px',
            background: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: 12,
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <Ban size={22} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.6 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
              আজকে {doc.name} এর চেম্বার অফ রেখেছেন
            </div>
            <div style={{ fontSize: 13 }}>
              আপনি চাইলে পরবর্তী চেম্বারে দিন সিরিয়াল নিতে পারবেন।
            </div>
          </div>
        </div>
      )}

      {/* ✅ Booking button OR disabled state */}
      {hasValidId && (
        <>
          {isOffToday ? (
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