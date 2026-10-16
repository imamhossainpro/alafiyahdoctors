// src/dpb/DoctorEntry.jsx
// ==================================================
// 🏥 Doctor Entry — Preview Panel Item
// ==================================================
import React from 'react';
import { CalendarPlus, ChevronRight } from 'lucide-react';
import { buildBookingUrl } from './utils';
import { trackEvent } from '../firebase';
import { trackMetaEvent } from '../utils/metaPixel';

export default function DoctorEntry({ doc, accentColor }) {
  const hasValidId =
    doc.id && typeof doc.id === 'string' && doc.id.trim() !== '';

  const bookingUrl = hasValidId
    ? buildBookingUrl(doc.id, doc.nameEn || doc.name || '', 'direct')
    : null;

  return (
    <div
      className="doctor-entry"
      style={{ borderLeftColor: accentColor }}
    >
      {/* Doctor Name */}
      <div className="doctor-name">{doc.name}</div>

      {/* Qualifications */}
      {doc.quals ? (
        <div className="doctor-quals">{doc.quals}</div>
      ) : null}

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

      {/* ✅ "সিরিয়াল দিন" Button with Meta Pixel */}
      {hasValidId && (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="serial-booking-button"
          aria-label={`${doc.name} এর সিরিয়াল দিন`}
          onClick={() => {
            console.log('🎯 [DoctorEntry] Button clicked:', doc.name);

            // ✅ GA4 tracking
            trackEvent('booking_button_click', {
              doctor_id: doc.id,
              doctor_name: doc.name,
              department: doc.deptName || 'unknown',
              source: 'website_button',
            });

            // ✅ Meta Pixel — InitiateCheckout
            trackMetaEvent('InitiateCheckout', {
              content_ids: [doc.id],
              content_name: doc.name,
              content_category: 'Doctor',
              content_type: 'product',
              currency: 'BDT',
              value: 0,
            });
          }}
        >
          <CalendarPlus size={18} className="btn-icon-left" />
          <span>সিরিয়াল দিন</span>
          <ChevronRight size={18} className="btn-icon-right" />
        </a>
      )}
    </div>
  );
}