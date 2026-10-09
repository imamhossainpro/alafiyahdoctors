// src/components/doctor/DoctorProfile.jsx
// ==================================================
// 👤 Doctor Profile — From departments collection
// ==================================================
// ✅ Read-only profile display
// ✅ Edit button → sends request to admin
// ✅ Real data from Firestore
// ==================================================

import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Stethoscope,
  Building2,
  Award,
  Clock,
  Calendar,
  Loader2,
  Edit3,
  CheckCircle2,
  XCircle,
  Hourglass,
  AlertCircle,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import {
  getDoctorInfo,
  getDoctorSchedule,
} from '../../services/doctorAppointmentService';
import {
  subscribeToMyRequests,
} from '../../services/doctorProfileRequestService';
import DoctorProfileEditModal from './DoctorProfileEditModal';

const CSS = `
  .dpf-container {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  .dpf-banner {
    height: 100px;
    background: linear-gradient(135deg, #1c5fa8, #0d9488);
    position: relative;
  }
  .dpf-avatar-wrap {
    padding: 0 24px;
    margin-top: -50px;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
  }
  .dpf-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid #fff;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    flex-shrink: 0;
  }
  .dpf-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .dpf-info {
    padding-bottom: 8px;
    flex: 1;
    min-width: 200px;
  }
  .dpf-name {
    margin: 0 0 4px 0;
    font-size: 22px;
    font-weight: 800;
    color: #1e293b;
  }
  .dpf-name-en {
    font-size: 13px;
    color: #64748b;
    font-style: italic;
  }
  .dpf-dept {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 12px;
    background: #eff6ff;
    color: #1c5fa8;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }
  .dpf-edit-btn {
    padding: 9px 18px;
    background: #1c5fa8;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    transition: all 0.2s;
    margin-bottom: 8px;
  }
  .dpf-edit-btn:hover {
    background: #154a82;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(28,95,168,0.3);
  }
  .dpf-body {
    padding: 24px;
    display: grid;
    gap: 20px;
  }
  .dpf-section {
    border-top: 1px solid #f1f5f9;
    padding-top: 20px;
  }
  .dpf-section:first-child { border-top: none; padding-top: 0; }
  .dpf-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
    color: #1c5fa8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .dpf-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .dpf-field {
    background: #f8fafc;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
  }
  .dpf-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .dpf-value {
    font-size: 14px;
    color: #1e293b;
    font-weight: 600;
    line-height: 1.5;
    white-space: pre-line;
  }
  .dpf-schedule-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    color: #115e59;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin: 4px 6px 4px 0;
  }
  .dpf-empty {
    color: #94a3b8;
    font-size: 13px;
    font-style: italic;
  }
  .dpf-loading {
    padding: 40px;
    text-align: center;
    color: #64748b;
  }
  .dpf-pending-banner {
    margin: 0 24px 12px 24px;
    padding: 12px 16px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: #92400e;
    line-height: 1.5;
  }
  .dpf-pending-banner strong {
    color: #78350f;
  }
  .dpf-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    margin-left: 6px;
  }
  .dpf-status-pending {
    background: #fef3c7;
    color: #92400e;
  }
`;

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString('bn-BD');
};

export default function DoctorProfile({ user }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  // ==================================================
  // ✅ Load doctor info + schedule
  // ==================================================
  const loadProfile = async () => {
    if (!user?.doctorId) {
      setLoading(false);
      return;
    }
    try {
      const [docInfo, sch] = await Promise.all([
        getDoctorInfo(hospitalId, user.doctorId),
        getDoctorSchedule(hospitalId, user.doctorId),
      ]);
      setDoctor(docInfo);
      setSchedule(sch);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.doctorId) {
        setLoading(false);
        return;
      }
      try {
        const [docInfo, sch] = await Promise.all([
          getDoctorInfo(hospitalId, user.doctorId),
          getDoctorSchedule(hospitalId, user.doctorId),
        ]);
        if (mounted) {
          setDoctor(docInfo);
          setSchedule(sch);
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hospitalId, user?.doctorId]);

  // ==================================================
  // ✅ Subscribe to my requests (to show pending banner)
  // ==================================================
  useEffect(() => {
    if (!user?.doctorId) return;
    const unsub = subscribeToMyRequests(
      hospitalId,
      user.doctorId,
      (list) => setMyRequests(list),
      (err) => console.warn('subscribeToMyRequests error:', err.message)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, user?.doctorId]);

  const pendingRequest = myRequests.find((r) => r.status === 'pending');

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dpf-container">
          <div className="dpf-loading">
            <Loader2 size={24} className="spin" />
            <p style={{ marginTop: 12 }}>লোড হচ্ছে...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="dpf-container">
        {/* Banner */}
        <div className="dpf-banner" />

        {/* Avatar + Name + Edit Button */}
        <div className="dpf-avatar-wrap">
          <div className="dpf-avatar">
            {doctor?.imageUrl ? (
              <img src={doctor.imageUrl} alt={doctor.name} />
            ) : (
              <User size={42} color="#94a3b8" />
            )}
          </div>
          <div className="dpf-info">
            <h2 className="dpf-name">
              {doctor?.name || user?.name || 'Doctor'}
            </h2>
            {doctor?.nameEn && (
              <div className="dpf-nameEn dpf-name-en">{doctor.nameEn}</div>
            )}
            {doctor?.deptName && (
              <span className="dpf-dept">{doctor.deptName}</span>
            )}
          </div>
          <button
            className="dpf-edit-btn"
            onClick={() => setShowEditModal(true)}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>

        {/* Pending Request Banner */}
        {pendingRequest && (
          <div className="dpf-pending-banner">
            <Hourglass size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>⏳ আপনার একটি এডিট রিকোয়েস্ট pending আছে</strong>
              <div style={{ marginTop: 4 }}>
                পাঠানো হয়েছে: {formatTime(pendingRequest.submittedAt)}
              </div>
              <div style={{ marginTop: 2, fontSize: 12 }}>
                অ্যাডমিন এপ্রুভ করলে পরিবর্তন প্রোফাইলে দেখাবে।
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="dpf-body">
          {/* Professional Info */}
          <div className="dpf-section">
            <div className="dpf-section-title">
              <Stethoscope size={14} /> Professional Information
            </div>
            <div className="dpf-row">
              <Field
                icon={Award}
                label="Qualifications"
                value={doctor?.quals}
              />
              <Field
                icon={Stethoscope}
                label="Specialty"
                value={doctor?.specialty}
              />
              <Field
                icon={Building2}
                label="Workplace"
                value={doctor?.workplace}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="dpf-section">
            <div className="dpf-section-title">
              <Calendar size={14} /> Assigned Schedule
            </div>
            {schedule.length === 0 ? (
              <p className="dpf-empty">কোনো schedule assign করা হয়নি।</p>
            ) : (
              <div>
                {schedule.map((s) => (
                  <span key={s.id} className="dpf-schedule-item">
                    <Calendar size={12} /> {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time Slots */}
          {doctor?.timeSlots && doctor.timeSlots.length > 0 && (
            <div className="dpf-section">
              <div className="dpf-section-title">
                <Clock size={14} /> Chamber Time
              </div>
              <div>
                {doctor.timeSlots.map((slot, i) => (
                  <span key={i} className="dpf-schedule-item">
                    <Clock size={12} /> {slot.start} – {slot.end}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Account */}
          <div className="dpf-section">
            <div className="dpf-section-title">
              <User size={14} /> Account
            </div>
            <div className="dpf-row">
              <Field icon={Mail} label="Email" value={user?.email} />
              <Field
                icon={User}
                label="Designation"
                value={user?.designation}
              />
            </div>
          </div>

          {/* Request History */}
          {myRequests.length > 0 && (
            <div className="dpf-section">
              <div className="dpf-section-title">
                <Hourglass size={14} /> My Edit Requests
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myRequests.slice(0, 5).map((req) => (
                  <RequestRow key={req.id} req={req} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <DoctorProfileEditModal
          currentProfile={{
            name: doctor?.name || user?.name || '',
            nameEn: doctor?.nameEn || user?.nameEn || '',
            specialty: doctor?.specialty || '',
            quals: doctor?.quals || '',
            workplace: doctor?.workplace || '',
          }}
          onClose={() => setShowEditModal(false)}
          onSubmitted={() => {
            // Reload profile data after submit
            loadProfile();
          }}
        />
      )}
    </>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="dpf-field">
      <div className="dpf-label">
        <Icon size={11} /> {label}
      </div>
      <div className="dpf-value">
        {value || <span className="dpf-empty">—</span>}
      </div>
    </div>
  );
}

function RequestRow({ req }) {
  const statusMeta = {
    pending: {
      icon: Hourglass,
      label: 'Pending',
      bg: '#fef3c7',
      color: '#92400e',
    },
    approved: {
      icon: CheckCircle2,
      label: 'Approved',
      bg: '#dcfce7',
      color: '#166534',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      bg: '#fee2e2',
      color: '#991b1b',
    },
    cancelled: {
      icon: AlertCircle,
      label: 'Cancelled',
      bg: '#f1f5f9',
      color: '#64748b',
    },
  };
  const meta = statusMeta[req.status] || statusMeta.pending;
  const Icon = meta.icon;

  const fieldCount = Object.keys(req.changes || {}).length;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
          {fieldCount} টি field পরিবর্তনের রিকোয়েস্ট
        </div>
        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
          {req.submittedAt
            ? (req.submittedAt.toDate
                ? req.submittedAt.toDate()
                : new Date(req.submittedAt.seconds * 1000)
              ).toLocaleString('bn-BD')
            : '—'}
        </div>
        {req.reviewNote && (
          <div
            style={{
              fontSize: 11.5,
              color: '#64748b',
              marginTop: 2,
              fontStyle: 'italic',
            }}
          >
            নোট: {req.reviewNote}
          </div>
        )}
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 12px',
          background: meta.bg,
          color: meta.color,
          borderRadius: 20,
          fontSize: 11.5,
          fontWeight: 700,
        }}
      >
        <Icon size={12} /> {meta.label}
      </span>
    </div>
  );
}