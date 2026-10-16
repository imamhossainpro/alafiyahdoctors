// src/components/all-doctors/DoctorCard.jsx
import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  Award,
  Building2,
  Calendar,
  Clock,
  Eye,
  CalendarPlus,
} from 'lucide-react';

export default function DoctorCard({ doctor, onShowDetails, onBook }) {
  const [imgError, setImgError] = useState(false);

  const hasImage = doctor.imageUrl && !imgError;
  const chamberDays = Array.isArray(doctor.chamberDays)
    ? doctor.chamberDays
    : [];
  const timeSlots = Array.isArray(doctor.timeSlots) ? doctor.timeSlots : [];

  return (
    <article className="ad-doctor-card">
      {/* Head: avatar + name */}
      <div className="ad-doctor-card-head">
        <div className="ad-doctor-avatar">
          {hasImage ? (
            <img
              src={doctor.imageUrl}
              alt={doctor.name || 'ডাক্তার'}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <User size={32} color="#94a3b8" strokeWidth={1.5} />
          )}
        </div>

        <div className="ad-doctor-identity">
          <h3 className="ad-doctor-name">{doctor.name || 'নামহীন ডাক্তার'}</h3>

          {doctor.nameEn && (
            <p className="ad-doctor-name-en">{doctor.nameEn}</p>
          )}

          {doctor.specialty && (
            <p className="ad-doctor-specialty">
              <Stethoscope size={12} />
              {doctor.specialty}
            </p>
          )}
        </div>
      </div>

      {/* Body: info rows */}
      <div className="ad-doctor-card-body">
        {doctor.quals && (
          <div className="ad-doctor-info-row">
            <Award size={14} color="#64748b" />
            <span className="ad-doctor-info-text">{doctor.quals}</span>
          </div>
        )}

        {doctor.workplace && (
          <div className="ad-doctor-info-row">
            <Building2 size={14} color="#64748b" />
            <span className="ad-doctor-info-text">{doctor.workplace}</span>
          </div>
        )}

        {doctor.deptName && (
          <div className="ad-doctor-info-row">
            <Stethoscope size={14} color="#64748b" />
            <span
              className="ad-doctor-dept-badge"
              style={{
                background: `${doctor.deptColor || '#1c5fa8'}15`,
                color: doctor.deptColor || '#1c5fa8',
              }}
            >
              {doctor.deptName}
            </span>
          </div>
        )}

        {chamberDays.length > 0 && (
          <div className="ad-doctor-chamber">
            <div className="ad-doctor-chamber-label">
              <Calendar size={13} />
              চেম্বার
            </div>
            <div className="ad-doctor-chamber-days">
              {chamberDays.map((day) => (
                <span key={day} className="ad-doctor-day-chip">
                  {day}
                </span>
              ))}
            </div>
          </div>
        )}

        {timeSlots.length > 0 && (
          <div className="ad-doctor-time">
            {timeSlots.map((slot, i) => (
              <span key={i} className="ad-doctor-time-chip">
                <Clock size={11} />
                {slot.start} - {slot.end}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="ad-doctor-card-actions">
        <button
          type="button"
          className="ad-btn ad-btn-outline"
          onClick={() => onShowDetails(doctor)}
        >
          <Eye size={15} />
          বিস্তারিত দেখুন
        </button>
        <button
          type="button"
          className="ad-btn ad-btn-primary"
          onClick={() => onBook(doctor)}
        >
          <CalendarPlus size={15} />
          সিরিয়াল দিন
        </button>
      </div>
    </article>
  );
}