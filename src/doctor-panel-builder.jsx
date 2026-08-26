import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Ear, Trash2, Pencil, Printer, X, ChevronUp, ChevronDown, MapPin, Globe, Phone, Loader2,
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer, LogOut,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db, doc, getDoc, setDoc, getDocs, collection, deleteDoc } from './firebase';

// ===================== CONSTANTS =====================
const uid = () => Math.random().toString(36).slice(2, 10);
const DAY_NAMES = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

function titleForName(name) {
  return DAY_NAMES.indexOf(name) !== -1 ? name + 'ের ডক্টরস প্যানেল' : name;
}

const ICONS = {
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer, Ear,
};
const ICON_KEYS = Object.keys(ICONS);

const COLOR_THEMES = [
  '#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3',
  '#e0653a', '#2b3f8f', '#159a72', '#8a6a2e', '#7a2d5c',
  '#4438ab', '#475569',
];

function makeDoctor(overrides) {
  return { id: uid(), name: '', quals: '', specialty: '', workplace: '', time: '', ...(overrides || {}) };
}

function makeDepartment(overrides) {
  return { id: uid(), name: '', icon: 'Stethoscope', color: COLOR_THEMES[0], doctors: [], ...(overrides || {}) };
}

const DEFAULT_FOOTER = {
  address: 'বাকলিয়া এক্সেস রোড,\nবাকলিয়া, চট্টগ্রাম।',
  website: 'alafiyahhospital.com',
  logo: '/logo.png',
  contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
  phones: ['01886 776 512', '01886 776 513'],
};

// ===================== CSS =====================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');

.dpb{font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;background:#f4f6fa;color:#1f2937;min-height:100vh;}
.dpb *{box-sizing:border-box;}
.dpb h1,.dpb h2,.dpb h3,.dpb p{margin:0;padding:0;}
.dpb button{font-family:inherit;cursor:pointer;}

.dpb .topbar{display:flex;align-items:center;justify-content:space-between;background:#ffffff;border-bottom:1px solid #e2e6ee;padding:14px 20px;position:sticky;top:0;z-index:20;flex-wrap:wrap;gap:10px;}
.dpb .topbar-title{display:flex;align-items:center;gap:8px;font-weight:700;font-size:17px;color:#154a82;}
.dpb .topbar-right{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.dpb .save-indicator{font-size:12.5px;color:#6b7280;white-space:nowrap;}
.dpb .logout-btn{background:#dc2626;color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;cursor:pointer;}
.dpb .tabs{display:flex;background:#eef1f7;border-radius:10px;padding:3px;gap:2px;}
.dpb .tab{border:none;background:transparent;padding:8px 16px;border-radius:8px;font-size:13.5px;font-weight:600;color:#6b7280;}
.dpb .tab.active{background:#1c5fa8;color:#fff;}

.dpb .panel-switcher{display:flex;align-items:center;gap:10px;padding:10px 20px;background:#fff;border-bottom:1px solid #e2e6ee;flex-wrap:wrap;position:sticky;top:57px;z-index:19;}
.dpb .panel-switcher-scroll{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0;}
.dpb .panel-pill{display:flex;align-items:center;border:1px solid #e2e6ee;background:#fff;padding:4px 8px;border-radius:20px;font-size:13px;font-weight:600;color:#1f2937;cursor:pointer;transition:all 0.2s;gap:4px;}
.dpb .panel-pill:hover{border-color:#1c5fa8;color:#1c5fa8;}
.dpb .panel-pill.active{background:#1c5fa8;color:#fff;border-color:#1c5fa8;}
.dpb .panel-pill-label{background:transparent;border:none;font-weight:600;font-size:13px;color:inherit;cursor:pointer;}
.dpb .panel-pill-icon{background:transparent;border:none;display:flex;align-items:center;gap:2px;color:inherit;cursor:pointer;font-size:11px;font-weight:600;padding:2px 4px;border-radius:8px;}
.dpb .panel-pill-icon:hover{background:rgba(28,95,168,0.15);}
.dpb .panel-pill-icon.danger-confirm{color:#dc2626;font-weight:700;}
.dpb .panel-add-btn{padding:6px 12px;font-size:12.5px;}

.dpb .loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:10px;color:#6b7280;}
.dpb .spin{animation:dpb-spin 1s linear infinite;}
@keyframes dpb-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.dpb .edit-panel{max-width:880px;margin:0 auto;padding:20px;display:flex;flex-direction:column;gap:18px;}
.dpb .panel-section{background:#fff;border:1px solid #e2e6ee;border-radius:14px;padding:18px 20px;}
.dpb .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
.dpb .panel-section > label{font-weight:700;font-size:14.5px;color:#1f2937;display:block;}
.dpb .section-header label{font-weight:700;font-size:14.5px;color:#1f2937;}
.dpb .section-hint{font-size:12.5px;color:#6b7280;margin:4px 0 10px;}

.dpb .day-buttons{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 10px;}
.dpb .day-btn{border:1px solid #e2e6ee;background:#fff;padding:6px 12px;border-radius:20px;font-size:12.5px;color:#1f2937;}
.dpb .day-btn:hover{border-color:#1c5fa8;color:#1c5fa8;}

.dpb .input,.dpb .textarea{width:100%;border:1px solid #e2e6ee;border-radius:9px;padding:9px 12px;font-size:14px;font-family:inherit;color:#1f2937;background:#fff;}
.dpb .input:focus,.dpb .textarea:focus{outline:none;border-color:#1c5fa8;box-shadow:0 0 0 3px rgba(28,95,168,0.14);}
.dpb .textarea{resize:vertical;line-height:1.5;}
.dpb .field{margin-bottom:12px;}
.dpb .field label,.dpb .modal-body label{display:block;font-size:12.5px;font-weight:600;color:#6b7280;margin:0 0 5px;}

.dpb .checkbox-row{display:flex;align-items:center;gap:8px;font-size:13px;color:#1f2937;cursor:pointer;font-weight:500;}
.dpb .checkbox-row input{width:16px;height:16px;cursor:pointer;flex-shrink:0;}

.dpb .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 14px;font-size:13.5px;font-weight:600;white-space:nowrap;}
.dpb .btn-primary{background:#1c5fa8;color:#fff;}
.dpb .btn-primary:hover{background:#154a82;}
.dpb .btn-primary:disabled{background:#b9c9dd;cursor:not-allowed;}
.dpb .btn-secondary{background:#eef1f7;color:#1f2937;}
.dpb .btn-secondary:hover{background:#e2e6ee;}
.dpb .btn-danger{background:#dc2626;color:#fff;}
.dpb .btn-outline{background:#fff;border:1px solid #e2e6ee;color:#1f2937;}
.dpb .toggle-all-btn{background:#1c5fa8;color:#fff;border:none;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;cursor:pointer;}
.dpb .toggle-all-btn:hover{background:#154a82;}
.dpb .dept-toggle-btn{background:transparent;border:1px solid #1c5fa8;color:#1c5fa8;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;cursor:pointer;}
.dpb .dept-toggle-btn:hover{background:#eaf2fb;}

.dpb .dept-card{border:1px solid #e2e6ee;border-left:5px solid #ccc;border-radius:12px;margin-bottom:14px;overflow:hidden;}
.dpb .dept-card-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fafbfd;flex-wrap:wrap;gap:8px;}
.dpb .dept-card-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.dpb .dept-card-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dpb .dept-card-title strong{font-size:14.5px;}
.dpb .dept-doctor-count{font-size:11.5px;color:#6b7280;background:#eef1f7;padding:2px 8px;border-radius:20px;}
.dpb .dept-card-actions{display:flex;gap:4px;}
.dpb .icon-btn{background:transparent;border:1px solid transparent;border-radius:7px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:#6b7280;flex-shrink:0;}
.dpb .icon-btn:hover{background:#eef1f7;color:#1f2937;}
.dpb .icon-btn:disabled{opacity:0.35;cursor:not-allowed;}
.dpb .icon-btn.danger-confirm{background:#dc2626;color:#fff;width:auto;padding:0 10px;font-size:11px;font-weight:700;}

.dpb .doctor-mini-list{padding:4px 14px 12px;}
.dpb .doctor-row{display:flex;align-items:center;justify-content:space-between;padding:9px 4px;border-top:1px dashed #e2e6ee;gap:10px;}
.dpb .doctor-checkbox{width:18px;height:18px;flex-shrink:0;cursor:pointer;accent-color:#1c5fa8;margin-right:4px;}
.dpb .doctor-row-info{min-width:0;flex:1;}
.dpb .doctor-row-name{font-size:16px;font-weight:700;color:#1f2937;}
.dpb .doctor-row-specialty{font-size:12px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;}
.dpb .doctor-row-actions{display:flex;gap:2px;flex-shrink:0;}
.dpb .add-doctor-btn{display:flex;align-items:center;gap:6px;width:100%;justify-content:center;border:1.5px dashed #e2e6ee;background:transparent;border-radius:9px;padding:8px;font-size:12.5px;color:#6b7280;margin-top:6px;}
.dpb .add-doctor-btn:hover{border-color:#1c5fa8;color:#1c5fa8;}

.dpb .empty-state{text-align:center;color:#6b7280;font-size:13px;padding:20px;}

.dpb .footer-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
@media (max-width:600px){.dpb .footer-form-grid{grid-template-columns:1fr;}}

.dpb .danger-zone{border:1px dashed #f0b4b4;background:#fff8f8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.dpb .danger-zone-title{font-weight:700;font-size:13.5px;margin-bottom:2px;}
.dpb .danger-zone-text{font-size:12.5px;color:#8a3a3a;}

.dpb .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;}
.dpb .modal-box{background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;}
.dpb .modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e6ee;}
.dpb .modal-header h3{font-size:16px;}
.dpb .modal-body{padding:16px 20px;overflow-y:auto;}
.dpb .modal-footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e2e6ee;}

.dpb .icon-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}
.dpb .icon-choice{border:1.5px solid #e2e6ee;background:#fff;border-radius:9px;height:36px;display:flex;align-items:center;justify-content:center;}
.dpb .color-grid{display:flex;flex-wrap:wrap;gap:8px;}
.dpb .color-choice{width:30px;height:30px;border-radius:50%;border:2px solid transparent;padding:0;}
.dpb .color-choice.selected{border-color:#1f2937;box-shadow:0 0 0 2px #fff inset;}

.dpb .preview-wrap{max-width:1000px;margin:0 auto;padding:20px;}
.dpb .preview-toolbar{display:flex;justify-content:flex-end;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.dpb .preview-toolbar .btn{font-size:13px;padding:8px 16px;}
.dpb .poster-page{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 18px rgba(15,23,42,0.08);border:1px solid #e2e6ee;}
.dpb .poster-header{background:linear-gradient(120deg,#4fa3d1,#1c5fa8);padding:22px 20px;text-align:center;}
.dpb .poster-header h1{color:#fff;font-size:26px;font-weight:800;letter-spacing:0.3px;}

.dpb .poster-body{column-count:3;column-gap:26px;padding:22px; text-align: left;}
@media (max-width:820px){.dpb .poster-body{column-count:2;}}
@media (max-width:560px){.dpb .poster-body{column-count:1;}}

.dpb .dept-block{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;margin-bottom:20px;display:inline-block;width:100%;}

.dpb .dept-header-wrap{display:flex;align-items:center;margin-bottom:10px;}
.dpb .dept-icon-box{width:34px;height:34px;background:#fff;border:2px solid;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.15);}
.dpb .dept-ribbon{flex:1;margin-left:-12px;padding:7px 14px 7px 22px;color:#fff;font-weight:700;font-size:13.5px;clip-path:polygon(0 0,94% 0,100% 50%,94% 100%,0 100%);min-height:34px;display:flex;align-items:center;}

.dpb .doctor-entry{margin-bottom:13px;padding:1px 0 1px 10px;border-left:3px solid #ccc; text-align: left;}
.dpb .doctor-name{color:#1c5fa8;font-weight:700;font-size:22px;margin-bottom:1px;}
.dpb .doctor-quals{color:#333;font-size:12px;line-height:1.45;white-space:pre-line;}
.dpb .doctor-specialty{color:#9c2a7e;font-weight:700;font-size:15px;white-space:pre-line;margin-top:2px;}
.dpb .doctor-workplace{color:#333;font-size:12px;line-height:1.4;white-space:pre-line;margin-top:1px;}
.dpb .doctor-time{color:#333; font-size:13px;}
.dpb .doctor-time strong{color:#111;}
.dpb .empty-dept-note{font-size:11.5px;color:#6b7280;font-style:italic;}

.dpb .poster-footer{display:flex;align-items:center;justify-content:space-between;background:#eef4fb;padding:16px 22px;flex-wrap:wrap;gap:14px;border-top:3px solid #1c5fa8;}
.dpb .footer-col{display:flex;flex-direction:column;gap:5px;font-size:11.5px;color:#333;}
.dpb .footer-line{display:flex;align-items:center;gap:6px;white-space:pre-line; font-size:16px;}
.dpb .footer-center{align-items:center;text-align:center;}
.dpb .hospital-name{font-size:19px;font-weight:800;color:#1c5fa8;letter-spacing:0.5px;}
.dpb .hospital-subtitle{font-size:20.5px;color:#555;font-weight:600;letter-spacing:0.5px;}
.dpb .footer-right{align-items:flex-end;text-align:right;}
.dpb .footer-contact-label{font-weight:700;color:#1c5fa8;font-size:16px;}
.dpb .footer-phone{display:flex;align-items:center;gap:6px;font-weight:700; font-size:20px;}

.dpb .doctor-entry,
.dpb .doctor-row,
.dpb .doctor-name,
.dpb .doctor-quals,
.dpb .doctor-specialty,
.dpb .doctor-workplace,
.dpb .doctor-time,
.dpb .doctor-row-name,
.dpb .doctor-row-specialty {
  text-align: left !important;
}

@media print{
  .no-print{display:none !important;}
  .dpb{background:#fff;}
  .dpb .preview-wrap{max-width:100%;padding:0;margin:0;}
  .dpb .poster-page{box-shadow:none;border:none;border-radius:0;}
  .dpb .poster-body{column-count:3 !important;}
  .dpb *{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}
}
@page{margin:10mm;}

/* ---------- Login Page CSS ---------- */
.dpb-login{display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f6fa;}
.dpb-login-box{background:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);width:100%;max-width:400px;}
.dpb-login-box h2{color:#1c5fa8;text-align:center;margin-bottom:20px;}
.dpb-login-box input{width:100%;padding:10px;margin-bottom:12px;border:1px solid #e2e6ee;border-radius:8px;font-size:14px;}
.dpb-login-box button{width:100%;padding:10px;background:#1c5fa8;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;}
.dpb-login-box button:hover{background:#154a82;}
.dpb-login-error{color:#dc2626;font-size:13px;margin-bottom:10px;text-align:center;}
`;

// ===================== SAVE INDICATOR =====================
function SaveIndicator({ status }) {
  if (status === 'idle') return null;
  const text = status === 'saving' ? 'সংরক্ষণ হচ্ছে...' : status === 'saved' ? '✓ সংরক্ষিত হয়েছে' : 'সংরক্ষণ ব্যর্থ হয়েছে';
  return <span className="save-indicator">{text}</span>;
}

// ===================== LOGIN COMPONENT =====================
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'viewer', password: 'viewer123', role: 'viewer' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      setError('');
      onLogin(found);
    } else {
      setError('ভুল ইউজারনেম অথবা পাসওয়ার্ড!');
    }
  };

  return (
    <div className="dpb-login">
      <div className="dpb-login-box">
        <h2>ডাক্তার প্যানেল লগইন</h2>
        {error && <div className="dpb-login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="ইউজারনেম" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">লগইন করুন</button>
        </form>
      </div>
    </div>
  );
}

// ===================== DoctorRow =====================
function DoctorRow({ doc, index, total, checked, onToggleChecked, onEdit, onDelete, onMoveUp, onMoveDown, allowDelete = true }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="doctor-row">
      <input 
        type="checkbox" 
        className="doctor-checkbox" 
        checked={checked} 
        onChange={onToggleChecked} 
        title="প্রিভিউতে দেখাতে টিক দিন" 
      />
      <div className="doctor-row-info">
        <div className="doctor-row-name">{doc.name || 'নামহীন ডাক্তার'}</div>
        {doc.specialty ? <div className="doctor-row-specialty">{doc.specialty}</div> : null}
      </div>
      <div className="doctor-row-actions">
        <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান"><ChevronUp size={14} /></button>
        <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান"><ChevronDown size={14} /></button>
        <button className="icon-btn" onClick={onEdit} title="সম্পাদনা"><Pencil size={14} /></button>
        
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

// ===================== DepartmentCard =====================
function DepartmentCard({ dept, index, total, checkedIds, onEdit, onDelete, onMoveUp, onMoveDown, onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctorUp, onMoveDoctorDown, onToggleDoctorChecked, onToggleAllChecked, allowDeptDelete = true, allowDoctorDelete = true }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const Icon = ICONS[dept.icon] || ICONS.Stethoscope;
  const deptDoctorIds = dept.doctors.map(doc => doc.id);
  const allChecked = deptDoctorIds.length > 0 && deptDoctorIds.every(id => checkedIds.has(id));

  return (
    <div className="dept-card" style={{ borderLeftColor: dept.color }}>
      <div className="dept-card-header">
        <div className="dept-card-title">
          <span className="dept-card-icon" style={{ background: dept.color }}>
            <Icon size={15} color="#fff" />
          </span>
          <strong>{dept.name || 'নামহীন বিভাগ'}</strong>
          <span className="dept-doctor-count">{dept.doctors.length} জন ডাক্তার</span>
          {dept.doctors.length > 0 && (
            <button className="dept-toggle-btn" onClick={onToggleAllChecked}>
              {allChecked ? 'সব বাদ দিন' : 'সব বাছুন'}
            </button>
          )}
        </div>
        <div className="dept-card-actions">
          <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান"><ChevronUp size={16} /></button>
          <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান"><ChevronDown size={16} /></button>
          <button className="icon-btn" onClick={onEdit} title="সম্পাদনা"><Pencil size={16} /></button>
          
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
        {dept.doctors.map((doc, di) => (
          <DoctorRow
            key={doc.id}
            doc={doc}
            index={di}
            total={dept.doctors.length}
            checked={checkedIds.has(doc.id)}
            onToggleChecked={() => onToggleDoctorChecked(doc.id)}
            onEdit={() => onEditDoctor(doc)}
            onDelete={() => onDeleteDoctor(doc.id)}
            onMoveUp={() => onMoveDoctorUp(doc.id)}
            onMoveDown={() => onMoveDoctorDown(doc.id)}
            allowDelete={allowDoctorDelete}
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

// ===================== MODALS =====================
function DepartmentModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [icon, setIcon] = useState(initial ? initial.icon : 'Stethoscope');
  const [color, setColor] = useState(initial ? initial.color : COLOR_THEMES[0]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
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
                <button key={key} className={selected ? 'icon-choice selected' : 'icon-choice'} style={selected ? { borderColor: color, background: color } : {}} onClick={() => setIcon(key)} title={key}>
                  <IconComp size={17} color={selected ? '#fff' : '#555'} />
                </button>
              );
            })}
          </div>

          <label>রঙ বেছে নিন</label>
          <div className="color-grid">
            {COLOR_THEMES.map((c) => (
              <button key={c} className={color === c ? 'color-choice selected' : 'color-choice'} style={{ background: c }} onClick={() => setColor(c)} title={c} />
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

function DoctorModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [quals, setQuals] = useState(initial ? initial.quals : '');
  const [specialty, setSpecialty] = useState(initial ? initial.specialty : '');
  const [workplace, setWorkplace] = useState(initial ? initial.workplace : '');
  const [time, setTime] = useState(initial ? initial.time : '');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), quals, specialty, workplace, time });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'ডাক্তারের তথ্য সম্পাদনা' : 'নতুন ডাক্তার যোগ করুন'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label>ডাক্তারের নাম</label>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমনঃ ডাঃ মোহাম্মদ নূর" />

          <label>শিক্ষাগত যোগ্যতা / ডিগ্রি</label>
          <textarea className="textarea" rows={3} value={quals} onChange={(e) => setQuals(e.target.value)} placeholder="প্রতি লাইনে একটি করে ডিগ্রি লিখুন" />

          <label>বিশেষত্ব</label>
          <textarea className="textarea" rows={2} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="যেমনঃ মেডিসিন বিশেষজ্ঞ" />

          <label>কর্মস্থল / পদবী</label>
          <textarea className="textarea" rows={2} value={workplace} onChange={(e) => setWorkplace(e.target.value)} placeholder="যেমনঃ চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল" />

          <label>সাক্ষাতের সময়</label>
          <input className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="যেমনঃ সন্ধ্যা ৬টা - রাত ৯টা" />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>সংরক্ষণ করুন</button>
        </div>
      </div>
    </div>
  );
}

function PanelModal({ mode, initial, activeDeptCount, departments, onSave, onClose }) {
  const [name, setName] = useState(initial ? initial.name : '');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [duplicate, setDuplicate] = useState(mode === 'add' && activeDeptCount > 0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, title: titleForName(trimmed), duplicate, selectedIds: [...selectedIds] });
  };

  const toggleDoctor = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAll = () => {
    const allIds = [];
    departments.forEach(dept => dept.doctors.forEach(doc => allIds.push(doc.id)));
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
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
                {selectedIds.size === departments.flatMap(d => d.doctors).length ? 'সব বাদ দিন' : 'সব বাছুন'}
              </button>
              {departments.map(dept => (
                <div key={dept.id} style={{ marginBottom: '10px' }}>
                  <strong style={{ color: dept.color }}>{dept.name}</strong>
                  {dept.doctors.map(doc => (
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

// ===================== PanelSwitcher =====================
function PanelSwitcher({ panels, activePanelId, onSwitch, onAdd, onRename, onDelete }) {
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
              <button className="panel-pill-icon" onClick={() => onRename(p)} title="এডিট করুন (নাম পরিবর্তন)" style={{ color: active ? '#fff' : '#1c5fa8', fontWeight: 'bold' }}><Pencil size={12} /> এডিট</button>
              {panels.length > 1 ? (
                <button className={confirmDeleteId === p.id ? 'panel-pill-icon danger-confirm' : 'panel-pill-icon'} onClick={() => (confirmDeleteId === p.id ? onDelete(p.id) : setConfirmDeleteId(p.id))} title="এই দিনের প্যানেল মুছুন">
                  {confirmDeleteId === p.id ? '✓' : <X size={11} />}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button className="btn btn-secondary panel-add-btn" onClick={onAdd}><Plus size={14} /> নতুন দিন</button>
    </div>
  );
}

// ===================== EditPanel =====================
function EditPanel({
  panel, departments, footer, checkedIds, allChecked,
  onUpdateTitle, onUpdateFooter, onUpdatePhone, onAddPhone, onRemovePhone,
  onAddDept, onEditDept, onDeleteDept, onMoveDept,
  onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctor,
  onToggleDoctorChecked, onToggleDeptAllChecked, onToggleAll,
  clearConfirm, onClearAll, onGoPreview,
}) {
  return (
    <div className="edit-panel">
      <section className="panel-section">
        <div className="section-header">
          <label>এই দিনের শিরোনাম (পোস্টারে যা দেখাবে)</label>
          <button className="toggle-all-btn" onClick={onToggleAll}>{allChecked ? 'সব বাদ দিন' : 'সব বাছুন'}</button>
        </div>
        <p className="section-hint">উপরে দিনের ট্যাব থেকে অন্য দিনে যেতে পারবেন, অথবা এখানে "{panel.name}"-এর শিরোনাম বদলান</p>
        <input className="input" value={panel.title} onChange={(e) => onUpdateTitle(e.target.value)} placeholder="যেমনঃ শনিবারের ডক্টরস প্যানেল" />
      </section>

      <section className="panel-section">
        <div className="section-header">
          <label>বিভাগ ও ডাক্তার তালিকা — {panel.name}</label>
          <button className="btn btn-primary" onClick={onAddDept}><Plus size={15} /> নতুন বিভাগ</button>
        </div>
        <p className="section-hint">প্রতিটি ডাক্তারের পাশের বক্সে টিক দিয়ে বেছে নিন কারা "{panel.name}"-এর পোস্টারে দেখাবে — বাকিরা মুছে যাবে না, শুধু আজকের প্রিভিউ/প্রিন্ট থেকে বাদ পড়বে।</p>
        {departments.length === 0 ? (
          <div className="empty-state">এখনো কোনো বিভাগ যোগ করা হয়নি। "নতুন বিভাগ" বাটনে চাপ দিয়ে শুরু করুন।</div>
        ) : null}
        {departments.map((dept, i) => (
          <DepartmentCard
            key={dept.id}
            dept={dept}
            index={i}
            total={departments.length}
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
            allowDeptDelete={false}
            allowDoctorDelete={false}
          />
        ))}
      </section>

      <section className="panel-section">
        <label>ফুটার তথ্য (হাসপাতালের নাম, ঠিকানা ও যোগাযোগ)</label>
        <p className="section-hint">এই তথ্য সব দিনের জন্য একই থাকে — একবার দিলেই সব প্যানেলে দেখাবে</p>
        <div className="footer-form-grid">
          <div className="field"><label>হাসপাতাল/প্রতিষ্ঠানের নাম</label><input className="input" value={footer.hospitalName} onChange={(e) => onUpdateFooter({ hospitalName: e.target.value })} /></div>
          <div className="field"><label>সাবটাইটেল</label><input className="input" value={footer.hospitalSubtitle} onChange={(e) => onUpdateFooter({ hospitalSubtitle: e.target.value })} /></div>
          <div className="field"><label>ঠিকানা</label><textarea className="textarea" rows={2} value={footer.address} onChange={(e) => onUpdateFooter({ address: e.target.value })} /></div>
          <div className="field"><label>ওয়েবসাইট</label><input className="input" value={footer.website} onChange={(e) => onUpdateFooter({ website: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>যোগাযোগ লেবেল</label><input className="input" value={footer.contactLabel} onChange={(e) => onUpdateFooter({ contactLabel: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>ফোন নম্বর</label>
            {footer.phones.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input className="input" value={p} onChange={(e) => onUpdatePhone(i, e.target.value)} placeholder="০১৮৮৬ ৭৭৬ ৫১২" />
                <button className="icon-btn" onClick={() => onRemovePhone(i)} title="মুছুন"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={onAddPhone}><Plus size={14} /> নম্বর যোগ করুন</button>
          </div>
        </div>
      </section>

      <section className="panel-section">
        <div className="danger-zone">
          <div>
            <div className="danger-zone-title">আজকের ("{panel.name}") সব ডাক্তার আনচেক করুন</div>
            <div className="danger-zone-text">কারো তথ্য মুছে যাবে না — শুধু আজকের পোস্টার খালি হয়ে যাবে। পরে আবার টিক দিয়ে ফিরিয়ে আনতে পারবেন।</div>
          </div>
          <button className={clearConfirm ? 'btn btn-danger' : 'btn btn-outline'} onClick={onClearAll}>{clearConfirm ? 'আবার ক্লিক করে নিশ্চিত করুন' : 'সব আনচেক করুন'}</button>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '30px' }}>
        <button className="btn btn-primary" onClick={onGoPreview} style={{ padding: '11px 26px', fontSize: '14px' }}>প্রিভিউ দেখুন →</button>
      </div>
    </div>
  );
}

// ===================== Preview Components =====================
function DeptHeader({ dept }) {
  const Icon = ICONS[dept.icon] || ICONS.Stethoscope;
  return (
    <div className="dept-header-wrap">
      <span className="dept-icon-box" style={{ borderColor: dept.color }}><Icon size={19} color={dept.color} /></span>
      <div className="dept-ribbon" style={{ background: dept.color }}><span>{dept.name}</span></div>
    </div>
  );
}

function DoctorEntry({ doc, accentColor }) {
  return (
    <div className="doctor-entry" style={{ borderLeftColor: accentColor }}>
      <div className="doctor-name">{doc.name}</div>
      {doc.quals ? <div className="doctor-quals">{doc.quals}</div> : null}
      {doc.specialty ? <div className="doctor-specialty">{doc.specialty}</div> : null}
      {doc.workplace ? <div className="doctor-workplace">{doc.workplace}</div> : null}
      {doc.time ? <div className="doctor-time">সাক্ষাতের সময়: <strong>{doc.time}</strong></div> : null}
    </div>
  );
}

function PreviewPanel({ panel, departments, checkedIds, footer }) {
  const printRef = useRef(null);

  const handlePrint = () => window.print();

  const downloadPNG = async () => {
    const element = printRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${panel.title || 'poster'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      alert('PNG ডাউনলোড করতে সমস্যা হয়েছে।');
    }
  };

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${panel.title || 'poster'}.pdf`);
    } catch (error) {
      alert('PDF ডাউনলোড করতে সমস্যা হয়েছে।');
    }
  };

  const visibleDepartments = departments
    .map((dept) => ({ ...dept, doctors: dept.doctors.filter((doc) => checkedIds.has(doc.id)) }))
    .filter((dept) => dept.doctors.length > 0);

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar no-print">
        <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> প্রিন্ট</button>
        <button className="btn btn-secondary" onClick={downloadPNG}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> PNG ডাউনলোড</button>
        <button className="btn btn-secondary" onClick={downloadPDF}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> PDF ডাউনলোড</button>
      </div>

      <div id="dpb-print-area" className="poster-page" ref={printRef}>
        <div className="poster-header"><h1>{panel.title}</h1></div>
        {visibleDepartments.length === 0 ? (
          <div className="poster-empty-note" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>"{panel.name}"-এর জন্য কোনো ডাক্তার নির্বাচন করা হয়নি।</div>
        ) : (
          <div className="poster-body">
            {visibleDepartments.map((dept) => (
              <div className="dept-block" key={dept.id}>
                <DeptHeader dept={dept} />
                {dept.doctors.map((doc) => <DoctorEntry key={doc.id} doc={doc} accentColor={dept.color} />)}
              </div>
            ))}
          </div>
        )}
        <div className="poster-footer">
          <div className="footer-col footer-left">
            <div className="footer-line"><MapPin size={13} /> <span>{footer.address}</span></div>
            <div className="footer-line"><Globe size={13} /> <span>{footer.website}</span></div>
          </div>
          <div className="footer-col footer-center">
            <img src={footer.logo} alt="Logo" style={{ height: '160px', width: 'auto', objectFit: 'contain' }} />
            <div className="hospital-subtitle">{footer.hospitalSubtitle}</div>
          </div>
          <div className="footer-col footer-right">
            <div className="footer-contact-label">{footer.contactLabel}</div>
            {footer.phones.map((p, i) => <div className="footer-phone" key={i}><Phone size={13} /> {p}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== Manage Doctors View =====================
function ManageDoctorsView({ departments, onAddDept, onEditDept, onDeleteDept, onAddDoctor, onEditDoctor, onDeleteDoctor, isAdmin }) {
  return (
    <div className="edit-panel">
      <section className="panel-section">
        <div className="section-header">
          <label>মাস্টার ডাক্তার তালিকা (বিভাগ ও ডাক্তার)</label>
          {isAdmin && <button className="btn btn-primary" onClick={onAddDept}><Plus size={15} /> নতুন বিভাগ</button>}
        </div>
        <p className="section-hint">এখানে বিভাগ তৈরি করুন এবং সেই বিভাগের ভেতরে ডাক্তার যোগ, সম্পাদনা বা মুছে ফেলুন।</p>
        {departments.length === 0 ? (
          <div className="empty-state">এখনো কোনো বিভাগ যোগ করা হয়নি।</div>
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
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onAddDoctor={() => onAddDoctor(dept.id)}
            onEditDoctor={(doc) => onEditDoctor(dept.id, doc)}
            onDeleteDoctor={(docId) => onDeleteDoctor(dept.id, docId)}
            onMoveDoctorUp={() => {}}
            onMoveDoctorDown={() => {}}
            onToggleDoctorChecked={() => {}}
            onToggleAllChecked={() => {}}
            allowDeptDelete={isAdmin}
            allowDoctorDelete={isAdmin}
          />
        ))}
      </section>
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function DoctorPanelBuilder() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('manage');
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [activePanelId, setActivePanelId] = useState(null);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('edit');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [deptModal, setDeptModal] = useState(null);
  const [doctorModal, setDoctorModal] = useState(null);
  const [panelModal, setPanelModal] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const debounceRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadData = async () => {
      try {
        const deptDocRef = doc(db, 'master', 'departments');
        const deptDoc = await getDoc(deptDocRef);
        let depts = [];
        if (deptDoc.exists()) {
          depts = deptDoc.data().departments;
        }
        setDepartments(depts);

        const panelsSnapshot = await getDocs(collection(db, 'panels'));
        const panelList = [];
        panelsSnapshot.forEach((doc) => {
          panelList.push({ id: doc.id, ...doc.data() });
        });
        setPanels(panelList);
        
        if (panelList.length > 0) {
          setActivePanelId(panelList[0].id);
          setCheckedIds(new Set(panelList[0].activeDoctorIds || []));
        } else {
          setActivePanelId(null);
          setCheckedIds(new Set());
        }

        const footerDocRef = doc(db, 'master', 'footer');
        const footerDoc = await getDoc(footerDocRef);
        if (footerDoc.exists()) {
          setFooter(footerDoc.data());
        } else {
          await setDoc(footerDocRef, DEFAULT_FOOTER);
          setFooter(DEFAULT_FOOTER);
        }

        setLoading(false);
      } catch (error) {
        console.error('Firebase load error:', error);
        alert('ডেটা লোড করতে সমস্যা হয়েছে। Firebase কানেকশন চেক করুন।');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveFooter = async (newFooter) => { try { await setDoc(doc(db, 'master', 'footer'), newFooter); } catch (e) { console.error('Footer save error:', e); } };
  const savePanelToFirebase = async (panel) => { try { await setDoc(doc(db, 'panels', panel.id), panel); } catch (e) { console.error('Panel save error:', e); } };
  const saveDepartments = async (newDepts) => { try { await setDoc(doc(db, 'master', 'departments'), { departments: newDepts }); } catch (e) { console.error('Departments save error:', e); } };
  const deletePanelFromFirebase = async (panelId) => { try { await deleteDoc(doc(db, 'panels', panelId)); } catch (e) { console.error('Delete panel error:', e); } };

  const activePanel = panels.find(p => p.id === activePanelId) || panels[0] || { id: 'empty', name: '', title: '', activeDoctorIds: [] };
  const allDoctorIds = departments.flatMap(d => d.doctors.map(doc => doc.id));
  const allChecked = allDoctorIds.length > 0 && allDoctorIds.every(id => checkedIds.has(id));

  const updatePanel = (updater, immediate) => { /* ... same as before ... */ };
  const updateDepartments = (updater, immediate) => { /* ... same as before ... */ };

  const handleUpdateTitle = (title) => updatePanel(p => ({ ...p, title }), true);
  const handleUpdateFooter = (changes) => { const newFooter = { ...footer, ...changes }; setFooter(newFooter); saveFooter(newFooter); };
  const handleUpdatePhone = (idx, value) => { const phones = [...footer.phones]; phones[idx] = value; handleUpdateFooter({ phones }); };
  const handleAddPhone = () => handleUpdateFooter({ phones: [...footer.phones, ''] });
  const handleRemovePhone = (idx) => handleUpdateFooter({ phones: footer.phones.filter((_, i) => i !== idx) });

  const handleAddDept = () => setDeptModal({ mode: 'add' });
  const handleEditDept = (dept) => setDeptModal({ mode: 'edit', dept });
  const handleSaveDept = (fields) => { /* ... same as before ... */ };
  const handleDeleteDept = (deptId) => { /* ... same as before ... */ };

  const handleAddDoctor = (deptId) => setDoctorModal({ deptId, mode: 'add' });
  const handleEditDoctor = (deptId, doctor) => setDoctorModal({ deptId, mode: 'edit', doctor });
  const handleSaveDoctor = (fields) => { /* ... same as before ... */ };
  const handleDeleteDoctor = (deptId, doctorId) => { /* ... same as before ... */ };

  const handleToggleDoctorChecked = (doctorId) => { /* ... same as before ... */ };
  const handleToggleDeptAllChecked = (deptId) => { /* ... same as before ... */ };
  const handleToggleAll = () => { /* ... same as before ... */ };
  const handleClearActivePanelChecks = () => { /* ... same as before ... */ };
  const handleSwitchPanel = (panelId) => { /* ... same as before ... */ };
  const handleAddPanel = async (fields) => { /* ... same as before ... */ };
  const handleRenamePanel = (fields) => { /* ... same as before ... */ };
  const handleDeletePanel = async (panelId) => { /* ... same as before ... */ };
  const handleSavePanel = (fields) => { /* ... same as before ... */ };

  if (loading) {
    return (
      <div className="dpb">
        <style>{CSS}</style>
        <div className="loading-screen">
          <Loader2 className="spin" size={26} />
          <span>লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  // ===================== LOGIN GATE =====================
  if (!user) {
    return (
      <div className="dpb">
        <style>{CSS}</style>
        <Login onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="dpb">
      <style>{CSS}</style>
      <div className="topbar no-print">
        <div className="topbar-title"><Stethoscope size={20} /><span>ডাক্তার প্যানেল বিল্ডার</span></div>
        <div className="topbar-right">
          <SaveIndicator status={saveStatus} />
          <div className="tabs">
            <button className={activeView === 'manage' ? 'tab active' : 'tab'} onClick={() => setActiveView('manage')}>ডাক্তার তালিকা</button>
            {isAdmin && (
              <>
                <button className={activeView === 'builder' ? 'tab active' : 'tab'} onClick={() => setActiveView('builder')}>প্যানেল বিল্ডার</button>
                {activeView === 'builder' && (
                  <>
                    <button className={mode === 'edit' ? 'tab active' : 'tab'} onClick={() => setMode('edit')}>এডিট করুন</button>
                    <button className={mode === 'preview' ? 'tab active' : 'tab'} onClick={() => setMode('preview')}>প্রিভিউ ও প্রিন্ট</button>
                  </>
                )}
              </>
            )}
            {!isAdmin && (
              <button className={mode === 'preview' ? 'tab active' : 'tab'} onClick={() => setMode('preview')}>প্রিভিউ ও প্রিন্ট</button>
            )}
          </div>
          <button className="logout-btn" onClick={() => setUser(null)}><LogOut size={14} /> লগআউট</button>
        </div>
      </div>

      {activeView === 'manage' ? (
        <ManageDoctorsView
          departments={departments}
          onAddDept={handleAddDept}
          onEditDept={handleEditDept}
          onDeleteDept={handleDeleteDept}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          <PanelSwitcher
            panels={panels}
            activePanelId={activePanelId}
            onSwitch={handleSwitchPanel}
            onAdd={() => setPanelModal({ mode: 'add', departments })}
            onRename={(panel) => setPanelModal({ mode: 'rename', panel })}
            onDelete={handleDeletePanel}
          />

          {mode === 'edit' ? (
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
              onDeleteDept={handleDeleteDept}
              onMoveDept={() => {}}
              onAddDoctor={handleAddDoctor}
              onEditDoctor={handleEditDoctor}
              onDeleteDoctor={() => {}}
              onMoveDoctor={() => {}}
              onToggleDoctorChecked={handleToggleDoctorChecked}
              onToggleDeptAllChecked={handleToggleDeptAllChecked}
              onToggleAll={handleToggleAll}
              clearConfirm={clearConfirm}
              onClearAll={handleClearActivePanelChecks}
              onGoPreview={() => setMode('preview')}
            />
          ) : (
            <PreviewPanel panel={activePanel} departments={departments} checkedIds={checkedIds} footer={footer} />
          )}
        </>
      )}

      {deptModal && <DepartmentModal initial={deptModal.mode === 'edit' ? deptModal.dept : null} onSave={handleSaveDept} onClose={() => setDeptModal(null)} />}
      {doctorModal && <DoctorModal initial={doctorModal.mode === 'edit' ? doctorModal.doctor : null} onSave={handleSaveDoctor} onClose={() => setDoctorModal(null)} />}
      {panelModal && <PanelModal mode={panelModal.mode} initial={panelModal.mode === 'rename' ? panelModal.panel : null} activeDeptCount={activePanel.activeDoctorIds?.length || 0} departments={departments} onSave={handleSavePanel} onClose={() => setPanelModal(null)} />}
    </div>
  );
}