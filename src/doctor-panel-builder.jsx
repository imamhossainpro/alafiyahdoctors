// src/doctor-panel-builder.jsx
// ==================================================
// 🏥 Doctor Panel Builder — Full File (Fixed)
// ==================================================
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppShellSkeleton } from './components/ui/SkeletonScreens';
import {
  Plus, Ear, Trash2, Pencil, Printer, X, ChevronUp, ChevronDown, ChevronLeft,
  MapPin, Globe, Phone, Loader2, Stethoscope, Scissors, Heart, Baby, Bone,
  Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User,
  Droplet, Thermometer, LogOut, CheckCircle, XCircle, RefreshCw, Link as LinkIcon,
  Copy, QrCode, Check, Camera, Upload, Ticket, Ban, CalendarX2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import {
  db, doc, getDoc, setDoc, getDocs, collection, deleteDoc, updateDoc,
  query, where, writeBatch, trackEvent,
} from './firebase';
import BookingSystem from './BookingSystem';
import AdminDashboard from './components/AdminDashboard';
import NotificationBell from './components/NotificationBell';
import NotFoundPage from './components/NotFoundPage';
import { useHospital } from './context/HospitalContext';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import DoctorOverrideModal from './components/admin/DoctorOverrideModal';

// ✅ Lazy load — heavy components
const MoUClientManager = lazy(() => import('./components/admin/MoUClientManager'));

// ✅ DPB modules
import { DPB_CSS } from './dpb/dpb.css.js';
import Header from './dpb/Header';
import DoctorEntry from './dpb/DoctorEntry';
import {
  uid,
  buildBookingUrl,
  html2canvasIgnoreElements,
  getOrderedDepartments,
  validateTimeFormat,
  standardizeTime,
  timeToMinutes,
  makeDoctor,
  makeDepartment,
} from './dpb/utils';
import {
  DAY_NAMES,
  titleForName,
  ICONS,
  ICON_KEYS,
  COLOR_THEMES,
  RESTRICTED_ROLES,
  DEFAULT_FOOTER,
  DEFAULT_BRANDING,
} from './dpb/constants';

// ✅ Chamber OFF + one-time doctor services
import {
  subscribeToOffDoctors,
  subscribeToOneTimeDoctors,
} from './services/doctorOverrideService';

// ==================================================
// ✅ CSS
// ==================================================
const CSS = DPB_CSS;

// ==================================================
// ✅ BD timezone helper
// ==================================================
const getBDTodayString = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 60 * 60000);
  return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}-${String(
    bd.getDate()
  ).padStart(2, '0')}`;
};

// ==================================================
// ✅ Save Indicator
// ==================================================
function SaveIndicator({ status }) {
  if (status === 'idle') return null;
  const text =
    status === 'saving'
      ? 'সংরক্ষণ হচ্ছে...'
      : status === 'saved'
      ? '✓ সংরক্ষিত হয়েছে'
      : 'সংরক্ষণ ব্যর্থ হয়েছে';
  return <span className="save-indicator">{text}</span>;
}

// ==================================================
// ✅ Admin Panel — Full User Management
// ==================================================
function AdminPanel({ users, onApprove, onSetRole, onDeleteUser }) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.designation || '').toLowerCase().includes(term) ||
        (u.role || '').toLowerCase().includes(term) ||
        (u.id || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div className="edit-panel content-fade-in" style={{ padding: '20px' }}>
      <section className="panel-section">
        <div className="section-header">
          <label>ইউজার ম্যানেজমেন্ট</label>
          <span
            style={{
              background: '#eff6ff', color: '#1c5fa8',
              padding: '4px 12px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700',
            }}
          >
            মোট: {users.length} জন
          </span>
        </div>
        <div className="section-hint">
          রেজিস্ট্রেশন করা ইউজারদের এপ্রুভ, রোল সেট ও ডিলিট করুন।
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center', background: '#f1f5f9',
            borderRadius: '8px', padding: '4px 12px', marginBottom: '16px',
            maxWidth: '420px', marginTop: '10px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="নাম / ইমেইল / রোল / ডেসিগনেশন সার্চ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              padding: '8px 10px', fontSize: '13.5px', width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {users.length === 0 ? (
          <div className="empty-state">এখনো কোনো ইউজার রেজিস্ট্রেশন করে নি।</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">&quot;{searchTerm}&quot; এর সাথে মিলে এমন কোনো ইউজার নেই।</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e6ee', textAlign: 'left', background: '#f8fafc', color: '#475569', fontSize: '12.5px' }}>
                  <th style={{ padding: '12px 10px' }}>নাম</th>
                  <th style={{ padding: '12px 10px' }}>ইমেইল</th>
                  <th style={{ padding: '12px 10px' }}>ডেসিগনেশন</th>
                  <th style={{ padding: '12px 10px' }}>রোল</th>
                  <th style={{ padding: '12px 10px' }}>স্ট্যাটাস</th>
                  <th style={{ padding: '12px 10px' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eef1f7', fontSize: '13.5px' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>
                      {u.name || u.displayName || 'নাম নেই'}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#475569', fontSize: '12.5px' }}>
                      {u.email ? (
                        <a href={`mailto:${u.email}`} style={{ color: '#1c5fa8', textDecoration: 'none' }}>
                          {u.email}
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '12.5px' }}>
                      {u.designation || <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <select
                        value={u.role || 'pending'}
                        onChange={(e) => onSetRole(u.id, e.target.value)}
                        style={{
                          padding: '6px 10px', borderRadius: '8px',
                          border: '1px solid #e2e6ee', fontSize: '13px',
                          background: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        <option value="pending">পেন্ডিং</option>
                        <option value="admin">অ্যাডমিন</option>
                        <option value="sub-admin">সাব-অ্যাডমিন</option>
                        <option value="editor">এডিটর</option>
                        <option value="moderator">মডারেটর</option>
                        <option value="viewer">ভিউয়ার</option>
                        <option value="doctor">ডাক্তার</option>
                        <option value="patient">রোগী</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {u.approved ? (
                        <span style={{ color: '#166534', fontWeight: '700', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px' }}>
                          এপ্রুভড
                        </span>
                      ) : (
                        <span style={{ color: '#991b1b', fontWeight: '700', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px' }}>
                          পেন্ডিং
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {!u.approved && (
                        <button
                          onClick={() => onApprove(u.id)}
                          style={{ padding: '6px 12px', fontSize: '12px', background: '#1c5fa8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          ✓ এপ্রুভ
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`"${u.name || 'ইউজার'}"-কে ডিলিট করতে চান?`)) onDeleteUser(u.id);
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        🗑 ডিলিট
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ==================================================
// ✅ Doctor Link Modal
// ==================================================
function DoctorLinkModal({ doctor, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [linkMode, setLinkMode] = useState('qr');

  const linkUrl = buildBookingUrl(
    doctor.id,
    doctor.nameEn || doctor.name || '',
    linkMode === 'qr' ? 'qr' : 'direct'
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!linkUrl) return;
    QRCode.toDataURL(linkUrl, { width: 300, margin: 2, color: { dark: '#1c5fa8', light: '#ffffff' } })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR error:', err));
  }, [linkUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = linkUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${doctor.nameEn || doctor.name || 'doctor'}-${linkMode}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LinkIcon size={18} color="#0891b2" />
            ডাক্তারের বুকিং লিংক
          </h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '3px solid #e2e6ee', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {doctor.imageUrl ? (
                <img src={doctor.imageUrl} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="#94a3b8" />
              )}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1c5fa8', marginBottom: '4px' }}>
              {doctor.name}
            </div>
            {doctor.nameEn && (
              <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>{doctor.nameEn}</div>
            )}
            {doctor.specialty && (
              <div style={{ fontSize: '13px', color: '#9c2a7e', marginTop: '4px', fontWeight: '600' }}>{doctor.specialty}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setLinkMode('qr')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                background: linkMode === 'qr' ? '#1c5fa8' : 'transparent',
                color: linkMode === 'qr' ? '#fff' : '#475569',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📱 QR Code (Offline)
            </button>
            <button
              type="button"
              onClick={() => setLinkMode('direct')}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
                background: linkMode === 'direct' ? '#1c5fa8' : 'transparent',
                color: linkMode === 'direct' ? '#fff' : '#475569',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🔗 Direct Link (Online)
            </button>
          </div>

          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
            📎 বুকিং লিংক {linkMode === 'qr' ? '(QR Scan-এর জন্য)' : '(Direct Share-এর জন্য)'}
          </label>
          <div className="link-modal-input">
            <input type="text" readOnly value={linkUrl} onClick={(e) => e.target.select()} />
            <button onClick={handleCopy} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}>
              {copied ? <><Check size={14} /> কপি হয়েছে</> : <><Copy size={14} /> কপি</>}
            </button>
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '10px', lineHeight: '1.6', background: '#f0fdfa', padding: '10px 12px', borderRadius: '8px', border: '1px solid #99f6e4' }}>
            {linkMode === 'qr' ? (
              <>
                <strong style={{ color: '#0f766e' }}>📱 QR Code Mode:</strong> এই লিংকটি QR code-এ embed করা হবে।
                রোগী QR scan করলে GA4-তে <code style={{ background: '#ccfbf1', padding: '1px 5px', borderRadius: '3px' }}>qr / offline</code> source হিসেবে track হবে।
              </>
            ) : (
              <>
                <strong style={{ color: '#0f766e' }}>🔗 Direct Link Mode:</strong> এই লিংক Facebook/WhatsApp-এ share করুন।
                GA4-তে <code style={{ background: '#ccfbf1', padding: '1px 5px', borderRadius: '3px' }}>website / web_button</code> source হিসেবে track হবে।
              </>
            )}
          </div>

          {qrDataUrl && linkMode === 'qr' && (
            <div className="qr-container">
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>
                📱 QR কোড (স্ক্যান করে বুক করুন)
              </div>
              <img src={qrDataUrl} alt="QR Code" />
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" onClick={handleDownloadQR} style={{ fontSize: '12.5px' }}>
                  ⬇️ QR ডাউনলোড
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>বন্ধ করুন</button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ DoctorRow
// ==================================================
function DoctorRow({
  doc, index, total, checked, onToggleChecked, onEdit, onDelete,
  onMoveUp, onMoveDown, onShowLink, allowDelete = true, showCheckbox = true,
  isOffToday = false, isOneTime = false,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="doctor-row" key={doc.id}>
      {showCheckbox && (
        <input
          type="checkbox"
          className="doctor-checkbox"
          checked={checked}
          onChange={onToggleChecked}
          title="প্রিভিউতে দেখাতে টিক দিন"
        />
      )}

      <div className="doctor-thumb">
        {doc.imageUrl ? (
          <img src={doc.imageUrl} alt={doc.name} />
        ) : (
          <span className="placeholder"><User size={22} /></span>
        )}
      </div>

      <div className="doctor-row-info">
        <div className="doctor-row-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {doc.name || 'নামহীন ডাক্তার'}
          {isOffToday && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              চেম্বার অফ
            </span>
          )}
          {isOneTime && (
            <span style={{ background: '#1e40af', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              এই দিনে
            </span>
          )}
        </div>
        {doc.specialty ? <div className="doctor-row-specialty">{doc.specialty}</div> : null}
        {doc.timeSlots && doc.timeSlots.length > 0 && (
          <div className="doctor-row-time-slots">
            {doc.timeSlots.map((slot, idx) => (
              <span key={idx} className="doctor-row-time-slot-item">
                ⏱ {slot.start} - {slot.end}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="doctor-row-actions">
        {onMoveUp && (
          <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান">
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান">
            <ChevronDown size={14} />
          </button>
        )}
        {onShowLink && (
          <button className="icon-btn link-btn" onClick={onShowLink} title="বুকিং লিংক দেখান">
            <LinkIcon size={14} />
          </button>
        )}
        <button className="icon-btn" onClick={onEdit} title="সম্পাদনা">
          <Pencil size={14} />
        </button>
        {allowDelete && (
          <button
            className={confirmDelete ? 'icon-btn danger-confirm' : 'icon-btn'}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            title="মুছুন"
          >
            {confirmDelete ? 'নিশ্চিত?' : <Trash2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ==================================================
// ✅ DepartmentCard
// ==================================================
function DepartmentCard({
  dept, index, total, checkedIds, onEdit, onDelete, onMoveUp, onMoveDown,
  onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctorUp, onMoveDoctorDown,
  onToggleDoctorChecked, onToggleAllChecked, onShowDoctorLink,
  allowDeptDelete = true, allowDoctorDelete = true, showCheckbox = true,
  showSelectAll = true, offDoctorIds = new Set(),
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const Icon = ICONS[dept.icon] || ICONS.Stethoscope;
  const deptDoctorIds = dept.doctors?.map((doc) => doc.id) || [];
  const allChecked = deptDoctorIds.length > 0 && deptDoctorIds.every((id) => checkedIds.has(id));

  return (
    <div className="dept-card" style={{ borderLeftColor: dept.color }} key={dept.id}>
      <div className="dept-card-header">
        <div className="dept-card-title">
          <span className="dept-card-icon" style={{ background: dept.color }}>
            <Icon size={15} color="#fff" />
          </span>
          <strong>{dept.name || 'নামহীন বিভাগ'}</strong>
          <span className="dept-doctor-count">{dept.doctors?.length || 0} জন ডাক্তার</span>
          {showSelectAll && dept.doctors?.length > 0 && (
            <button className="dept-toggle-btn" onClick={onToggleAllChecked}>
              {allChecked ? 'সব বাদ দিন' : 'সব বাছুন'}
            </button>
          )}
        </div>

        <div className="dept-card-actions">
          {onMoveUp && (
            <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান">
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান">
              <ChevronDown size={16} />
            </button>
          )}
          <button className="icon-btn" onClick={onEdit} title="সম্পাদনা">
            <Pencil size={16} />
          </button>
          {allowDeptDelete && (
            <button
              className={confirmDelete ? 'icon-btn danger-confirm' : 'icon-btn'}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              title="মুছুন"
            >
              {confirmDelete ? 'নিশ্চিত?' : <Trash2 size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="doctor-mini-list">
        {dept.doctors?.map((doc, di) => (
          <DoctorRow
            key={doc.id}
            doc={doc}
            index={di}
            total={dept.doctors?.length || 0}
            checked={checkedIds.has(doc.id)}
            onToggleChecked={() => onToggleDoctorChecked(doc.id)}
            onEdit={() => onEditDoctor(doc)}
            onDelete={() => onDeleteDoctor(doc.id)}
            onMoveUp={() => onMoveDoctorUp(doc.id)}
            onMoveDown={() => onMoveDoctorDown(doc.id)}
            onShowLink={onShowDoctorLink ? () => onShowDoctorLink(doc) : null}
            allowDelete={allowDoctorDelete}
            showCheckbox={showCheckbox}
            isOffToday={offDoctorIds.has(doc.id)}
          />
        ))}
        {allowDoctorDelete && (
          <button className="add-doctor-btn" onClick={onAddDoctor}>
            <Plus size={14} /> ডাক্তার যোগ করুন
          </button>
        )}
      </div>
    </div>
  );
}

// ==================================================
// ✅ DepartmentModal
// ==================================================
function DepartmentModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [icon, setIcon] = useState(initial ? initial.icon : 'Stethoscope');
  const [color, setColor] = useState(initial ? initial.color : COLOR_THEMES[0]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'বিভাগ সম্পাদনা করুন' : 'নতুন বিভাগ যোগ করুন'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label>বিভাগের নাম</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমনঃ মেডিসিন বিভাগ" />

          <label>আইকন বেছে নিন</label>
          <div className="icon-grid">
            {ICON_KEYS.map((key) => {
              const IconComp = ICONS[key];
              const selected = icon === key;
              return (
                <button
                  key={key}
                  className={selected ? 'icon-choice selected' : 'icon-choice'}
                  style={selected ? { borderColor: color, background: color } : {}}
                  onClick={() => setIcon(key)}
                  title={key}
                >
                  <IconComp size={17} color={selected ? '#fff' : '#555'} />
                </button>
              );
            })}
          </div>

          <label>রঙ বেছে নিন</label>
          <div className="color-grid">
            {COLOR_THEMES.map((c) => (
              <button
                key={c}
                className={color === c ? 'color-choice selected' : 'color-choice'}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>সংরক্ষণ করুন</button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ DoctorModal
// ==================================================
function DoctorModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [nameEn, setNameEn] = useState(initial ? initial.nameEn || '' : '');
  const [quals, setQuals] = useState(initial ? initial.quals : '');
  const [specialty, setSpecialty] = useState(initial ? initial.specialty : '');
  const [workplace, setWorkplace] = useState(initial ? initial.workplace : '');
  const [timeSlots, setTimeSlots] = useState(
    initial?.timeSlots && initial.timeSlots.length > 0
      ? initial.timeSlots
      : [{ start: '09:00 AM', end: '11:00 AM' }]
  );
  const [slotErrors, setSlotErrors] = useState({});

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl || '');
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleAddSlot = () => setTimeSlots([...timeSlots, { start: '09:00 AM', end: '11:00 AM' }]);

  const handleRemoveSlot = (index) => {
    if (timeSlots.length <= 1) {
      alert('কমপক্ষে একটি সময় স্লট থাকতে হবে!');
      return;
    }
    const newSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(newSlots);
    const newErrors = { ...slotErrors };
    delete newErrors[`${index}-start`];
    delete newErrors[`${index}-end`];
    setSlotErrors(newErrors);
  };

  const handleSlotChange = (index, field, value) => {
    const updated = timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot));
    setTimeSlots(updated);
    const errorKey = `${index}-${field}`;
    const newErrors = { ...slotErrors };
    if (value.trim() && !validateTimeFormat(value)) {
      newErrors[errorKey] = 'ফরম্যাট: 09:00 AM বা 11:30 PM';
    } else {
      delete newErrors[errorKey];
    }
    setSlotErrors(newErrors);
  };

  const handleSlotBlur = (index, field) => {
    const value = timeSlots[index][field];
    if (value.trim() && validateTimeFormat(value)) {
      const standardized = standardizeTime(value);
      const updated = timeSlots.map((slot, i) => (i === index ? { ...slot, [field]: standardized } : slot));
      setTimeSlots(updated);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('শুধু ছবি (image) ফাইল নির্বাচন করুন');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError('ছবির সাইজ 3MB এর কম হতে হবে');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('ডাক্তারের নাম লিখুন!');
      return;
    }

    const errors = {};
    let hasError = false;

    timeSlots.forEach((slot, i) => {
      if (!slot.start || !slot.start.trim()) {
        errors[`${i}-start`] = 'শুরুর সময় লিখুন';
        hasError = true;
      } else if (!validateTimeFormat(slot.start)) {
        errors[`${i}-start`] = 'ফরম্যাট: 09:00 AM বা 11:30 PM';
        hasError = true;
      }

      if (!slot.end || !slot.end.trim()) {
        errors[`${i}-end`] = 'শেষ সময় লিখুন';
        hasError = true;
      } else if (!validateTimeFormat(slot.end)) {
        errors[`${i}-end`] = 'ফরম্যাট: 09:00 AM বা 11:30 PM';
        hasError = true;
      }

      if (slot.start && slot.end && validateTimeFormat(slot.start) && validateTimeFormat(slot.end)) {
        const startMin = timeToMinutes(slot.start);
        const endMin = timeToMinutes(slot.end);
        if (startMin !== null && endMin !== null && startMin >= endMin) {
          errors[`${i}-end`] = 'শেষ সময় অবশ্যই শুরুর সময়ের পরে হতে হবে';
          hasError = true;
        }
      }
    });

    if (hasError) {
      setSlotErrors(errors);
      alert('সময় স্লটে ত্রুটি আছে। অনুগ্রহ করে ঠিক করুন।');
      return;
    }

    const cleanedSlots = timeSlots.map((slot) => ({
      start: standardizeTime(slot.start),
      end: standardizeTime(slot.end),
    }));

    let finalImageUrl = initial?.imageUrl || '';

    try {
      if (imageFile) {
        setUploading(true);
        setImageError('');
        const formData = new FormData();
        formData.append('file', imageFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        finalImageUrl = data.url;
        console.log('✅ Image uploaded:', finalImageUrl);
      } else if (initial?.imageUrl && !imagePreview) {
        finalImageUrl = '';
      }
    } catch (err) {
      console.error('❌ Image upload error:', err);
      setImageError(err.message || 'ছবি আপলোড করতে সমস্যা হয়েছে');
      setUploading(false);
      return;
    } finally {
      setUploading(false);
    }

    onSave({
      name: name.trim(),
      nameEn: nameEn.trim(),
      quals,
      specialty,
      workplace,
      timeSlots: cleanedSlots,
      imageUrl: finalImageUrl,
    });
  };

  const inputBaseStyle = {
    padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', width: '100%',
    textAlign: 'center', fontWeight: '600', letterSpacing: '0.5px', background: '#fff',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'ডাক্তারের তথ্য সম্পাদনা' : 'নতুন ডাক্তার যোগ করুন'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <label style={{ fontWeight: '700', display: 'block', marginBottom: '8px' }}>ডাক্তারের ছবি</label>
          <div className="doctor-image-upload" style={{ marginBottom: '16px' }}>
            <div className="doctor-image-preview">
              {imagePreview ? (
                <img src={imagePreview} alt="Doctor preview" />
              ) : (
                <span className="placeholder"><User size={40} /></span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <input type="file" id="doctor-image-input" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
              <label htmlFor="doctor-image-input" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}>
                <Camera size={15} /> ছবি নির্বাচন করুন
              </label>
              {imagePreview && (
                <button type="button" onClick={handleRemoveImage} className="btn btn-outline" style={{ marginLeft: '8px', fontSize: '12.5px', padding: '8px 14px' }}>
                  <X size={14} /> সরান
                </button>
              )}
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                JPG / PNG · সর্বোচ্চ 3MB · বর্গাকার ছবি সবচেয়ে ভালো
              </p>
              {imageError && (
                <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0 0', fontWeight: '600' }}>⚠️ {imageError}</p>
              )}
            </div>
          </div>

          <label>ডাক্তারের নাম (বাংলা)</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমনঃ ডাঃ মোহাম্মদ নূর" />

          <label style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ডাক্তারের নাম (English)
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>(SMS/Email-এ ব্যবহৃত হবে)</span>
          </label>
          <input className="input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="যেমনঃ Dr. Mohammad Nur" />

          <label style={{ marginTop: '12px' }}>শিক্ষাগত যোগ্যতা / ডিগ্রি</label>
          <textarea className="textarea" rows={3} value={quals} onChange={(e) => setQuals(e.target.value)} placeholder="প্রতি লাইনে একটি করে ডিগ্রি লিখুন" />

          <label>বিশেষত্ব</label>
          <textarea className="textarea" rows={2} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="যেমনঃ মেডিসিন বিশেষজ্ঞ" />

          <label>কর্মস্থল / পদবী</label>
          <textarea className="textarea" rows={2} value={workplace} onChange={(e) => setWorkplace(e.target.value)} placeholder="যেমনঃ চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল" />

          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <label style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>
              ⏰ সাক্ষাতের সময় (একাধিক স্লট যোগ করুন)
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px 0', lineHeight: '1.5' }}>
              ফরম্যাট:{' '}
              <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '11.5px' }}>HH:MM AM</code>{' '}
              অথবা{' '}
              <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '11.5px' }}>HH:MM PM</code>
              <br />
              উদাহরণ: <strong>09:00 AM</strong>, <strong>02:30 PM</strong>, <strong>11:45 PM</strong>
            </p>

            {timeSlots.map((slot, index) => {
              const startError = slotErrors[`${index}-start`];
              const endError = slotErrors[`${index}-end`];
              return (
                <div key={index} style={{ marginBottom: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: startError || endError ? '1.5px solid #dc2626' : '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>শুরু</label>
                      <input
                        type="text"
                        value={slot.start}
                        onChange={(e) => handleSlotChange(index, 'start', e.target.value)}
                        onBlur={() => handleSlotBlur(index, 'start')}
                        placeholder="09:00 AM"
                        maxLength={8}
                        autoComplete="off"
                        style={{ ...inputBaseStyle, borderColor: startError ? '#dc2626' : '#cbd5e1' }}
                      />
                      {startError && (<div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>⚠️ {startError}</div>)}
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>শেষ</label>
                      <input
                        type="text"
                        value={slot.end}
                        onChange={(e) => handleSlotChange(index, 'end', e.target.value)}
                        onBlur={() => handleSlotBlur(index, 'end')}
                        placeholder="11:00 AM"
                        maxLength={8}
                        autoComplete="off"
                        style={{ ...inputBaseStyle, borderColor: endError ? '#dc2626' : '#cbd5e1' }}
                      />
                      {endError && (<div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>⚠️ {endError}</div>)}
                    </div>
                    <div style={{ paddingTop: '22px' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        title="স্লট মুছুন"
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', padding: '9px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(220,38,38,0.20)', transition: 'all 0.2s' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button className="btn btn-secondary" onClick={handleAddSlot} style={{ marginTop: '6px' }}>
              <Plus size={14} /> আরও সময় যোগ করুন
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>বাতিল</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || uploading}>
            {uploading ? (<><Loader2 size={14} className="spin" /> আপলোড হচ্ছে...</>) : ('সংরক্ষণ করুন')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ PanelModal
// ==================================================
function PanelModal({ mode, initial, activeDeptCount, departments, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [duplicate, setDuplicate] = useState(mode === 'add' && activeDeptCount > 0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, title: titleForName(trimmed), duplicate, selectedIds: [...selectedIds] });
  };

  const toggleDoctor = (id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAll = () => {
    const allIds = [];
    departments.forEach((dept) => dept.doctors?.forEach((doc) => allIds.push(doc.id)));
    if (selectedIds.size === allIds.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{mode === 'add' ? 'নতুন দিন/প্যানেল যোগ করুন' : 'প্যানেল সম্পাদনা করুন'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <label>দিন বা প্যানেলের নাম</label>
          {mode === 'add' ? (
            <div className="day-buttons">
              {DAY_NAMES.map((d) => (
                <button key={d} className="day-btn" onClick={() => setName(d)}>{d}</button>
              ))}
            </div>
          ) : null}
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমনঃ শনিবার, অথবা নিজের মতো নাম" />

          {mode === 'add' && (
            <>
              <label style={{ marginTop: '14px', display: 'block' }}>ডাক্তার বেছে নিন (টিক দিন)</label>
              <button className="btn btn-secondary" onClick={toggleAll} style={{ marginBottom: '10px' }}>
                {selectedIds.size === departments.flatMap((d) => d.doctors || []).length ? 'সব বাদ দিন' : 'সব বাছুন'}
              </button>
              {departments.map((dept) => (
                <div key={dept.id} style={{ marginBottom: '10px' }}>
                  <strong style={{ color: dept.color }}>{dept.name}</strong>
                  {dept.doctors?.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0' }}>
                      <input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => toggleDoctor(doc.id)} />
                      <label>{doc.name}</label>
                    </div>
                  ))}
                </div>
              ))}
              <label className="checkbox-row" style={{ marginTop: '14px' }}>
                <input type="checkbox" checked={duplicate} onChange={(e) => setDuplicate(e.target.checked)} />
                <span>বর্তমান দিনের ডাক্তার সিলেকশন কপি করুন</span>
              </label>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>সংরক্ষণ করুন</button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ PanelSwitcher
// ==================================================
function PanelSwitcher({ panels, activePanelId, onSwitch, onAdd, onRename, onDelete, isReadOnly = false, canManagePanels = true }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const t = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmDeleteId]);

  return (
    <div className="panel-switcher no-print">
      <div className="panel-switcher-scroll">
        {panels.map((p) => {
          const active = p.id === activePanelId;
          return (
            <div key={p.id} className={active ? 'panel-pill active' : 'panel-pill'}>
              <button className="panel-pill-label" onClick={() => onSwitch(p.id)}>{p.name || 'নামহীন'}</button>

              {!isReadOnly && canManagePanels && (
                <button className="panel-pill-icon" onClick={() => onRename(p)} title="এডিট করুন" style={{ color: active ? '#fff' : '#1c5fa8', fontWeight: 'bold' }}>
                  <Pencil size={12} /> এডিট
                </button>
              )}

              {!isReadOnly && canManagePanels && panels.length > 1 ? (
                <button
                  className={confirmDeleteId === p.id ? 'panel-pill-icon danger-confirm' : 'panel-pill-icon'}
                  onClick={() => (confirmDeleteId === p.id ? onDelete(p.id) : setConfirmDeleteId(p.id))}
                  title="মুছুন"
                >
                  {confirmDeleteId === p.id ? '✓' : <X size={11} />}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {!isReadOnly && canManagePanels && (
        <button className="btn btn-secondary panel-add-btn" onClick={onAdd}>
          <Plus size={14} /> নতুন দিন
        </button>
      )}
    </div>
  );
}

// ==================================================
// ✅ EditPanel (with one-time doctor section)
// ==================================================
function EditPanel({
  panel, departments, footer, checkedIds, allChecked, onUpdateTitle, onUpdateFooter,
  onUpdatePhone, onAddPhone, onRemovePhone, onAddDept, onEditDept, onDeleteDept,
  onMoveDept, onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctor,
  onToggleDoctorChecked, onToggleDeptAllChecked, onToggleAll, clearConfirm,
  onClearAll, onGoPreview, onShowDoctorLink, offDoctorIds, oneTimeDoctors, onShowOverrideModal,
}) {
  const orderedDepartments = getOrderedDepartments(departments, panel?.departmentOrder);

  return (
    <div className="edit-panel">
      <section className="panel-section">
        <div className="section-header">
          <label>এই দিনের শিরোনাম</label>
          <button className="toggle-all-btn" onClick={onToggleAll}>
            {allChecked ? 'সব বাদ দিন' : 'সব বাছুন'}
          </button>
        </div>
        <p className="section-hint">
          {`প্রতিটি ডাক্তারের পাশের বক্সে টিক দিয়ে বেছে নিন কারা "${panel.name}"-এর পোস্টারে দেখাবে। 🔗 আইকনে ক্লিক করে বুকিং লিংক দেখুন। ⬆️⬇️ দিয়ে এই দিনের জন্য বিভাগের ক্রম ঠিক করুন — অন্য দিনের ক্রম অপরিবর্তিত থাকবে।`}
        </p>
        <input className="input" value={panel.title} onChange={(e) => onUpdateTitle(e.target.value)} placeholder="যেমনঃ শনিবারের ডক্টরস প্যানেল" />
      </section>

      <section className="panel-section">
        <div className="section-header">
          <label>বিভাগ ও ডাক্তার তালিকা — {panel.name}</label>
          <button className="btn btn-primary" onClick={onAddDept}>
            <Plus size={15} /> নতুন বিভাগ
          </button>
        </div>
        <p className="section-hint">
          প্রতিটি ডাক্তারের পাশের বক্সে টিক দিয়ে বেছে নিন কারা &quot;{panel.name}&quot;-এর পোস্টারে দেখাবে। 🔗 আইকনে ক্লিক করে বুকিং লিংক দেখুন। ⬆️⬇️ দিয়ে এই দিনের জন্য বিভাগের ক্রম ঠিক করুন — অন্য দিনের ক্রম অপরিবর্তিত থাকবে।
        </p>
        {departments.length === 0 ? (
          <div className="empty-state">এখনো কোনো বিভাগ যোগ করা হয়নি।</div>
        ) : null}
        {orderedDepartments.map((dept, i) => (
          <DepartmentCard
            key={dept.id}
            dept={dept}
            index={i}
            total={orderedDepartments.length}
            checkedIds={checkedIds}
            onEdit={() => onEditDept(dept)}
            onDelete={() => onDeleteDept(dept.id)}
            onMoveUp={() => onMoveDept(dept.id, -1)}
            onMoveDown={() => onMoveDept(dept.id, 1)}
            onAddDoctor={() => onAddDoctor(dept.id)}
            onEditDoctor={(doc) => onEditDoctor(dept.id, doc)}
            onDeleteDoctor={(docId) => onDeleteDoctor(dept.id, docId)}
            onMoveDoctorUp={(docId) => onMoveDoctor(dept.id, docId, -1)}
            onMoveDoctorDown={(docId) => onMoveDoctor(dept.id, docId, 1)}
            onToggleDoctorChecked={onToggleDoctorChecked}
            onToggleAllChecked={() => onToggleDeptAllChecked(dept.id)}
            onShowDoctorLink={onShowDoctorLink}
            allowDeptDelete={false}
            allowDoctorDelete={false}
            offDoctorIds={offDoctorIds}
          />
        ))}
      </section>

      {/* ✅ One-time doctors section */}
      {oneTimeDoctors.length > 0 && (
        <section className="panel-section" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div className="section-header">
            <label style={{ color: '#0c4a6e' }}>
              ⚡ এই দিনের জন্য অতিরিক্ত ডাক্তার (One-time)
            </label>
            <button className="btn btn-secondary" onClick={onShowOverrideModal} style={{ fontSize: 12 }}>
              ম্যানেজ করুন →
            </button>
          </div>
          <p className="section-hint">
            এই ডাক্তাররা শুধুমাত্র আজকের জন্য যুক্ত হয়েছেন। পার্মানেন্ট শিডিউলে কোনো প্রভাব পড়বে না।
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {oneTimeDoctors.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: '#fff',
                  border: '1px solid #bae6fd', borderRadius: 8,
                }}
              >
                <div className="doctor-thumb" style={{ width: 36, height: 36 }}>
                  {entry.doctorSnapshot?.imageUrl ? (
                    <img src={entry.doctorSnapshot.imageUrl} alt="" />
                  ) : (
                    <span className="placeholder"><User size={18} /></span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0c4a6e' }}>
                    {entry.doctorSnapshot?.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {entry.doctorSnapshot?.deptName || entry.doctorSnapshot?.specialty || ''}
                  </div>
                </div>
                <span style={{
                  background: '#1e40af', color: '#fff',
                  padding: '2px 10px', borderRadius: 10,
                  fontSize: 10.5, fontWeight: 700,
                }}>
                  এই দিনে
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel-section">
        <label>ফুটার তথ্য</label>
        <div className="footer-form-grid">
          <div className="field">
            <label>হাসপাতালের নাম</label>
            <input className="input" value={footer.hospitalName} onChange={(e) => onUpdateFooter({ hospitalName: e.target.value })} />
          </div>
          <div className="field">
            <label>সাবটাইটেল</label>
            <input className="input" value={footer.hospitalSubtitle} onChange={(e) => onUpdateFooter({ hospitalSubtitle: e.target.value })} />
          </div>
          <div className="field">
            <label>ঠিকানা</label>
            <textarea className="textarea" rows={2} value={footer.address} onChange={(e) => onUpdateFooter({ address: e.target.value })} />
          </div>
          <div className="field">
            <label>ওয়েবসাইট</label>
            <input className="input" value={footer.website} onChange={(e) => onUpdateFooter({ website: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>যোগাযোগ লেবেল</label>
            <input className="input" value={footer.contactLabel} onChange={(e) => onUpdateFooter({ contactLabel: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>ফোন নম্বর</label>
            {footer.phones.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input className="input" value={p} onChange={(e) => onUpdatePhone(i, e.target.value)} placeholder="০১৮৮৬ ৭৭৬ ৫১২" />
                <button className="icon-btn" onClick={() => onRemovePhone(i)}><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={onAddPhone}>
              <Plus size={14} /> নম্বর যোগ করুন
            </button>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '30px' }}>
        <button className="btn btn-primary" onClick={onGoPreview} style={{ padding: '12px 28px', fontSize: '14px' }}>
          প্রিভিউ দেখুন →
        </button>
      </div>
    </div>
  );
}

// ==================================================
// ✅ DeptHeader
// ==================================================
function DeptHeader({ dept }) {
  const Icon = ICONS[dept.icon] || ICONS.Stethoscope;
  return (
    <div className="dept-header-wrap">
      <span className="dept-icon-box" style={{ borderColor: dept.color }}>
        <Icon size={19} color={dept.color} />
      </span>
      <div className="dept-ribbon" style={{ background: dept.color }}>
        <span>{dept.name}</span>
      </div>
    </div>
  );
}

// ==================================================
// ✅ PreviewPanel (with chamber OFF + one-time doctors)
// ==================================================
function PreviewPanel({ panel, departments, checkedIds, footer, onBack, user }) {
  const printRef = useRef(null);
  const isAdmin = user?.role === 'admin';
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [offDoctorIds, setOffDoctorIds] = useState(new Set());
  const [oneTimeDoctors, setOneTimeDoctors] = useState([]);
  const today = getBDTodayString();

  // ✅ Subscribe to today's OFF doctors
  useEffect(() => {
    const unsub = subscribeToOffDoctors(
      hospitalId,
      today,
      (ids) => {
        console.log('🎨 [PreviewPanel] Off doctors today:', [...ids]);
        setOffDoctorIds(ids);
      },
      (err) => console.error('❌ [PreviewPanel] Off doctors subscription error:', err)
    );
    return () => unsub();
  }, [hospitalId, today]);

  // ✅ Subscribe to today's one-time doctors
  useEffect(() => {
    const unsub = subscribeToOneTimeDoctors(
      hospitalId,
      today,
      (list) => {
        console.log('🎨 [PreviewPanel] One-time doctors today:', list.length);
        setOneTimeDoctors(list);
      },
      (err) => console.error('❌ [PreviewPanel] One-time doctors subscription error:', err)
    );
    return () => unsub();
  }, [hospitalId, today]);

  // ✅ Subscribe for the panel's day (not today) — if user selects a different panel
  const panelDay = panel?.name || '';
  const isToday = panelDay === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ||
    panelDay === today; // fallback

  const handlePrint = () => {
    if (!isAdmin) {
      alert('❌ শুধুমাত্র অ্যাডমিন প্রিন্ট করতে পারবেন।');
      return;
    }
    window.print();
  };

  const downloadPNG = async () => {
    if (!isAdmin) {
      alert('❌ শুধুমাত্র অ্যাডমিন PNG ডাউনলোড করতে পারবেন।');
      return;
    }
    const element = printRef.current;
    if (!element) return;
    try {
      document.body.classList.add('generating-poster');
      const canvas = await html2canvas(element, {
        scale: 3, useCORS: true, logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: html2canvasIgnoreElements,
      });
      const link = document.createElement('a');
      link.download = `${panel?.title || 'poster'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('PNG download error:', error);
      alert('PNG ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      document.body.classList.remove('generating-poster');
    }
  };

  const downloadPDF = async () => {
    if (!isAdmin) {
      alert('❌ শুধুমাত্র অ্যাডমিন PDF ডাউনলোড করতে পারবেন।');
      return;
    }
    const element = printRef.current;
    if (!element) return;
    try {
      document.body.classList.add('generating-poster');
      const canvas = await html2canvas(element, {
        scale: 3, useCORS: true, logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: html2canvasIgnoreElements,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
      pdf.save(`${panel?.title || 'poster'}.pdf`);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      document.body.classList.remove('generating-poster');
    }
  };

  const hasChecked = checkedIds && checkedIds.size > 0;

  const orderedDepartments = getOrderedDepartments(departments, panel?.departmentOrder);

  // ✅ Merge regular + one-time doctors into departments for display
  const visibleDepartments = (() => {
    // Start with regular departments
    const merged = orderedDepartments
      .map((dept) => ({
        ...dept,
        doctors: (dept.doctors || []).filter((doc) =>
          hasChecked ? checkedIds.has(doc.id) : true
        ),
      }))
      .filter((dept) => dept.doctors.length > 0);

    // ✅ Add one-time doctors as a separate pseudo-department (only for today's panel)
    if (isToday && oneTimeDoctors.length > 0) {
      const oneTimeEntries = oneTimeDoctors
        .filter((entry) => entry.doctorSnapshot)
        .map((entry) => ({
          ...entry.doctorSnapshot,
          id: entry.doctorId,
          isOneTime: true,
        }))
        .filter((doc) => {
          // Skip if already in a regular department
          const inRegular = merged.some((dept) =>
            dept.doctors.some((d) => d.id === doc.id)
          );
          if (inRegular) return false;
          // Skip if not checked (when filter is active)
          if (hasChecked && !checkedIds.has(doc.id)) return false;
          return true;
        });

      if (oneTimeEntries.length > 0) {
        merged.push({
          id: '__one_time__',
          name: '⚡ এই দিনের অতিরিক্ত ডাক্তার',
          color: '#1e40af',
          icon: 'Stethoscope',
          doctors: oneTimeEntries,
        });
      }
    }

    return merged;
  })();

  return (
    <div className="preview-wrap">
      {isAdmin && (
        <div className="preview-toolbar no-print">
          {onBack && (
            <button className="btn btn-outline" onClick={onBack} style={{ marginRight: 'auto' }}>
              <ChevronLeft size={16} /> ব্যাক টু এডিট
            </button>
          )}
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> প্রিন্ট
          </button>
          <button className="btn btn-secondary" onClick={downloadPNG}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>{' '}PNG
          </button>
          <button className="btn btn-secondary" onClick={downloadPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>{' '}PDF
          </button>
        </div>
      )}

      <div id="dpb-print-area" className="poster-page" ref={printRef}>
        <div className="poster-header">
          <h1>{panel?.title || panel?.name || 'ডক্টরস প্যানেল'}</h1>
        </div>

        {visibleDepartments.length === 0 ? (
          <div className="poster-empty-note" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
            {panel?.name || 'এই প্যানেলে'} এর জন্য কোনো ডাক্তার নির্বাচন করা হয়নি।
          </div>
        ) : (
          <div className="poster-body">
            {visibleDepartments.map((dept) => (
              <div className="dept-block" key={dept.id}>
                <DeptHeader dept={dept} />
                {dept.doctors.map((doc) => (
                  <DoctorEntry
                    key={doc.id}
                    doc={doc}
                    accentColor={dept.color}
                    isOffToday={offDoctorIds.has(doc.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="poster-footer">
          <div className="footer-col footer-left">
            <div className="footer-line">
              <MapPin size={20} /> <span>{footer.address}</span>
            </div>
            <div className="footer-line">
              <Globe size={20} /> <span>{footer.website}</span>
            </div>
          </div>
          <div className="footer-col footer-center">
            <img src={footer.logo} alt="Logo" style={{ height: '170px', width: 'auto', objectFit: 'contain' }} />
            <div className="hospital-subtitle">{footer.hospitalSubtitle}</div>
          </div>
          <div className="footer-col footer-right">
            <div className="footer-contact-label">{footer.contactLabel}</div>
            {footer.phones.map((p, i) => (
              <div className="footer-phone" key={i}>
                <Phone size={22} /> {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// ✅ ManageDoctorsView
// ==================================================
function ManageDoctorsView({
  departments, onAddDept, onEditDept, onDeleteDept, onMoveDept,
  onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctor,
  isAdmin, onRefreshData, onShowDoctorLink,
}) {
  return (
    <div className="edit-panel">
      <section className="panel-section">
        <div className="section-header">
          <label>মাস্টার ডাক্তার তালিকা (শুধুমাত্র অ্যাডমিনের জন্য)</label>
          <button className="btn btn-secondary" onClick={onRefreshData}>
            <RefreshCw size={14} /> ডেটা রিফ্রেশ করুন
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={onAddDept}>
              <Plus size={15} /> নতুন বিভাগ
            </button>
          )}
        </div>
        <p className="section-hint">
          ডেটা না দেখালে &quot;ডেটা রিফ্রেশ করুন&quot; বাটনে ক্লিক করুন। 🔗 আইকনে ক্লিক করে ডাক্তারের বুকিং লিংক কপি করুন। 📷 এডিট থেকে ডাক্তারের ছবি যোগ করুন।
        </p>
        {departments.length === 0 ? (
          <div className="empty-state">এখনো কোনো বিভাগ যোগ করা হয়নি বা ডেটা লোড করা যায়নি।</div>
        ) : null}
        {departments.map((dept, i) => (
          <DepartmentCard
            key={dept.id}
            dept={dept}
            index={i}
            total={departments.length}
            checkedIds={new Set()}
            onEdit={() => onEditDept(dept)}
            onDelete={() => onDeleteDept(dept.id)}
            onMoveUp={() => onMoveDept(dept.id, -1)}
            onMoveDown={() => onMoveDept(dept.id, 1)}
            onAddDoctor={() => onAddDoctor(dept.id)}
            onEditDoctor={(doc) => onEditDoctor(dept.id, doc)}
            onDeleteDoctor={(docId) => onDeleteDoctor(dept.id, docId)}
            onMoveDoctorUp={(docId) => onMoveDoctor(dept.id, docId, -1)}
            onMoveDoctorDown={(docId) => onMoveDoctor(dept.id, docId, 1)}
            onToggleDoctorChecked={() => {}}
            onToggleAllChecked={() => {}}
            onShowDoctorLink={onShowDoctorLink}
            allowDeptDelete={isAdmin}
            allowDoctorDelete={isAdmin}
            showCheckbox={false}
            showSelectAll={false}
          />
        ))}
      </section>
    </div>
  );
}

// ==================================================
// ✅ MAIN COMPONENT — DoctorPanelBuilder
// ==================================================
export default function DoctorPanelBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';
  const { user, logout, loading: authLoading } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin';
  const isEditor = user?.role === 'editor';
  const isModerator = user?.role === 'moderator';
  const isViewer = user?.role === 'viewer';
  const isGuest = !user;

  const isRestrictedRole = !!user && RESTRICTED_ROLES.includes(user.role);
  const canManagePanels = !isGuest && !isRestrictedRole;
  const isDoctorLoggedIn = !!user && user.designation === 'Doctor' && !!user.doctorId;

  const path = location.pathname;
  const bookingDoctorMatch = path.match(/^\/booking\/(.+)$/);
  const bookingDoctorId = bookingDoctorMatch ? bookingDoctorMatch[1] : null;

  let activeView;
  if (path === '/') activeView = 'preview';
  else if (bookingDoctorId) activeView = 'booking';
  else activeView = path.substring(1);

  const setActiveView = (view) => {
    if (view === 'preview') navigate('/');
    else navigate(`/${view}`);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [showAuth, setShowAuth] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [activePanelId, setActivePanelId] = useState(null);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [deptModal, setDeptModal] = useState(null);
  const [doctorModal, setDoctorModal] = useState(null);
  const [panelModal, setPanelModal] = useState(null);
  const [linkModalDoctor, setLinkModalDoctor] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const debounceRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ✅ One-time doctors state for EditPanel
  const [oneTimeDoctors, setOneTimeDoctors] = useState([]);

  const handleLogout = () => {
    logout();
    setTimeout(() => window.location.reload(), 100);
  };

  // ==================================================
  // ✅ Load data
  // ==================================================
  useEffect(() => {
    const loadData = async () => {
      const hid = hospitalId || 'alafiyah_main';
      setLoading(true);
      try {
        const deptSnapshot = await getDocs(collection(db, 'hospitals', hid, 'departments'));
        const depts = deptSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setDepartments(depts);

        const panelSnapshot = await getDocs(collection(db, 'hospitals', hid, 'panels'));
        let panelList = panelSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        panelList.sort((a, b) => {
          const ai = DAY_NAMES.indexOf(a.name);
          const bi = DAY_NAMES.indexOf(b.name);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

        const defaultDeptOrder = depts.map((d) => d.id);

        const panelsNeedingMigration = panelList.filter(
          (p) => !p.departmentOrder || p.departmentOrder.length === 0
        );

        if (panelsNeedingMigration.length > 0) {
          await Promise.all(
            panelsNeedingMigration.map((p) =>
              setDoc(
                doc(db, 'hospitals', hid, 'panels', p.id),
                { ...p, departmentOrder: defaultDeptOrder },
                { merge: true }
              ).catch((err) => console.warn('Migration failed for panel', p.id, err))
            )
          );
        }

        panelList = panelList.map((p) => ({
          ...p,
          departmentOrder:
            p.departmentOrder && p.departmentOrder.length > 0
              ? p.departmentOrder
              : defaultDeptOrder,
        }));

        if (panelList.length === 0) {
          const defaultPanel = {
            id: 'শনিবার',
            name: 'শনিবার',
            title: 'শনিবারের ডক্টরস প্যানেল',
            activeDoctorIds: [],
            departmentOrder: defaultDeptOrder,
          };
          await setDoc(doc(db, 'hospitals', hid, 'panels', 'শনিবার'), defaultPanel);
          panelList = [defaultPanel];
        }

        setPanels(panelList);

        const footerRef = doc(db, 'hospitals', hid, 'footer', 'data');
        const footerSnap = await getDoc(footerRef);
        if (footerSnap.exists()) setFooter(footerSnap.data());

        const params = new URLSearchParams(window.location.search);
        let targetDay = params.get('day');
        if (!targetDay) {
          const weekDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
          targetDay = weekDays[new Date().getDay()];
        }

        const activePanel = panelList.find((p) => p.name === targetDay) || panelList[0];
        if (activePanel) {
          setActivePanelId(activePanel.id);
          setCheckedIds(new Set(activePanel.activeDoctorIds || []));
        }
      } catch (error) {
        console.error('❌ ডেটা লোড ত্রুটি:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [hospitalId, reloadKey]);

  // ==================================================
  // ✅ Load branding
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    let mounted = true;

    (async () => {
      try {
        const ref = doc(db, 'hospitals', hospitalId, 'footer', 'data');
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data();
          setBranding({
            name: data.hospitalName || 'আল আফিয়াহ হাসপাতাল',
            logo: data.logo || '/logo.png',
          });
        }
      } catch (err) {
        console.warn('Hospital branding load failed:', err.message);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // ==================================================
  // ✅ Subscribe to today's one-time doctors (for EditPanel)
  // ==================================================
  useEffect(() => {
    if (!hospitalId) return;
    const today = getBDTodayString();
    const unsub = subscribeToOneTimeDoctors(
      hospitalId,
      today,
      (list) => setOneTimeDoctors(list),
      (err) => console.warn('One-time doctors subscription error:', err)
    );
    return () => unsub();
  }, [hospitalId]);

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // ✅ ESC + body scroll lock
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isAdmin || !hospitalId) {
      setAllUsers([]);
      return;
    }
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'hospitals', hospitalId, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, ...data,
            name: data.name || data.displayName || 'নাম নেই',
            designation: data.designation || data.role || '',
          };
        });
        setAllUsers(usersList);
      } catch (error) {
        console.error('❌ ইউজার লোড error:', error);
        setAllUsers([]);
      }
    };
    loadUsers();
  }, [isAdmin, hospitalId]);

  const saveDepartments = async (newDepts) => {
    if (!hospitalId) return;
    try {
      const oldSnapshot = await getDocs(collection(db, 'hospitals', hospitalId, 'departments'));
      const batch = writeBatch(db);
      oldSnapshot.forEach((doc) => batch.delete(doc.ref));
      newDepts.forEach((dept, index) => {
        const { id, ...deptData } = dept;
        const ref = doc(db, 'hospitals', hospitalId, 'departments', id || uid());
        batch.set(ref, { ...deptData, order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error('saveDepartments error:', error);
    }
  };

  const savePanelToFirebase = async (panel) => {
    if (!hospitalId) return;
    try {
      await setDoc(doc(db, 'hospitals', hospitalId, 'panels', panel.id), panel);
    } catch (error) {
      console.error('savePanel error:', error);
    }
  };

  const deletePanelFromFirebase = async (panelId) => {
    if (!hospitalId) return;
    try {
      await deleteDoc(doc(db, 'hospitals', hospitalId, 'panels', panelId));
    } catch (error) {
      console.error('deletePanel error:', error);
    }
  };

  const saveFooter = async (newFooter) => {
    if (!hospitalId) return;
    try {
      await setDoc(doc(db, 'hospitals', hospitalId, 'footer', 'data'), newFooter);
    } catch (error) {
      console.error('saveFooter error:', error);
    }
  };

  const activePanel =
    panels.find((p) => p.id === activePanelId) ||
    (panels.length > 0 ? panels[0] : {
      id: 'empty', name: 'কোনো প্যানেল নেই', title: 'প্যানেল তৈরি করুন',
      activeDoctorIds: [], departmentOrder: [],
    });

  const allDoctorIds = departments.flatMap((d) => d.doctors?.map((doc) => doc.id) || []);
  const allChecked = allDoctorIds.length > 0 && allDoctorIds.every((id) => checkedIds.has(id));

  const handleApprove = async (userId) => {
    if (!hospitalId) return;
    try {
      await updateDoc(doc(db, 'hospitals', hospitalId, 'users', userId), { approved: true });
      setAllUsers((users) => users.map((u) => (u.id === userId ? { ...u, approved: true } : u)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetRole = async (userId, role) => {
    if (!hospitalId) return;
    try {
      await updateDoc(doc(db, 'hospitals', hospitalId, 'users', userId), { role });
      setAllUsers((users) => users.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!hospitalId) return;
    try {
      await deleteDoc(doc(db, 'hospitals', hospitalId, 'users', userId));
      setAllUsers((users) => users.filter((u) => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const updatePanel = (updater, immediate) => {
    const updated = updater(activePanel);
    const newPanels = panels.map((p) => (p.id === activePanelId ? updated : p));
    setPanels(newPanels);

    if (immediate) {
      setSaveStatus('saving');
      savePanelToFirebase(updated).then(() => setSaveStatus('saved')).catch(() => setSaveStatus('error'));
      setTimeout(() => setSaveStatus('idle'), 1500);
    } else {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        savePanelToFirebase(updated).then(() => setSaveStatus('saved')).catch(() => setSaveStatus('error'));
        setTimeout(() => setSaveStatus('idle'), 1500);
      }, 700);
    }
  };

  const updateDepartments = (updater, immediate) => {
    const newDepts = updater(departments);
    setDepartments(newDepts);

    if (immediate) {
      saveDepartments(newDepts);
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveDepartments(newDepts), 700);
    }
  };

  const handleUpdateTitle = (title) => updatePanel((p) => ({ ...p, title }), true);

  const handleUpdateFooter = (changes) => {
    const newFooter = { ...footer, ...changes };
    setFooter(newFooter);
    saveFooter(newFooter);
  };

  const handleUpdatePhone = (idx, value) => {
    const phones = [...footer.phones];
    phones[idx] = value;
    handleUpdateFooter({ phones });
  };

  const handleAddPhone = () => handleUpdateFooter({ phones: [...footer.phones, ''] });

  const handleRemovePhone = (idx) =>
    handleUpdateFooter({ phones: footer.phones.filter((_, i) => i !== idx) });

  const handleAddDept = () => setDeptModal({ mode: 'add' });
  const handleEditDept = (dept) => setDeptModal({ mode: 'edit', dept });

  const handleSaveDept = (fields) => {
    if (deptModal.mode === 'add') {
      const newDept = makeDepartment(fields);
      updateDepartments((d) => [...d, newDept], true);

      const newPanels = panels.map((p) => ({
        ...p,
        departmentOrder: [...(p.departmentOrder || []), newDept.id],
      }));
      setPanels(newPanels);
      newPanels.forEach((p) => savePanelToFirebase(p));
    } else {
      const deptId = deptModal.dept.id;
      updateDepartments(
        (d) => d.map((dept) => (dept.id === deptId ? { ...dept, ...fields } : dept)),
        true
      );
    }
    setDeptModal(null);
  };

  const handleDeleteDept = (deptId) => {
    const removedIds = departments.find((d) => d.id === deptId)?.doctors?.map((doc) => doc.id) || [];
    updateDepartments((d) => d.filter((dept) => dept.id !== deptId), true);

    const newPanels = panels.map((p) => ({
      ...p,
      activeDoctorIds: (p.activeDoctorIds || []).filter((id) => !removedIds.includes(id)),
      departmentOrder: (p.departmentOrder || []).filter((id) => id !== deptId),
    }));
    setPanels(newPanels);
    newPanels.forEach((p) => savePanelToFirebase(p));
  };

  // ✅ FIXED: Robust Department move logic
  const handleMoveDept = (deptId, dir) => {
    // বর্তমান প্যানেলের অর্ডার নিন, যদি খালি থাকে তবে ডিফল্ট অর্ডার নিন
    let currentOrder =
      activePanel.departmentOrder && activePanel.departmentOrder.length > 0
        ? [...activePanel.departmentOrder]
        : departments.map((d) => d.id);

    // যদি কোনো কারণে ডিপার্টমেন্ট লিস্টে নতুন ডিপার্টমেন্ট যুক্ত হয়ে departmentOrder-এ না থাকে, তবে সেগুলো অ্যাড করুন
    departments.forEach((d) => {
      if (!currentOrder.includes(d.id)) {
        currentOrder.push(d.id);
      }
    });

    const idx = currentOrder.indexOf(deptId);
    if (idx === -1) return;
    
    const ni = idx + dir;
    if (ni < 0 || ni >= currentOrder.length) return;

    // Swap positions
    [currentOrder[idx], currentOrder[ni]] = [currentOrder[ni], currentOrder[idx]];
    
    // Update panel immediately
    updatePanel((p) => ({ ...p, departmentOrder: currentOrder }), true);
  };

  const handleAddDoctor = (deptId) => setDoctorModal({ deptId, mode: 'add' });
  const handleEditDoctor = (deptId, doctor) => setDoctorModal({ deptId, mode: 'edit', doctor });

  const handleSaveDoctor = (fields) => {
    const deptId = doctorModal.deptId;

    if (doctorModal.mode === 'add') {
      const newDoctor = makeDoctor(fields);
      const updatedDepts = departments.map((dept) =>
        dept.id === deptId ? { ...dept, doctors: [...(dept.doctors || []), newDoctor] } : dept
      );
      setDepartments(updatedDepts);
      saveDepartments(updatedDepts);

      const newPanels = panels.map((p) =>
        p.id === activePanelId
          ? { ...p, activeDoctorIds: [...(p.activeDoctorIds || []), newDoctor.id] }
          : p
      );
      setPanels(newPanels);
      newPanels.forEach((p) => savePanelToFirebase(p));
      setCheckedIds((prev) => new Set([...prev, newDoctor.id]));
    } else {
      const doctorId = doctorModal.doctor.id;
      const updatedDepts = departments.map((dept) =>
        dept.id === deptId
          ? {
              ...dept,
              doctors: dept.doctors.map((doc) =>
                doc.id === doctorId ? { ...doc, ...fields } : doc
              ),
            }
          : dept
      );
      setDepartments(updatedDepts);
      saveDepartments(updatedDepts);
    }
    setDoctorModal(null);
  };

  const handleDeleteDoctor = (deptId, doctorId) => {
    const updatedDepts = departments.map((dept) =>
      dept.id === deptId
        ? { ...dept, doctors: dept.doctors.filter((doc) => doc.id !== doctorId) }
        : dept
    );
    setDepartments(updatedDepts);
    saveDepartments(updatedDepts);

    const newPanels = panels.map((p) => ({
      ...p,
      activeDoctorIds: (p.activeDoctorIds || []).filter((id) => id !== doctorId),
    }));
    setPanels(newPanels);
    newPanels.forEach((p) => savePanelToFirebase(p));

    setCheckedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(doctorId);
      return newSet;
    });
  };

  const handleMoveDoctor = (deptId, doctorId, dir) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    const idx = dept.doctors.findIndex((doc) => doc.id === doctorId);
    const ni = idx + dir;
    if (ni < 0 || ni >= dept.doctors.length) return;

    const newDepts = departments.map((d) => {
      if (d.id !== deptId) return d;
      const newDoctors = [...d.doctors];
      [newDoctors[idx], newDoctors[ni]] = [newDoctors[ni], newDoctors[idx]];
      return { ...d, doctors: newDoctors };
    });
    updateDepartments(() => newDepts, true);
  };

  const handleToggleDoctorChecked = (doctorId) => {
    const newIds = checkedIds.has(doctorId)
      ? [...checkedIds].filter((id) => id !== doctorId)
      : [...checkedIds, doctorId];
    setCheckedIds(new Set(newIds));
    updatePanel((p) => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleToggleDeptAllChecked = (deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;

    const deptIds = dept.doctors.map((doc) => doc.id);
    const allCheckedDept = deptIds.every((id) => checkedIds.has(id));

    let newIds;
    if (allCheckedDept) newIds = [...checkedIds].filter((id) => !deptIds.includes(id));
    else newIds = [...checkedIds].filter((id) => !deptIds.includes(id)).concat(deptIds);

    setCheckedIds(new Set(newIds));
    updatePanel((p) => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleToggleAll = () => {
    let newIds;
    if (allChecked) newIds = [];
    else newIds = allDoctorIds;
    setCheckedIds(new Set(newIds));
    updatePanel((p) => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleSwitchPanel = (panelId) => {
    const panel = panels.find((p) => p.id === panelId);
    if (panel) {
      setActivePanelId(panelId);
      setCheckedIds(new Set(panel.activeDoctorIds || []));
    }
  };

  const handleAddPanel = async (fields) => {
    const defaultDeptOrder = departments.map((d) => d.id);
    const newPanel = {
      id: fields.name,
      name: fields.name,
      title: fields.title,
      activeDoctorIds: fields.duplicate
        ? [...(activePanel.activeDoctorIds || [])]
        : fields.selectedIds || [],
      departmentOrder: fields.duplicate
        ? [...(activePanel.departmentOrder || defaultDeptOrder)]
        : defaultDeptOrder,
    };

    await savePanelToFirebase(newPanel);
    setPanels([...panels, newPanel]);
    setActivePanelId(newPanel.id);
    setCheckedIds(new Set(newPanel.activeDoctorIds));
    setPanelModal(null);
  };

  const handleRenamePanel = (fields) => {
    const panelId = panelModal.panel.id;
    const updated = panels.map((p) => (p.id === panelId ? { ...p, name: fields.name } : p));
    setPanels(updated);
    savePanelToFirebase(updated.find((p) => p.id === panelId));
    setPanelModal(null);
  };

  const handleDeletePanel = async (panelId) => {
    if (panels.length <= 1) return;
    await deletePanelFromFirebase(panelId);
    const remaining = panels.filter((p) => p.id !== panelId);
    setPanels(remaining);
    if (activePanelId === panelId) {
      setActivePanelId(remaining[0].id);
      setCheckedIds(new Set(remaining[0].activeDoctorIds || []));
    }
  };

  const handleSavePanel = (fields) => {
    if (panelModal.mode === 'add') handleAddPanel(fields);
    else handleRenamePanel(fields);
  };

  const handleRefreshData = () => setReloadKey((prev) => prev + 1);

  const handleShowDoctorLink = (doctor) => {
    setLinkModalDoctor(doctor);
  };

  const getIsAuthorized = () => {
    if (path === '/' || path === '/booking' || path === '/display' || path === '/preview' || path === '/login') return true;
    if (path === '/mou' || path.startsWith('/mou/')) return !!user;
    if (bookingDoctorId) return true;
    if (path === '/edit' && (isEditor || isModerator || isSubAdmin || isAdmin)) return true;
    if (path === '/doctors' && (isSubAdmin || isAdmin)) return true;
    if (path === '/dashboard' && (isEditor || isModerator || isSubAdmin || isAdmin)) return true;
    if (path === '/admin' && isAdmin) return true;
    return false;
  };

  if (authLoading) {
    return (<><style>{CSS}</style><AppShellSkeleton /></>);
  }

  if (loading) {
    return (<><style>{CSS}</style><AppShellSkeleton /></>);
  }

  if (path === '/login') {
    if (user) return <Navigate to="/my-bookings" replace />;
    return (
      <div className="dpb">
        <style>{CSS}</style>
        <AuthPage onClose={() => navigate('/')} />
      </div>
    );
  }

  if (!getIsAuthorized()) return <NotFoundPage />;

  const isDirectBookingView = !!bookingDoctorId;

  return (
    <div className="dpb">
      <style>{CSS}</style>

      {!isDirectBookingView && (
        <Header
          branding={branding}
          user={user}
          isGuest={isGuest}
          isAdmin={isAdmin}
          isSubAdmin={isSubAdmin}
          isEditor={isEditor}
          isModerator={isModerator}
          isDoctorLoggedIn={isDoctorLoggedIn}
          activeView={activeView}
          onSetView={setActiveView}
          onGoLogin={() => navigate('/login')}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
          onGoDoctorDashboard={() => navigate('/doctor')}
          onGoMyBookings={() => navigate('/my-bookings')}
          onGoMou={() => navigate('/mou')}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onShowOverrideModal={() => setShowOverrideModal(true)}
        />
      )}

      {!isDirectBookingView && (activeView === 'preview' || activeView === 'edit') && (
        <PanelSwitcher
          panels={panels}
          activePanelId={activePanelId}
          onSwitch={handleSwitchPanel}
          onAdd={canManagePanels ? () => setPanelModal({ mode: 'add', departments }) : () => {}}
          onRename={canManagePanels ? (panel) => setPanelModal({ mode: 'rename', panel }) : () => {}}
          onDelete={isAdmin ? handleDeletePanel : () => {}}
          isReadOnly={isGuest}
          canManagePanels={canManagePanels}
        />
      )}

      {activeView === 'booking' && (
        <BookingSystem
          departments={departments}
          panels={panels}
          preselectedDoctorId={bookingDoctorId}
          onBack={() => {
            if (bookingDoctorId) navigate('/');
            else setActiveView('preview');
          }}
        />
      )}

      {activeView === 'preview' && (
        <PreviewPanel
          panel={activePanel}
          departments={departments}
          checkedIds={checkedIds}
          footer={footer}
          user={user}
        />
      )}

      {activeView === 'edit' && !isGuest && (isEditor || isModerator || isSubAdmin || isAdmin) && (
        <EditPanel
          panel={activePanel}
          departments={departments}
          footer={footer}
          checkedIds={checkedIds}
          allChecked={allChecked}
          onUpdateTitle={handleUpdateTitle}
          onUpdateFooter={handleUpdateFooter}
          onUpdatePhone={handleUpdatePhone}
          onAddPhone={handleAddPhone}
          onRemovePhone={handleRemovePhone}
          onAddDept={handleAddDept}
          onEditDept={handleEditDept}
          onDeleteDept={isAdmin ? handleDeleteDept : () => {}}
          onMoveDept={handleMoveDept}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={() => {}}
          onMoveDoctor={handleMoveDoctor}
          onToggleDoctorChecked={handleToggleDoctorChecked}
          onToggleDeptAllChecked={handleToggleDeptAllChecked}
          onToggleAll={handleToggleAll}
          clearConfirm={clearConfirm}
          onClearAll={() => {}}
          onGoPreview={() => setActiveView('preview')}
          onShowDoctorLink={handleShowDoctorLink}
          oneTimeDoctors={oneTimeDoctors}
          onShowOverrideModal={() => setShowOverrideModal(true)}
        />
      )}

      {activeView === 'doctors' && (isSubAdmin || isAdmin) && (
        <ManageDoctorsView
          departments={departments}
          onAddDept={handleAddDept}
          onEditDept={handleEditDept}
          onDeleteDept={handleDeleteDept}
          onMoveDept={handleMoveDept}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onMoveDoctor={handleMoveDoctor}
          isAdmin={isAdmin}
          onRefreshData={handleRefreshData}
          onShowDoctorLink={handleShowDoctorLink}
        />
      )}

      {activeView === 'admin' && isAdmin && (
        <AdminPanel
          users={allUsers}
          onApprove={handleApprove}
          onSetRole={handleSetRole}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {activeView === 'dashboard' && (isEditor || isModerator || isSubAdmin || isAdmin) && (
        <AdminDashboard user={user} />
      )}

      {activeView === 'mou' && (
        <Suspense
          fallback={
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="spin" />
              <p style={{ marginTop: 12, fontSize: 14 }}>MOU লোড হচ্ছে...</p>
            </div>
          }
        >
          <MoUClientManager user={user} />
        </Suspense>
      )}

      {showAuth && <AuthPage onClose={() => setShowAuth(false)} />}

      {deptModal && (
        <DepartmentModal
          initial={deptModal.mode === 'edit' ? deptModal.dept : null}
          onSave={handleSaveDept}
          onClose={() => setDeptModal(null)}
        />
      )}

      {doctorModal && (
        <DoctorModal
          initial={doctorModal.mode === 'edit' ? doctorModal.doctor : null}
          onSave={handleSaveDoctor}
          onClose={() => setDoctorModal(null)}
        />
      )}

      {panelModal && (
        <PanelModal
          mode={panelModal.mode}
          initial={panelModal.mode === 'rename' ? panelModal.panel : null}
          activeDeptCount={activePanel.activeDoctorIds?.length || 0}
          departments={departments}
          onSave={handleSavePanel}
          onClose={() => setPanelModal(null)}
        />
      )}

      {linkModalDoctor && (
        <DoctorLinkModal
          doctor={linkModalDoctor}
          onClose={() => setLinkModalDoctor(null)}
        />
      )}

      {showOverrideModal && (
        <DoctorOverrideModal
          departments={departments}
          onClose={() => setShowOverrideModal(false)}
        />
      )}
    </div>
  );
}