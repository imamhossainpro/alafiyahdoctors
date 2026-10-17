// src/dpb/DoctorEntry.jsx
// ==================================================
// 🏥 Doctor Entry — Preview Panel Item (Updated)
// ==================================================
// ✅ Chamber OFF হলে "পরবর্তী চেম্বারে সিরিয়াল দিন" বাটন দেখাবে
// ✅ চেম্বার বন্ধ থাকলেও বাটন অ্যাক্টিভ থাকবে
// ✅ UI সুন্দর ও শর্ট করা হয়েছে
// ==================================================
import React from 'react';
import { CalendarPlus, ChevronRight, Ban, CalendarDays } from 'lucide-react';
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
    // ✅ isOffToday থাকলেও এখন বাটন ক্লিকেবল, তাই আর চেক করা লাগবে না
    if (!hasValidId) return;

    trackEvent('booking_button_click', {
      doctor_id: doc.id,
      doctor_name: doc.name,
      department: doc.deptName || 'unknown',
      source: 'website_button',
      is_chamber_off: isOffToday, // ট্র্যাকিং এর জন্য যোগ করা হলো
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

      {/* ✅ Chamber OFF Alert Box (Redesigned to be compact) */}
      {isOffToday && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Ban size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
              আজকের চেম্বার বন্ধ আছে
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9 }}>
              আপনি চাইলে পরবর্তী চেম্বারের দিন সিরিয়াল নিতে পারবেন।
            </div>
          </div>
        </div>
      )}

      {/* ✅ Booking button (Always Active) */}
      {hasValidId && (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="serial-booking-button"
          aria-label={`${doc.name} এর সিরিয়াল দিন`}
          onClick={handleBookClick}
          style={
            isOffToday
              ? {
                  // চেম্বার অফ থাকলে বাটনের কালার সামান্য পরিবর্তন (অপশনাল)
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  boxShadow: '0 4px 14px rgba(71, 85, 105, 0.3)',
                }
              : {}
          }
        >
          {isOffToday ? (
            <>
              <CalendarDays size={18} className="btn-icon-left" />
              <span>পরবর্তী চেম্বারে সিরিয়াল দিন</span>
              <ChevronRight size={18} className="btn-icon-right" />
            </>
          ) : (
            <>
              <CalendarPlus size={18} className="btn-icon-left" />
              <span>সিরিয়াল দিন</span>
              <ChevronRight size={18} className="btn-icon-right" />
            </>
          )}
        </a>
      )}
    </div>
  );
}