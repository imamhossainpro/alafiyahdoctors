// src/AllDoctorsPage.jsx
// ==================================================
// 👨‍⚕️ AllDoctorsPage — Public "সকল ডাক্তার" directory
// ==================================================
// ✅ Public (no login)
// ✅ Search + department filter
// ✅ Modern card UI + detail modal
// ✅ Booking handoff to /booking/:doctorId
// ✅ hospital.jpg hero background + overlay
// ✅ Bengali font (Hind Siliguri + Noto Sans Bengali)
// ==================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, AlertCircle, Search, Stethoscope } from 'lucide-react';

import hospitalBg from './assets/hospital.jpg';

import { useHospital } from './context/HospitalContext';
import { trackEvent } from './firebase';
import {
  fetchAllDoctors,
  buildDoctorSearchText,
} from './services/allDoctorsService';

import SearchBar from './components/all-doctors/SearchBar';
import DepartmentNav from './components/all-doctors/DepartmentNav';
import DoctorCard from './components/all-doctors/DoctorCard';
import DoctorDetailsModal from './components/all-doctors/DoctorDetailsModal';

// ==================================================
// ✅ CSS
// ==================================================
const ALL_DOCTORS_CSS = `
/* ==================================================
   ✅ Fonts — Uses existing project fonts
   (Hind Siliguri + Noto Sans Bengali — already in index.html)
   ================================================== */
.ad-page,
.ad-page *,
.ad-searchbar,
.ad-searchbar *,
.ad-dept-nav,
.ad-dept-nav *,
.ad-doctor-card,
.ad-doctor-card *,
.ad-modal,
.ad-modal *,
.ad-btn,
.ad-state,
.ad-section-title,
.ad-hero-title,
.ad-hero-sub {
  font-family: 'Hind Siliguri', 'Noto Sans Bengali', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;,
}

/* ===== Page shell ===== */
.ad-page{
  min-height:100vh;
  background:#f4f7fb;
  color:#0f172a;
  padding-bottom:60px;
}
.ad-page *{box-sizing:border-box;}

/* ==================================================
   ✅ Hero — hospital.jpg + overlay (bigger hero)
   ================================================== */
.ad-hero{
  position:relative;
  color:#fff;
  padding:90px 20px 140px;
  min-height:420px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  background-color:#1c5fa8;
  background-image:
    linear-gradient(135deg, rgba(28,95,168,0.82) 0%, rgba(36, 36, 36, 0.78) 10%),
    url(${hospitalBg});
  background-size:cover;
  background-position:center 30%;
  background-repeat:no-repeat;
}
.ad-hero::after{
  content:'';
  position:absolute;
  right:-80px;top:-80px;
  width:320px;height:320px;
  border-radius:50%;
  background:rgba(255,255,255,0.06);
  pointer-events:none;
}
.ad-hero-inner{
  max-width:1200px;margin:0 auto;position:relative;z-index:1;
  text-align:center;
}
.ad-hero-icon{
  display:inline-flex;align-items:center;justify-content:center;
  width:64px;height:64px;border-radius:18px;
  background:rgba(255,255,255,0.15);
  border:1px solid rgba(255,255,255,0.25);
  margin-bottom:16px;
}
.ad-hero-title{
  margin:0 0 10px 0;
  font-size:45px;font-weight:800;letter-spacing:-0.5px;
  line-height:1.2;
  text-shadow:0 2px 10px rgba(0,0,0,0.25);
  color:#fff;
}
.ad-hero-sub{
  margin:0 auto;max-width:640px;
  font-size:20px;opacity:0.95;line-height:1.7;
  text-shadow:0 1px 6px rgba(0,0,0,0.20);
}

/* ===== Container ===== */
.ad-container{
  max-width:1200px;margin:-60px auto 0;padding:0 20px;
  position:relative;z-index:2;
}

/* ===== Search bar ===== */
.ad-searchbar{
  background:#fff;border-radius:16px;
  padding:16px 18px;
  box-shadow:0 8px 24px rgba(15,23,42,0.08);
  border:1px solid #e2e8f0;
  display:flex;flex-direction:column;gap:12px;
  margin-bottom:20px;
}
.ad-searchbar-input{
  display:flex;align-items:center;gap:10px;
  background:#f8fafc;
  border:1.5px solid #e2e8f0;
  border-radius:12px;
  padding:10px 14px;
  transition:all 0.2s;
}
.ad-searchbar-input:focus-within{
  border-color:#1c5fa8;
  background:#fff;
  box-shadow:0 0 0 3px rgba(28,95,168,0.12);
}
.ad-searchbar-input input{
  flex:1;border:none;outline:none;background:transparent;
  font-size:15px;
  color:#0f172a;
  min-width:0;
}
.ad-searchbar-input input::placeholder{color:#94a3b8;}
.ad-searchbar-clear{
  background:transparent;border:none;cursor:pointer;
  color:#94a3b8;padding:4px;border-radius:6px;
  display:flex;align-items:center;
}
.ad-searchbar-clear:hover{background:#e2e8f0;color:#475569;}
.ad-searchbar-meta{
  display:flex;justify-content:space-between;align-items:center;
  flex-wrap:wrap;gap:10px;
}
.ad-searchbar-count{
  display:inline-flex;align-items:center;gap:6px;
  font-size:13px;font-weight:600;color:#64748b;
}
.ad-searchbar-reset{
  display:inline-flex;align-items:center;gap:6px;
  background:#fee2e2;color:#991b1b;
  border:none;border-radius:8px;
  padding:7px 14px;font-size:12.5px;font-weight:700;
  cursor:pointer;
}
.ad-searchbar-reset:hover{background:#fecaca;}

/* ===== Department nav ===== */
.ad-dept-nav{
  display:flex;gap:8px;flex-wrap:wrap;
  margin-bottom:22px;
  padding:6px 0;
}
.ad-dept-pill{
  display:inline-flex;align-items:center;gap:8px;
  background:#fff;
  border:1.5px solid #e2e8f0;
  border-radius:24px;
  padding:8px 16px;
  font-size:13.5px;font-weight:600;
  color:#334155;
  cursor:pointer;
  transition:all 0.18s;
}
.ad-dept-pill:hover{
  border-color:#1c5fa8;color:#1c5fa8;
  transform:translateY(-1px);
}
.ad-dept-pill.is-active{
  background:#1c5fa8;color:#fff;border-color:#1c5fa8;
  box-shadow:0 4px 12px rgba(28,95,168,0.28);
}
.ad-dept-pill-count{
  background:rgba(28,95,168,0.1);
  color:#1c5fa8;
  font-size:11px;font-weight:800;
  padding:2px 8px;border-radius:10px;
  min-width:22px;text-align:center;
}
.ad-dept-pill.is-active .ad-dept-pill-count{
  background:rgba(255,255,255,0.25);color:#fff;
}

/* ==================================================
   ✅ Section headings — BIG font (শিশু বিভাগ, গাইনী বিভাগ, etc.)
   ================================================== */
.ad-section-title{
  display:flex;align-items:center;gap:12px;
  margin:34px 0 18px;
  font-size:28px;
  font-weight:800;
  color:#1c5fa8;
  line-height:1.3;
}
.ad-section-title::before{
  content:'';
  width:6px;height:32px;
  background:linear-gradient(180deg,#1c5fa8,#0d9488);
  border-radius:3px;
  flex-shrink:0;
}
.ad-section-title svg{
  width:24px;height:24px;
  flex-shrink:0;
}
.ad-section-count{
  background:#eff6ff;color:#1c5fa8;
  font-size:14px;
  font-weight:700;
  padding:4px 12px;
  border-radius:14px;
  margin-left:8px;
}

/* ===== Grid ===== */
.ad-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:18px;
}

/* ===== Doctor card ===== */
.ad-doctor-card{
  background:#fff;
  border:1px solid #e2e8f0;
  border-radius:16px;
  overflow:hidden;
  display:flex;flex-direction:column;
  transition:all 0.22s ease;
  box-shadow:0 2px 8px rgba(15,23,42,0.04);
}
.ad-doctor-card:hover{
  transform:translateY(-4px);
  box-shadow:0 14px 32px rgba(15,23,42,0.10);
  border-color:#cbd5e1;
}
.ad-doctor-card-head{
  display:flex;gap:14px;
  padding:18px 18px 12px;
  align-items:flex-start;
}
.ad-doctor-avatar{
  width:70px;height:70px;border-radius:50%;
  background:#f1f5f9;
  border:3px solid #fff;
  outline:1px solid #e2e8f0;
  overflow:hidden;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.ad-doctor-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.ad-doctor-identity{flex:1;min-width:0;}
.ad-doctor-name{
  margin:0 0 2px 0;
  font-size:17px;font-weight:800;color:#0f172a;
  line-height:1.35;
  word-break:break-word;
}
.ad-doctor-name-en{
  margin:0 0 6px 0;
  font-size:12.5px;color:#64748b;font-style:italic;
  word-break:break-word;
}
.ad-doctor-specialty{
  display:inline-flex;align-items:center;gap:5px;
  margin:0;font-size:12.5px;font-weight:600;
  color:#7c3aed;background:#f3e8ff;
  padding:3px 10px;border-radius:12px;
  word-break:break-word;
}
.ad-doctor-card-body{
  padding:0 18px 14px;
  display:flex;flex-direction:column;gap:8px;
  flex:1;
}
.ad-doctor-info-row{
  display:flex;align-items:flex-start;gap:8px;
  font-size:13px;color:#475569;line-height:1.55;
}
.ad-doctor-info-row svg{flex-shrink:0;margin-top:3px;}
.ad-doctor-info-text{
  flex:1;min-width:0;
  word-break:break-word;
}
.ad-doctor-dept-badge{
  display:inline-block;
  font-size:12px;font-weight:700;
  padding:3px 10px;border-radius:10px;
}
.ad-doctor-chamber{
  display:flex;flex-direction:column;gap:6px;
  margin-top:2px;
}
.ad-doctor-chamber-label{
  display:flex;align-items:center;gap:5px;
  font-size:11.5px;font-weight:700;color:#64748b;
  text-transform:uppercase;letter-spacing:0.4px;
}
.ad-doctor-chamber-days{
  display:flex;flex-wrap:wrap;gap:5px;
}
.ad-doctor-day-chip{
  background:#ecfdf5;color:#065f46;
  font-size:11.5px;font-weight:700;
  padding:3px 10px;border-radius:12px;
  border:1px solid #a7f3d0;
}
.ad-doctor-time{
  display:flex;flex-wrap:wrap;gap:6px;
  margin-top:6px;
}
.ad-doctor-time-chip{
  display:inline-flex;align-items:center;gap:4px;
  background:#fef3c7;color:#92400e;
  font-size:11.5px;font-weight:700;
  padding:3px 10px;border-radius:12px;
}
.ad-doctor-card-actions{
  display:grid;grid-template-columns:1fr 1fr;
  gap:8px;padding:14px 18px 18px;
  border-top:1px solid #f1f5f9;
  margin-top:auto;
}

/* ===== Buttons ===== */
.ad-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:10px 14px;border-radius:10px;
  font-size:13px;font-weight:700;
  cursor:pointer;transition:all 0.18s ease;
  white-space:nowrap;text-decoration:none;
}
.ad-btn-outline{
  background:#fff;color:#1c5fa8;
  border:1.5px solid #1c5fa8;
}
.ad-btn-outline:hover{background:#eff6ff;}
.ad-btn-primary{
  background:linear-gradient(135deg,#1c5fa8,#0d9488);
  color:#fff;border:none;
  box-shadow:0 4px 12px rgba(28,95,168,0.28);
}
.ad-btn-primary:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 16px rgba(28,95,168,0.4);
}

/* ===== State boxes ===== */
.ad-state{
  background:#fff;border:1px solid #e2e8f0;
  border-radius:16px;padding:60px 24px;
  text-align:center;
  box-shadow:0 2px 8px rgba(15,23,42,0.04);
}
.ad-state-icon{font-size:56px;margin-bottom:14px;}
.ad-state-title{font-size:18px;font-weight:800;color:#334155;margin:0 0 8px;}
.ad-state-sub{font-size:14px;color:#94a3b8;margin:0;line-height:1.6;}
.ad-spin{animation:ad-spin 1s linear infinite;}
@keyframes ad-spin{to{transform:rotate(360deg);}}

/* ===== Modal ===== */
.ad-modal-overlay{
  position:fixed;inset:0;
  background:rgba(15,23,42,0.6);
  display:flex;align-items:center;justify-content:center;
  z-index:9999;padding:20px;
  animation:ad-fade 0.2s ease;
}
@keyframes ad-fade{from{opacity:0}to{opacity:1}}
.ad-modal{
  background:#fff;border-radius:20px;
  max-width:640px;width:100%;
  max-height:92vh;
  display:flex;flex-direction:column;
  overflow:hidden;
  box-shadow:0 30px 80px rgba(15,23,42,0.35);
}
.ad-modal-header{
  display:flex;justify-content:space-between;align-items:center;
  padding:18px 24px;
  border-bottom:1px solid #e2e8f0;
  background:#f8fafc;
}
.ad-modal-header h2{
  margin:0;font-size:18px;font-weight:800;color:#0f172a;
}
.ad-modal-close{
  background:transparent;border:none;cursor:pointer;
  color:#64748b;padding:6px;border-radius:8px;
  display:flex;align-items:center;
}
.ad-modal-close:hover{background:#e2e8f0;color:#0f172a;}
.ad-modal-body{
  padding:22px 24px;overflow-y:auto;flex:1;
}
.ad-modal-identity{
  display:flex;gap:16px;align-items:flex-start;
  padding-bottom:18px;border-bottom:1px solid #f1f5f9;
  margin-bottom:18px;
}
.ad-modal-avatar{
  width:96px;height:96px;border-radius:50%;
  background:#f1f5f9;
  border:4px solid #fff;outline:1px solid #e2e8f0;
  overflow:hidden;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.ad-modal-avatar img{width:100%;height:100%;object-fit:cover;}
.ad-modal-name{
  margin:0 0 3px;font-size:22px;font-weight:800;color:#0f172a;
  line-height:1.3;word-break:break-word;
}
.ad-modal-name-en{
  margin:0 0 8px;font-size:13.5px;color:#64748b;font-style:italic;
}
.ad-modal-specialty{
  display:inline-flex;align-items:center;gap:6px;
  margin:0 0 8px;font-size:13.5px;font-weight:700;color:#7c3aed;
}
.ad-modal-dept{
  display:inline-block;
  font-size:12.5px;font-weight:700;
  padding:4px 12px;border-radius:12px;
}
.ad-modal-section{
  margin-bottom:18px;
}
.ad-modal-section-title{
  display:flex;align-items:center;gap:8px;
  font-size:14px;font-weight:800;color:#1c5fa8;
  margin-bottom:10px;
  padding-bottom:6px;
  border-bottom:1px dashed #e2e8f0;
}
.ad-modal-text{
  margin:0;font-size:14px;color:#334155;line-height:1.7;
  white-space:pre-line;
  word-break:break-word;
}
.ad-modal-schedule{
  display:flex;flex-direction:column;gap:8px;
}
.ad-modal-schedule-row{
  display:flex;align-items:flex-start;gap:12px;
  padding:10px 14px;
  background:#f8fafc;
  border:1px solid #e2e8f0;
  border-radius:10px;
}
.ad-modal-schedule-day{
  font-size:13.5px;font-weight:800;color:#0f172a;
  min-width:90px;flex-shrink:0;
}
.ad-modal-schedule-times{
  display:flex;flex-wrap:wrap;gap:6px;flex:1;
}
.ad-modal-schedule-time{
  display:inline-flex;align-items:center;gap:4px;
  background:#fef3c7;color:#92400e;
  font-size:12px;font-weight:700;
  padding:3px 10px;border-radius:12px;
}
.ad-modal-footer{
  display:flex;justify-content:flex-end;gap:10px;
  padding:16px 24px;
  border-top:1px solid #e2e8f0;
  background:#f8fafc;
}

/* ==================================================
   ✅ Responsive — Tablet & Mobile
   ================================================== */
@media (max-width:1024px){
  .ad-hero{padding:80px 20px 130px;min-height:400px;}
  .ad-section-title{font-size:26px;}
}

@media (max-width:640px){
  /* Hero */
  .ad-hero{padding:64px 16px 110px;min-height:340px;}
  .ad-hero-icon{width:56px;height:56px;}
  .ad-hero-title{font-size:30px;}
  .ad-hero-sub{font-size: 15px;}

  /* Container */
  .ad-container{padding:0 14px;}

  /* Section title (শিশু বিভাগ, গাইনী বিভাগ) */
  .ad-section-title{
    font-size:22px;
    margin:26px 0 14px;
    gap:10px;
  }
  .ad-section-title::before{
    width:5px;height:26px;
  }
  .ad-section-title svg{
    width:20px;height:20px;
  }
  .ad-section-count{
    font-size:12.5px;
    padding:3px 10px;
  }

  /* Grid */
  .ad-grid{grid-template-columns:1fr;gap:14px;}

  /* Modal */
  .ad-modal-identity{flex-direction:column;align-items:center;text-align:center;}
  .ad-modal-footer{flex-direction:column-reverse;}
  .ad-modal-footer .ad-btn{width:100%;}
  .ad-modal-schedule-row{flex-direction:column;gap:6px;}
}
`;

// ==================================================
// ✅ Main Component
// ==================================================
export default function AllDoctorsPage() {
  const navigate = useNavigate();
  const { currentHospital } = useHospital();
  const hospitalId = currentHospital?.id || 'alafiyah_main';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [activeDeptId, setActiveDeptId] = useState('all');
  const [detailDoctor, setDetailDoctor] = useState(null);

  // ==================================================
  // ✅ Load data once
  // ==================================================
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAllDoctors(hospitalId);
        if (!mounted) return;
        setData(result);

        trackEvent('all_doctors_view', {
          hospital_id: hospitalId,
          total_doctors: result.totalDoctors,
          total_departments: result.departments.length,
        });
      } catch (err) {
        console.error('❌ AllDoctors load error:', err);
        if (mounted) setError(err.message || 'ডাক্তারদের তথ্য লোড করা যায়নি');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // ==================================================
  // ✅ Filtered departments
  // ==================================================
  const filteredDepartments = useMemo(() => {
    if (!data?.departments) return [];
    const term = searchText.trim().toLowerCase();
    let list = data.departments;

    if (activeDeptId !== 'all') {
      list = list.filter((d) => d.id === activeDeptId);
    }

    if (term) {
      list = list
        .map((dept) => {
          const doctors = dept.doctors.filter((doc) =>
            buildDoctorSearchText(doc).includes(term)
          );
          return { ...dept, doctors };
        })
        .filter((dept) => dept.doctors.length > 0);
    }

    return list;
  }, [data, searchText, activeDeptId]);

  const filteredCount = useMemo(
    () => filteredDepartments.reduce((sum, d) => sum + d.doctors.length, 0),
    [filteredDepartments]
  );

  const hasActiveFilter = !!searchText.trim() || activeDeptId !== 'all';

  // ==================================================
  // ✅ Handlers
  // ==================================================
  const handleClearFilters = () => {
    setSearchText('');
    setActiveDeptId('all');
  };

  const handleBook = (doctor) => {
    if (!doctor?.id) return;

    trackEvent('all_doctors_book_click', {
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      dept_id: doctor.deptId,
    });

    setDetailDoctor(null);
    navigate(`/booking/${doctor.id}`);
  };

  const handleShowDetails = (doctor) => {
    setDetailDoctor(doctor);
    trackEvent('all_doctors_details_view', {
      doctor_id: doctor.id,
      doctor_name: doctor.name,
    });
  };

  // ==================================================
  // ✅ Render
  // ==================================================
  return (
    <div className="ad-page">
      <style>{ALL_DOCTORS_CSS}</style>

      {/* ============ Hero ============ */}
      <section className="ad-hero">
        <div className="ad-hero-inner">
          <div className="ad-hero-icon">
            <Users size={30} color="#fff" />
          </div>
          <h1 className="ad-hero-title">সকল ডাক্তার</h1>
          <p className="ad-hero-sub">
            অভিজ্ঞ বিশেষজ্ঞ ডাক্তারদের তথ্য দেখুন এবং সহজেই সিরিয়াল বুক
            করুন।
          </p>
        </div>
      </section>

      {/* ============ Main container ============ */}
      <div className="ad-container">
        {/* Search */}
        <SearchBar
          value={searchText}
          onChange={setSearchText}
          totalCount={data?.totalDoctors || 0}
          filteredCount={filteredCount}
          onClear={handleClearFilters}
          hasActiveFilter={hasActiveFilter}
        />

        {/* Loading */}
        {loading && (
          <div className="ad-state">
            <Loader2
              size={36}
              className="ad-spin"
              color="#1c5fa8"
              style={{ marginBottom: 14 }}
            />
            <h3 className="ad-state-title">ডাক্তারদের তথ্য লোড হচ্ছে...</h3>
            <p className="ad-state-sub">একটু অপেক্ষা করুন</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="ad-state">
            <div className="ad-state-icon">
              <AlertCircle size={56} color="#dc2626" />
            </div>
            <h3 className="ad-state-title">তথ্য লোড করা যায়নি</h3>
            <p className="ad-state-sub">{error}</p>
          </div>
        )}

        {/* Empty (no doctors at all) */}
        {!loading && !error && data?.totalDoctors === 0 && (
          <div className="ad-state">
            <div className="ad-state-icon">👨‍⚕️</div>
            <h3 className="ad-state-title">এখনো কোনো ডাক্তার যোগ করা হয়নি</h3>
            <p className="ad-state-sub">অনুগ্রহ করে পরে আবার চেষ্টা করুন।</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data?.totalDoctors > 0 && (
          <>
            <DepartmentNav
              departments={data.departments}
              activeDeptId={activeDeptId}
              onChange={setActiveDeptId}
            />

            {/* Empty after filters */}
            {filteredDepartments.length === 0 && (
              <div className="ad-state">
                <div className="ad-state-icon">
                  <Search size={56} color="#94a3b8" />
                </div>
                <h3 className="ad-state-title">
                  এই ফিল্টারে কোনো ডাক্তার পাওয়া যায়নি
                </h3>
                <p className="ad-state-sub">
                  সার্চ বা বিভাগ পরিবর্তন করে আবার চেষ্টা করুন।
                </p>
                <button
                  type="button"
                  className="ad-btn ad-btn-primary"
                  style={{ marginTop: 18 }}
                  onClick={handleClearFilters}
                >
                  সব ফিল্টার রিসেট করুন
                </button>
              </div>
            )}

            {/* Sections */}
            {filteredDepartments.map((dept) => (
              <section key={dept.id} id={`dept-${dept.id}`}>
                <h2 className="ad-section-title">
                  <Stethoscope size={18} />
                  {dept.name}
                  <span className="ad-section-count">
                    {dept.doctors.length} জন
                  </span>
                </h2>
                <div className="ad-grid">
                  {dept.doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onShowDetails={handleShowDetails}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {/* ============ Detail Modal ============ */}
      {detailDoctor && (
        <DoctorDetailsModal
          doctor={detailDoctor}
          onClose={() => setDetailDoctor(null)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}