// src/components/all-doctors/DoctorDetailsModal.jsx
// ==================================================
// 📋 DoctorDetailsModal — Full public profile
// ==================================================
import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Stethoscope,
  Award,
  Building2,
  Calendar,
  Clock,
  CalendarPlus,
} from 'lucide-react';
import { ALL_DOCTORS_DAY_ORDER } from '../../services/allDoctorsService';

export default function DoctorDetailsModal({ doctor, onClose, onBook }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!doctor) return null;

  const hasImage = doctor.imageUrl && !imgError;
  const chamberDays = Array.isArray(doctor.chamberDays)
    ? doctor.chamberDays
    : [];

  // Build day → timeSlots mapping (uses same slots for each chamber day)
  // because data model has shared timeSlots array per doctor.
  const scheduleByDay = chamberDays.map((day) => ({
    day,
    slots: Array.isArray(doctor.timeSlots) ? doctor.timeSlots : [],
  }));

  // Sort by Bengali weekday order
  scheduleByDay.sort(
    (a, b) =>
      ALL_DOCTORS_DAY_ORDER.indexOf(a.day) -
      ALL_DOCTORS_DAY_ORDER.indexOf(b.day)
  );

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ad-modal-header">
          <h2>ডাক্তারের তথ্য</h2>
          <button
            className="ad-modal-close"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="ad-modal-body">
          {/* Identity */}
          <div className="ad-modal-identity">
            <div className="ad-modal-avatar">
              {hasImage ? (
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  onError={() => setImgError(true)}
                />
              ) : (
                <User size={48} color="#94a3b8" strokeWidth={1.5} />
              )}
            </div>
            <div>
              <h3 className="ad-modal-name">{doctor.name}</h3>
              {doctor.nameEn && (
                <p className="ad-modal-name-en">{doctor.nameEn}</p>
              )}
              {doctor.specialty && (
                <p className="ad-modal-specialty">
                  <Stethoscope size={14} />
                  {doctor.specialty}
                </p>
              )}
              {doctor.deptName && (
                <span
                  className="ad-modal-dept"
                  style={{
                    background: `${doctor.deptColor || '#1c5fa8'}15`,
                    color: doctor.deptColor || '#1c5fa8',
                  }}
                >
                  {doctor.deptName}
                </span>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="ad-modal-section">
            <div className="ad-modal-section-title">
              <Award size={16} />
              শিক্ষাগত যোগ্যতা
            </div>
            <p className="ad-modal-text">
              {doctor.quals || 'তথ্য উপলব্ধ নেই'}
            </p>
          </div>

          {doctor.workplace && (
            <div className="ad-modal-section">
              <div className="ad-modal-section-title">
                <Building2 size={16} />
                কর্মস্থল
              </div>
              <p className="ad-modal-text">{doctor.workplace}</p>
            </div>
          )}

          {/* Chamber schedule */}
          {scheduleByDay.length > 0 && (
            <div className="ad-modal-section">
              <div className="ad-modal-section-title">
                <Calendar size={16} />
                চেম্বারের সময়সূচি
              </div>
              <div className="ad-modal-schedule">
                {scheduleByDay.map(({ day, slots }) => (
                  <div key={day} className="ad-modal-schedule-row">
                    <span className="ad-modal-schedule-day">{day}</span>
                    <span className="ad-modal-schedule-times">
                      {slots.length > 0 ? (
                        slots.map((s, i) => (
                          <span key={i} className="ad-modal-schedule-time">
                            <Clock size={11} />
                            {s.start} – {s.end}
                          </span>
                        ))
                      ) : (
                        <span className="ad-modal-schedule-time">
                          সময় নির্ধারিত হয়নি
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ad-modal-footer">
          <button
            type="button"
            className="ad-btn ad-btn-outline"
            onClick={onClose}
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            className="ad-btn ad-btn-primary"
            onClick={() => onBook(doctor)}
          >
            <CalendarPlus size={16} />
            সিরিয়াল দিন
          </button>
        </div>
      </div>
    </div>
  );
}