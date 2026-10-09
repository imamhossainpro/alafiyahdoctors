// src/components/doctor/DoctorProfile.jsx
// ==================================================
// 👤 Doctor Profile — Modern Enterprise Redesign
// ==================================================
// ✅ Compact header (no oversized gradient banner)
// ✅ No avatar overlap — clean left alignment
// ✅ Card-based responsive grid (3/2/1 col)
// ✅ Consistent color palette + typography
// ✅ Empty fields auto-hidden
// ✅ Edit Profile + admin approval flow preserved
// ✅ Real-time profile sync
// ✅ Responsive: no horizontal overflow, proper text wrap
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
  Briefcase,
  BadgeCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import {
  getDoctorInfo,
  getDoctorSchedule,
  subscribeToDoctorInfo,
} from '../../services/doctorAppointmentService';
import {
  subscribeToMyRequests,
} from '../../services/doctorProfileRequestService';
import DoctorProfileEditModal from './DoctorProfileEditModal';

// ==================================================
// ✅ Design Tokens + Responsive Layout
// ==================================================
const CSS = `
  .dp-page {
    background: #F8FAFC;
    min-height: 100%;
    width: 100%;
    max-width: 100%;
    font-family: 'Hind Siliguri', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .dp-page *,
  .dp-page *::before,
  .dp-page *::after {
    box-sizing: border-box;
  }

  .dp-header {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    width: 100%;
    max-width: 100%;
  }

  .dp-avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #F1F5F9;
    border: 3px solid #FFFFFF;
    outline: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .dp-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .dp-identity {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .dp-name-bn {
    font-size: 22px;
    font-weight: 800;
    color: #0F172A;
    margin: 0 0 3px 0;
    line-height: 1.3;
    letter-spacing: -0.2px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .dp-name-en {
    font-size: 13.5px;
    color: #64748B;
    margin: 0 0 10px 0;
    font-weight: 500;
    line-height: 1.4;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .dp-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dp-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .dp-badge-primary {
    background: #EFF6FF;
    color: #1D4ED8;
  }
  .dp-badge-teal {
    background: #F0FDFA;
    color: #0F9488;
  }

  .dp-edit-btn {
    padding: 10px 18px;
    background: #1D4ED8;
    color: #FFFFFF;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    transition: background 0.15s ease;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .dp-edit-btn:hover { background: #1E40AF; }
  .dp-edit-btn:active { background: #1E3A8A; }

  .dp-section {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    width: 100%;
    max-width: 100%;
  }

  .dp-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F1F5F9;
    text-transform: none;
    letter-spacing: 0.1px;
  }
  .dp-section-title svg { color: #1D4ED8; flex-shrink: 0; }

  .dp-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
  }

  .dp-info-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 12px 14px;
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .dp-info-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    line-height: 1.3;
  }
  .dp-info-label svg { color: #64748B; flex-shrink: 0; }

  .dp-info-value {
    font-size: 14px;
    font-weight: 600;
    color: #0F172A;
    line-height: 1.55;
    word-break: normal;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  .dp-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .dp-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    background: #F0FDFA;
    color: #0F9488;
    border: 1px solid #CCFBF1;
    line-height: 1.4;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  .dp-chip svg { flex-shrink: 0; }

  .dp-pending {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13.5px;
    color: #92400E;
    line-height: 1.55;
    width: 100%;
    max-width: 100%;
  }
  .dp-pending svg { color: #D97706; flex-shrink: 0; margin-top: 1px; }
  .dp-pending strong {
    display: block;
    color: #78350F;
    margin-bottom: 3px;
    font-weight: 700;
  }
  .dp-pending-sub {
    font-size: 12.5px;
    color: #A16207;
  }

  .dp-req-row {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .dp-req-left { min-width: 0; flex: 1 1 180px; }
  .dp-req-title {
    font-size: 13px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 3px;
    overflow-wrap: anywhere;
  }
  .dp-req-meta {
    font-size: 11.5px;
    color: #64748B;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .dp-req-note {
    font-size: 11.5px;
    color: #64748B;
    font-style: italic;
    margin-top: 3px;
    overflow-wrap: anywhere;
  }

  .dp-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .dp-status-pending { background: #FEF3C7; color: #92400E; }
  .dp-status-approved { background: #DCFCE7; color: #166534; }
  .dp-status-rejected { background: #FEE2E2; color: #991B1B; }
  .dp-status-cancelled { background: #F1F5F9; color: #64748B; }

  .dp-empty {
    color: #94A3B8;
    font-size: 13.5px;
    font-style: italic;
    margin: 0;
  }

  .dp-loading {
    padding: 60px 20px;
    text-align: center;
    color: #64748B;
  }
  .dp-loading-spin {
    display: inline-block;
    animation: dp-spin 1s linear infinite;
  }
  @keyframes dp-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1023px) {
    .dp-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .dp-header {
      padding: 20px 22px;
      gap: 18px;
    }
    .dp-section {
      padding: 18px 22px;
    }
  }

  @media (max-width: 767px) {
    .dp-page {
      padding: 0;
    }
    .dp-header {
      padding: 16px;
      gap: 12px;
      flex-direction: column;
      align-items: flex-start;
      border-radius: 10px;
    }
    .dp-avatar {
      width: 72px;
      height: 72px;
      border-width: 3px;
    }
    .dp-identity {
      flex: 1 1 100%;
      width: 100%;
    }
    .dp-name-bn {
      font-size: 19px;
    }
    .dp-name-en {
      font-size: 12.5px;
    }
    .dp-badge {
      font-size: 11.5px;
      padding: 3px 10px;
    }
    .dp-edit-btn {
      width: 100%;
      padding: 11px 16px;
      font-size: 13.5px;
      justify-content: center;
    }
    .dp-section {
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 12px;
    }
    .dp-section-title {
      font-size: 12.5px;
      margin-bottom: 14px;
      padding-bottom: 10px;
    }
    .dp-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .dp-info-card {
      padding: 11px 13px;
    }
    .dp-info-value {
      font-size: 13.5px;
    }
    .dp-pending {
      padding: 12px 14px;
      font-size: 13px;
    }
    .dp-req-row {
      padding: 10px 12px;
    }
  }

  @media (max-width: 360px) {
    .dp-header {
      padding: 14px;
    }
    .dp-section {
      padding: 14px;
    }
    .dp-name-bn {
      font-size: 17px;
    }
    .dp-info-value {
      font-size: 13px;
    }
  }
`;

// ==================================================
// ✅ Helper — format Firestore timestamp
// ==================================================
const formatTime = (ts) => {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleString('bn-BD');
  } catch {
    return '';
  }
};

// ==================================================
// ✅ Helper — Info Card
// ==================================================
function InfoCard({ icon: Icon, label, value }) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== '' &&
    String(value).trim() !== '—';

  if (!hasValue) return null;

  return (
    <div className="dp-info-card">
      <div className="dp-info-label">
        {Icon && <Icon size={12} />} {label}
      </div>
      <div className="dp-info-value">{value}</div>
    </div>
  );
}

// ==================================================
// ✅ Helper — Request Row
// ==================================================
function RequestRow({ req }) {
  const meta = {
    pending: { icon: Hourglass, label: 'Pending', cls: 'dp-status-pending' },
    approved: { icon: CheckCircle2, label: 'Approved', cls: 'dp-status-approved' },
    rejected: { icon: XCircle, label: 'Rejected', cls: 'dp-status-rejected' },
    cancelled: { icon: AlertCircle, label: 'Cancelled', cls: 'dp-status-cancelled' },
  }[req.status] || { icon: Hourglass, label: 'Pending', cls: 'dp-status-pending' };

  const Icon = meta.icon;
  const fieldCount = Object.keys(req.changes || {}).length;

  return (
    <div className="dp-req-row">
      <div className="dp-req-left">
        <div className="dp-req-title">
          {fieldCount} টি field পরিবর্তনের রিকোয়েস্ট
        </div>
        <div className="dp-req-meta">
          {formatTime(req.submittedAt) || '—'}
        </div>
        {req.reviewNote && (
          <div className="dp-req-note">নোট: {req.reviewNote}</div>
        )}
      </div>
      <span className={`dp-status-chip ${meta.cls}`}>
        <Icon size={12} /> {meta.label}
      </span>
    </div>
  );
}

// ==================================================
// ✅ MAIN COMPONENT
// ==================================================
export default function DoctorProfile({ user }) {
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  // ==================================================
  // ✅ Load profile
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
  // ✅ Real-time profile sync (admin approve → auto refresh)
  // ==================================================
  useEffect(() => {
    if (!user?.doctorId) return;
    const unsub = subscribeToDoctorInfo(
      hospitalId,
      user.doctorId,
      (info) => {
        if (info) {
          setDoctor((prev) => ({ ...(prev || {}), ...info }));
        }
      },
      (err) => console.warn('subscribeToDoctorInfo error:', err.message)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, user?.doctorId]);

  // ==================================================
  // ✅ Subscribe to own requests
  // ==================================================
  useEffect(() => {
    if (!user?.doctorId) return;
    const unsub = subscribeToMyRequests(
      hospitalId,
      user.doctorId,
      (list) => setMyRequests(list || []),
      (err) => console.warn('subscribeToMyRequests error:', err.message)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [hospitalId, user?.doctorId]);

  const pendingRequest = myRequests.find((r) => r.status === 'pending');

  // ==================================================
  // ✅ Loading
  // ==================================================
  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="dp-page">
          <div className="dp-loading">
            <Loader2 size={28} className="dp-loading-spin" />
            <p style={{ marginTop: 14, fontSize: 14 }}>লোড হচ্ছে...</p>
          </div>
        </div>
      </>
    );
  }

  // ==================================================
  // ✅ Data prep
  // ==================================================
  const displayNameBn = doctor?.name || user?.name || 'Doctor';
  const displayNameEn = doctor?.nameEn || user?.nameEn || null;
  const deptName = doctor?.deptName || null;
  const designation = user?.designation || 'Doctor';

  const hasProfessionalInfo =
    (doctor?.quals && String(doctor.quals).trim()) ||
    (doctor?.specialty && String(doctor.specialty).trim()) ||
    (doctor?.workplace && String(doctor.workplace).trim());

  const hasSchedule = Array.isArray(schedule) && schedule.length > 0;
  const hasTimeSlots =
    Array.isArray(doctor?.timeSlots) && doctor.timeSlots.length > 0;
  const hasAccount = user?.email || designation;
  const hasRequests = myRequests.length > 0;

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <>
      <style>{CSS}</style>
      <div className="dp-page">

        {/* ============ Compact Profile Header ============ */}
        <div className="dp-header">
          <div className="dp-avatar">
            {doctor?.imageUrl ? (
              <img
                src={doctor.imageUrl}
                alt={displayNameBn}
                loading="lazy"
              />
            ) : (
              <User size={38} color="#94A3B8" strokeWidth={1.5} />
            )}
          </div>

          <div className="dp-identity">
            <h1 className="dp-name-bn">{displayNameBn}</h1>
            {displayNameEn && (
              <p className="dp-name-en">{displayNameEn}</p>
            )}
            <div className="dp-badge-row">
              {deptName && (
                <span className="dp-badge dp-badge-primary">
                  <Building2 size={11} /> {deptName}
                </span>
              )}
              {designation && (
                <span className="dp-badge dp-badge-teal">
                  <BadgeCheck size={11} /> {designation}
                </span>
              )}
            </div>
          </div>

          <button
            className="dp-edit-btn"
            onClick={() => setShowEditModal(true)}
            type="button"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>

        {/* ============ Pending Request Banner ============ */}
        {pendingRequest && (
          <div className="dp-pending">
            <Hourglass size={18} />
            <div>
              <strong>আপনার একটি এডিট রিকোয়েস্ট pending আছে</strong>
              পাঠানো হয়েছে: {formatTime(pendingRequest.submittedAt)}
              <div className="dp-pending-sub">
                অ্যাডমিন এপ্রুভ করলে পরিবর্তন প্রোফাইলে দেখাবে।
              </div>
            </div>
          </div>
        )}

        {/* ============ Professional Information ============ */}
        {hasProfessionalInfo && (
          <div className="dp-section">
            <div className="dp-section-title">
              <Stethoscope size={15} /> Professional Information
            </div>
            <div className="dp-grid">
              <InfoCard
                icon={Award}
                label="Qualifications"
                value={doctor?.quals}
              />
              <InfoCard
                icon={Stethoscope}
                label="Specialty"
                value={doctor?.specialty}
              />
              <InfoCard
                icon={Building2}
                label="Workplace"
                value={doctor?.workplace}
              />
            </div>
          </div>
        )}

        {/* ============ Assigned Schedule ============ */}
        {hasSchedule && (
          <div className="dp-section">
            <div className="dp-section-title">
              <Calendar size={15} /> Assigned Schedule
            </div>
            <div className="dp-chips">
              {schedule.map((s, idx) => (
                <span key={s.id || idx} className="dp-chip">
                  <Calendar size={12} /> {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ============ Chamber Time ============ */}
        {hasTimeSlots && (
          <div className="dp-section">
            <div className="dp-section-title">
              <Clock size={15} /> Chamber Time
            </div>
            <div className="dp-chips">
              {doctor.timeSlots.map((slot, i) => (
                <span key={i} className="dp-chip">
                  <Clock size={12} /> {slot.start} – {slot.end}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ============ Account ============ */}
        {hasAccount && (
          <div className="dp-section">
            <div className="dp-section-title">
              <User size={15} /> Account
            </div>
            <div className="dp-grid">
              <InfoCard
                icon={Mail}
                label="Email"
                value={user?.email}
              />
              <InfoCard
                icon={Briefcase}
                label="Designation"
                value={designation}
              />
            </div>
          </div>
        )}

        {/* ============ My Edit Requests ============ */}
        {hasRequests && (
          <div className="dp-section">
            <div className="dp-section-title">
              <Hourglass size={15} /> My Edit Requests
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {myRequests.slice(0, 5).map((req) => (
                <RequestRow key={req.id} req={req} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ============ Edit Modal ============ */}
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
            loadProfile();
          }}
        />
      )}
    </>
  );
}