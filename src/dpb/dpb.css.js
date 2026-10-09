// src/dpb/dpb.css.js
// ==================================================
// 🏥 Doctor Panel Builder — All CSS
// ==================================================
export const DPB_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');

.dpb{font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;background:#f4f6fa;color:#1f2937;min-height:100vh;width:100%;}
.dpb *{box-sizing:border-box;}
.dpb h1,.dpb h2,.dpb h3,.dpb p{margin:0;padding:0;}
.dpb button{font-family:inherit;cursor:pointer;}

/* ==================================================
   ✅ HEADER
   ================================================== */
.dpb .topbar{display:flex;align-items:center;justify-content:space-between;background:#ffffff;border-bottom:1px solid #e2e6ee;padding:14px 20px;position:sticky;top:0;z-index:20;flex-wrap:wrap;gap:14px;width:100%;box-shadow:0 1px 3px rgba(15,23,42,0.04);}

.dpb .hospital-brand{display:flex;align-items:center;gap:10px;flex-shrink:0;min-width:0;}
.dpb .hospital-brand-logo{width:44px;height:44px;border-radius:10px;background:#fff;border:1px solid #e2e6ee;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
.dpb .hospital-brand-logo img{width:100%;height:100%;object-fit:contain;display:block;}
.dpb .hospital-brand-name{font-size:19px;font-weight:800;color:#1c5fa8;letter-spacing:0.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;}

.dpb .topbar-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}

.dpb .header-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:1.5px solid transparent;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:all 0.2s ease;white-space:nowrap;text-decoration:none;}
.dpb .header-btn svg{flex-shrink:0;}
.dpb .header-btn.btn-teal{background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#fff;box-shadow:0 3px 10px rgba(13,148,136,0.30);}
.dpb .header-btn.btn-teal:hover{background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);transform:translateY(-1px);box-shadow:0 5px 14px rgba(13,148,136,0.40);}
.dpb .header-btn.btn-blue-outline{background:#fff;color:#1c5fa8;border-color:#1c5fa8;}
.dpb .header-btn.btn-blue-outline:hover{background:#eaf2fb;transform:translateY(-1px);box-shadow:0 3px 10px rgba(28,95,168,0.20);}
.dpb .header-btn.btn-gray-outline{background:#f8fafc;color:#475569;border-color:#cbd5e1;}
.dpb .header-btn.btn-gray-outline:hover{background:#f1f5f9;border-color:#94a3b8;color:#334155;transform:translateY(-1px);}
.dpb .header-btn.btn-red{background:#dc2626;color:#fff;}
.dpb .header-btn.btn-red:hover{background:#b91c1c;transform:translateY(-1px);box-shadow:0 4px 12px rgba(220,38,38,0.35);}

.dpb .save-indicator{font-size:12.5px;color:#6b7280;white-space:nowrap;}

/* ==================================================
   ✅ MOBILE BUTTON BAR (Reference Design)
   Shows only on mobile (< 767px)
   ================================================== */
.dpb .mobile-button-bar{display:none;flex-direction:column;gap:10px;padding:12px 16px;background:#ffffff;border-bottom:1px solid #e2e6ee;}

.dpb .mobile-button-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}

.dpb .mobile-action-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 10px;border-radius:10px;font-size:13px;font-weight:700;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;cursor:pointer;transition:all 0.2s ease;border:1.5px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
.dpb .mobile-action-btn svg{flex-shrink:0;}
.dpb .mobile-action-btn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dpb .mobile-action-btn.btn-teal{background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;box-shadow:0 3px 10px rgba(13,148,136,0.30);}
.dpb .mobile-action-btn.btn-teal:active{transform:scale(0.97);}
.dpb .mobile-action-btn.btn-blue-outline{background:#ffffff;color:#1c5fa8;border-color:#1c5fa8;}
.dpb .mobile-action-btn.btn-blue-outline:active{background:#eaf2fb;}
.dpb .mobile-action-btn.btn-gray-outline{background:#f8fafc;color:#475569;border-color:#cbd5e1;}
.dpb .mobile-action-btn.btn-gray-outline:active{background:#f1f5f9;}

/* ==================================================
   ✅ MOBILE MENU (Hamburger Drawer)
   ================================================== */
.dpb .mobile-menu-btn{display:none;align-items:center;justify-content:center;width:44px;height:44px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;color:#1c5fa8;transition:all 0.2s;flex-shrink:0;}
.dpb .mobile-menu-btn:hover{background:#e2e8f0;}

.dpb .mobile-nav-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:100;}
.dpb .mobile-nav-overlay.is-open{display:block;}

.dpb .mobile-nav-panel{position:fixed;top:0;right:0;height:100vh;width:290px;max-width:88vw;background:#fff;z-index:101;padding:20px;box-shadow:-10px 0 30px rgba(15,23,42,0.2);transform:translateX(100%);transition:transform 0.25s ease;overflow-y:auto;box-sizing:border-box;}
.dpb .mobile-nav-panel.is-open{transform:translateX(0);}

.dpb .mobile-nav-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid #e2e6ee;margin-bottom:16px;}
.dpb .mobile-nav-title{font-size:16px;font-weight:700;color:#1c5fa8;}
.dpb .mobile-nav-close{width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border:none;border-radius:8px;cursor:pointer;color:#475569;}
.dpb .mobile-nav-close:hover{background:#e2e8f0;}

.dpb .mobile-nav-items{display:flex;flex-direction:column;gap:8px;}
.dpb .mobile-nav-item{display:flex;align-items:center;gap:12px;padding:13px 14px;background:transparent;border:none;border-radius:10px;font-size:14.5px;font-weight:600;color:#475569;text-align:left;cursor:pointer;font-family:inherit;width:100%;box-sizing:border-box;}
.dpb .mobile-nav-item:hover{background:#f1f5f9;color:#1c5fa8;}
.dpb .mobile-nav-item.is-active{background:#1c5fa8;color:#fff;}
.dpb .mobile-nav-item.booking-item{background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-weight:700;}
.dpb .mobile-nav-item.booking-item:hover{background:linear-gradient(135deg,#0f766e,#0d9488);}
.dpb .mobile-nav-item svg{flex-shrink:0;}

/* ==================================================
   ✅ PANEL SWITCHER
   ================================================== */
.dpb .panel-switcher{display:flex;align-items:center;gap:10px;padding:10px 20px;background:#fff;border-bottom:1px solid #e2e6ee;flex-wrap:wrap;position:relative;z-index:18;}
.dpb .panel-switcher-scroll{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0;}
.dpb .panel-pill{display:flex;align-items:center;border:1px solid #e2e6ee;background:#fff;padding:5px 10px;border-radius:20px;font-size:13px;font-weight:600;color:#1f2937;cursor:pointer;transition:all 0.2s ease;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
.dpb .panel-pill:hover{border-color:#1c5fa8;color:#1c5fa8;transform:translateY(-1px);box-shadow:0 3px 8px rgba(28,95,168,0.15);}
.dpb .panel-pill.active{background:#1c5fa8;color:#fff;border-color:#1c5fa8;box-shadow:0 4px 10px rgba(28,95,168,0.35);}
.dpb .panel-pill-label{background:transparent;border:none;font-weight:600;font-size:13px;color:inherit;cursor:pointer;}
.dpb .panel-pill-icon{background:transparent;border:none;display:flex;align-items:center;gap:2px;color:inherit;cursor:pointer;font-size:11px;font-weight:600;padding:2px 4px;border-radius:8px;}
.dpb .panel-pill-icon:hover{background:rgba(28,95,168,0.15);}
.dpb .panel-pill-icon.danger-confirm{color:#dc2626;font-weight:700;}
.dpb .panel-add-btn{padding:7px 14px;font-size:12.5px;border-radius:12px;}

/* ==================================================
   ✅ LOADING
   ================================================== */
.dpb .loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:10px;color:#6b7280;}
.dpb .spin{animation:dpb-spin 1s linear infinite;}
@keyframes dpb-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 1s linear infinite;}

/* ==================================================
   ✅ EDIT PANEL
   ================================================== */
.dpb .edit-panel{max-width:880px;margin:0 auto;padding:20px;display:flex;flex-direction:column;gap:18px;}
.dpb .panel-section{background:#fff;border:1px solid #e2e6ee;border-radius:14px;padding:18px 20px;}
.dpb .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;}
.dpb .panel-section > label{font-weight:700;font-size:14.5px;color:#1f2937;display:block;}
.dpb .section-header label{font-weight:700;font-size:14.5px;color:#1f2937;}
.dpb .section-hint{font-size:12.5px;color:#6b7280;margin:4px 0 10px;}

.dpb .day-buttons{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 10px;}
.dpb .day-btn{border:1px solid #e2e6ee;background:#fff;padding:7px 14px;border-radius:20px;font-size:12.5px;color:#1f2937;transition:all 0.2s ease;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.dpb .day-btn:hover{border-color:#1c5fa8;color:#1c5fa8;transform:translateY(-1px);box-shadow:0 3px 8px rgba(28,95,168,0.15);}

.dpb .input,.dpb .textarea{width:100%;border:1px solid #e2e6ee;border-radius:10px;padding:10px 14px;font-size:14px;font-family:inherit;color:#1f2937;background:#fff;transition:all 0.2s;}
.dpb .input:focus,.dpb .textarea:focus{outline:none;border-color:#1c5fa8;box-shadow:0 0 0 3px rgba(28,95,168,0.14);}
.dpb .textarea{resize:vertical;line-height:1.5;}
.dpb .field{margin-bottom:12px;}
.dpb .field label,.dpb .modal-body label{display:block;font-size:12.5px;font-weight:600;color:#6b7280;margin:0 0 5px;}

.dpb .checkbox-row{display:flex;align-items:center;gap:8px;font-size:13px;color:#1f2937;cursor:pointer;font-weight:500;}
.dpb .checkbox-row input{width:16px;height:16px;cursor:pointer;flex-shrink:0;}

/* ==================================================
   ✅ BUTTONS
   ================================================== */
.dpb .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:12px;padding:9px 16px;font-size:13.5px;font-weight:600;white-space:nowrap;transition:all 0.2s ease;}
.dpb .btn-primary{background:#1c5fa8;color:#fff;box-shadow:0 3px 10px rgba(28,95,168,0.30);}
.dpb .btn-primary:hover{background:#154a82;transform:translateY(-1px);box-shadow:0 5px 14px rgba(28,95,168,0.40);}
.dpb .btn-primary:disabled{background:#b9c9dd;cursor:not-allowed;box-shadow:none;transform:none;}
.dpb .btn-secondary{background:#eef1f7;color:#1f2937;box-shadow:0 2px 6px rgba(0,0,0,0.06);}
.dpb .btn-secondary:hover{background:#e2e6ee;transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,0.10);}
.dpb .btn-danger{background:#dc2626;color:#fff;box-shadow:0 3px 10px rgba(220,38,38,0.30);}
.dpb .btn-danger:hover{background:#b91c1c;transform:translateY(-1px);box-shadow:0 5px 14px rgba(220,38,38,0.40);}
.dpb .btn-outline{background:#fff;border:1px solid #e2e6ee;color:#1f2937;box-shadow:0 1px 3px rgba(0,0,0,0.04);}
.dpb .btn-outline:hover{border-color:#cbd5e1;box-shadow:0 3px 8px rgba(0,0,0,0.08);transform:translateY(-1px);}

.dpb .toggle-all-btn{background:#1c5fa8;color:#fff;border:none;border-radius:20px;padding:5px 16px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(28,95,168,0.30);}
.dpb .toggle-all-btn:hover{background:#154a82;transform:translateY(-1px);box-shadow:0 4px 12px rgba(28,95,168,0.40);}

.dpb .dept-toggle-btn{background:transparent;border:1.5px solid #1c5fa8;color:#1c5fa8;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.2s ease;}
.dpb .dept-toggle-btn:hover{background:#eaf2fb;box-shadow:0 2px 6px rgba(28,95,168,0.15);}

/* ==================================================
   ✅ DEPARTMENT CARDS
   ================================================== */
.dpb .dept-card{border:1px solid #e2e6ee;border-left:5px solid #ccc;border-radius:14px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.03);}
.dpb .dept-card-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fafbfd;flex-wrap:wrap;gap:8px;}
.dpb .dept-card-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.dpb .dept-card-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dpb .dept-card-title strong{font-size:14.5px;}
.dpb .dept-doctor-count{font-size:11.5px;color:#6b7280;background:#eef1f7;padding:3px 10px;border-radius:20px;}
.dpb .dept-card-actions{display:flex;gap:4px;}

.dpb .icon-btn{background:transparent;border:1px solid transparent;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#6b7280;flex-shrink:0;transition:all 0.2s ease;}
.dpb .icon-btn:hover{background:#eef1f7;color:#1f2937;box-shadow:0 2px 6px rgba(0,0,0,0.08);}
.dpb .icon-btn:disabled{opacity:0.35;cursor:not-allowed;box-shadow:none;}
.dpb .icon-btn.danger-confirm{background:#dc2626;color:#fff;width:auto;padding:0 12px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(220,38,38,0.30);}
.dpb .icon-btn.link-btn{color:#0891b2;}
.dpb .icon-btn.link-btn:hover{background:#cffafe;color:#0e7490;}

.dpb .doctor-mini-list{padding:4px 14px 12px;}
.dpb .doctor-row{display:flex;align-items:center;justify-content:space-between;padding:9px 4px;border-top:1px dashed #e2e6ee;gap:10px;}
.dpb .doctor-checkbox{width:18px;height:18px;flex-shrink:0;cursor:pointer;accent-color:#1c5fa8;margin-right:4px;}
.dpb .doctor-row-info{min-width:0;flex:1;}
.dpb .doctor-row-name{font-size:16px;font-weight:700;color:#1f2937;}
.dpb .doctor-row-specialty{font-size:12px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;}
.dpb .doctor-row-time-slots{font-size:12px;color:#b45309;margin-top:4px;display:flex;flex-direction:column;gap:2px;}
.dpb .doctor-row-time-slot-item{background:#fef3c7;padding:3px 12px;border-radius:12px;display:inline-block;width:fit-content;}
.dpb .doctor-row-actions{display:flex;gap:2px;flex-shrink:0;}

.dpb .add-doctor-btn{display:flex;align-items:center;gap:6px;width:100%;justify-content:center;border:1.5px dashed #e2e6ee;background:transparent;border-radius:10px;padding:10px;font-size:12.5px;color:#6b7280;margin-top:6px;transition:all 0.2s ease;}
.dpb .add-doctor-btn:hover{border-color:#1c5fa8;color:#1c5fa8;background:#f0f7ff;box-shadow:0 2px 8px rgba(28,95,168,0.10);}

.dpb .empty-state{text-align:center;color:#6b7280;font-size:13px;padding:20px;}

/* ==================================================
   ✅ FOOTER FORM
   ================================================== */
.dpb .footer-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
@media (max-width:600px){.dpb .footer-form-grid{grid-template-columns:1fr;}}
.dpb .danger-zone{border:1px dashed #f0b4b4;background:#fff8f8;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.dpb .danger-zone-title{font-weight:700;font-size:13.5px;margin-bottom:2px;}
.dpb .danger-zone-text{font-size:12.5px;color:#8a3a3a;}

/* ==================================================
   ✅ MODALS
   ================================================== */
.dpb .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px;}
.dpb .modal-box{background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25);}
.dpb .modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e6ee;}
.dpb .modal-header h3{font-size:16px;}
.dpb .modal-body{padding:16px 20px;overflow-y:auto;}
.dpb .modal-footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e2e6ee;}

.dpb .icon-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}
.dpb .icon-choice{border:1.5px solid #e2e6ee;background:#fff;border-radius:10px;height:38px;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;}
.dpb .icon-choice:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,0.08);}
.dpb .color-grid{display:flex;flex-wrap:wrap;gap:8px;}
.dpb .color-choice{width:34px;height:34px;border-radius:50%;border:2px solid transparent;padding:0;transition:all 0.2s ease;}
.dpb .color-choice:hover{transform:scale(1.08);}
.dpb .color-choice.selected{border-color:#1f2937;box-shadow:0 0 0 2px #fff inset;}

/* ==================================================
   ✅ PREVIEW PANEL
   ================================================== */
.dpb .preview-wrap{max-width:1000px;margin:0 auto;padding:20px;}
.dpb .preview-toolbar{display:flex;justify-content:flex-end;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.dpb .preview-toolbar .btn{font-size:13px;padding:9px 18px;border-radius:12px;}
.dpb .poster-page{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 18px rgba(15,23,42,0.08);border:1px solid #e2e6ee;}
.dpb .poster-header{background:linear-gradient(120deg,#4fa3d1,#1c5fa8);padding:22px 20px;text-align:center;}
.dpb .poster-header h1{color:#fff;font-size:30px;font-weight:800;letter-spacing:0.3px;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;}
.dpb .poster-body{column-count:3;column-gap:26px;padding:22px;text-align:left;}
@media (max-width:820px){.dpb .poster-body{column-count:2;}.dpb .poster-header h1{font-size:20px;}}
@media (max-width:560px){.dpb .poster-body{column-count:1;}}

.dpb .dept-block{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;margin-bottom:0;display:inline-block;width:100%;height:auto;}
.dpb .dept-header-wrap{display:flex;align-items:center;margin-bottom:10px;}
.dpb .dept-icon-box{width:34px;height:34px;background:#fff;border:2px solid;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.15);}
.dpb .dept-ribbon{flex:1;margin-left:-12px;padding:7px 14px 7px 22px;color:#fff;font-weight:700;font-size:18px;clip-path:polygon(0 0,94% 0,100% 50%,94% 100%,0 100%);min-height:34px;display:flex;align-items:center;}

/* ==================================================
   ✅ DOCTOR ENTRY (Preview)
   ================================================== */
.dpb .doctor-entry{margin-bottom:18px;padding:1px 0 1px 10px;border-left:3px solid #ccc;text-align:left;}
.dpb .doctor-name{color:#1c5fa8;font-weight:700;font-size:22px;margin-bottom:1px;}
.dpb .doctor-quals{color:#333;font-size:12px;line-height:1.45;white-space:pre-line;}
.dpb .doctor-specialty{color:#9c2a7e;font-weight:700;font-size:15px;white-space:pre-line;margin-top:2px;}
.dpb .doctor-workplace{color:#333;font-size:12px;line-height:1.4;white-space:pre-line;margin-top:1px;}
.dpb .doctor-time-slots{margin-top:6px;display:flex;flex-direction:column;gap:4px;}
.dpb .doctor-time-slot-item{background:#fef3c7;padding:4px 16px;border-radius:20px;font-size:13px;color:#b45309;font-weight:600;display:inline-block;width:fit-content;}
.dpb .doctor-time-label{font-weight:700;color:#b45309;font-size:13px;margin-right:2px;white-space:nowrap;}
.dpb .empty-dept-note{font-size:11.5px;color:#6b7280;font-style:italic;}

/* ==================================================
   ✅ "সিরিয়াল দিন" BUTTON
   ================================================== */
.dpb .serial-booking-button{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:14px;padding:14px 24px;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff !important;font-size:15px;font-weight:700;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif;text-decoration:none;border:none;border-radius:12px;cursor:pointer;transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 14px rgba(13,148,136,0.30);letter-spacing:0.3px;position:relative;overflow:hidden;box-sizing:border-box;}
.dpb .serial-booking-button::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transition:left 0.5s ease;}
.dpb .serial-booking-button:hover::before{left:100%;}
.dpb .serial-booking-button:hover{background:linear-gradient(135deg,#0f766e 0%,#0d9488 100%);transform:translateY(-2px);box-shadow:0 8px 22px rgba(13,148,136,0.42);}
.dpb .serial-booking-button:active{transform:translateY(0);box-shadow:0 3px 10px rgba(13,148,136,0.30);}
.dpb .serial-booking-button:focus-visible{outline:3px solid rgba(13,148,136,0.35);outline-offset:3px;}
.dpb .serial-booking-button .btn-icon-left{flex-shrink:0;transition:transform 0.2s ease;}
.dpb .serial-booking-button .btn-icon-right{flex-shrink:0;transition:transform 0.25s ease;}
.dpb .serial-booking-button:hover .btn-icon-right{transform:translateX(4px);}
.dpb .serial-booking-button:hover .btn-icon-left{transform:scale(1.05);}
@media (max-width: 480px) {
  .dpb .serial-booking-button{padding:14px 20px;font-size:14.5px;border-radius:11px;gap:8px;}
}

/* ==================================================
   ✅ POSTER FOOTER
   ================================================== */
.dpb .poster-footer{display:flex;align-items:center;justify-content:space-between;background:#eef4fb;padding:16px 22px;flex-wrap:wrap;gap:14px;border-top:3px solid #1c5fa8;}
.dpb .footer-col{display:flex;flex-direction:column;gap:5px;font-size:11.5px;color:#333;}
.dpb .footer-line{display:flex;align-items:center;gap:6px;white-space:pre-line;font-size:16px;}
.dpb .footer-center{align-items:center;text-align:center;}
.dpb .hospital-name{font-size:19px;font-weight:800;color:#1c5fa8;letter-spacing:0.5px;}
.dpb .hospital-subtitle{font-size:20.5px;color:#555;font-weight:600;letter-spacing:0.5px;}
.dpb .footer-right{align-items:flex-end;text-align:right;}
.dpb .footer-contact-label{font-weight:700;color:#1c5fa8;font-size:16px;}
.dpb .footer-phone{display:flex;align-items:center;gap:6px;font-weight:700;font-size:20px;}

.dpb .doctor-entry,.dpb .doctor-row,.dpb .doctor-name,.dpb .doctor-quals,.dpb .doctor-specialty,.dpb .doctor-workplace,.dpb .doctor-time-slots,.dpb .doctor-row-name,.dpb .doctor-row-specialty{text-align:left !important;}

/* ==================================================
   ✅ DOCTOR LINK MODAL
   ================================================== */
.dpb .link-modal-input{display:flex;gap:8px;align-items:center;background:#f8fafc;border:1.5px solid #e2e6ee;border-radius:10px;padding:8px 12px;font-size:13px;}
.dpb .link-modal-input input{flex:1;border:none;background:transparent;outline:none;font-family:monospace;font-size:13px;color:#1e293b;padding:6px 0;}
.dpb .qr-container{text-align:center;padding:20px;background:#f8fafc;border-radius:12px;border:1px dashed #cbd5e1;margin-top:16px;}
.dpb .qr-container canvas,.dpb .qr-container img{max-width:220px;height:auto;border-radius:8px;}

/* ==================================================
   ✅ DOCTOR IMAGE UPLOAD
   ================================================== */
.dpb .doctor-image-upload{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
.dpb .doctor-image-preview{width:90px;height:90px;border-radius:50%;border:2px solid #e2e6ee;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}
.dpb .doctor-image-preview img{width:100%;height:100%;object-fit:cover;}
.dpb .doctor-image-preview .placeholder{color:#cbd5e1;}
.dpb .doctor-thumb{width:42px;height:42px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#f1f5f9;border:2px solid #e2e6ee;display:flex;align-items:center;justify-content:center;}
.dpb .doctor-thumb img{width:100%;height:100%;object-fit:cover;}
.dpb .doctor-thumb .placeholder{color:#94a3b8;}

/* ==================================================
   ✅ RESPONSIVE — Desktop → Tablet
   ================================================== */
@media (max-width: 1023px) {
  .dpb .topbar{padding:12px 16px;gap:10px;}
  .dpb .hospital-brand-name{font-size:16px;}
  .dpb .hospital-brand-logo{width:40px;height:40px;}
  .dpb .header-btn{padding:9px 14px;font-size:13px;}
}

/* ==================================================
   ✅ RESPONSIVE — Mobile (< 767px)
   ================================================== */
@media (max-width: 767px) {
  /* Show hamburger */
  .dpb .mobile-menu-btn{display:flex;}
  /* Show mobile button bar */
  .dpb .mobile-button-bar{display:flex;}
  /* Hide desktop actions */
  .dpb .topbar-actions{display:none;}
  /* Compact header */
  .dpb .topbar{padding:12px 16px;gap:10px;}
  .dpb .hospital-brand-name{font-size:16px;}
  .dpb .hospital-brand-logo{width:42px;height:42px;}
}

@media (max-width: 640px) {
  .dpb .topbar{padding:10px 14px;gap:10px;}
  .dpb .hospital-brand-name{font-size:15px;}
  .dpb .hospital-brand-logo{width:38px;height:38px;}
  .dpb .panel-switcher{padding:8px 14px;gap:6px;}
  .dpb .panel-pill{font-size:12px;padding:5px 10px;}
  .dpb .panel-pill-label{font-size:12px;}
  .dpb .panel-pill-icon{font-size:10px;padding:1px 4px;}
  .dpb .panel-add-btn{padding:7px 10px;font-size:12px;}
  .dpb .edit-panel{padding:12px;gap:12px;}
  .dpb .panel-section{padding:14px;}
  .dpb .preview-wrap{padding:10px;}
  .dpb .preview-toolbar{gap:6px;}
  .dpb .preview-toolbar .btn{padding:8px 12px;font-size:12px;}
}

@media (max-width: 420px) {
  .dpb .topbar{padding:10px 12px;gap:8px;}
  .dpb .hospital-brand-name{font-size:14px;}
  .dpb .hospital-brand-logo{width:36px;height:36px;}
  .dpb .mobile-menu-btn{width:40px;height:40px;}
  .dpb .mobile-action-btn{padding:10px 8px;font-size:12px;gap:4px;}
  .dpb .panel-pill{font-size:11px;padding:4px 9px;}
  .dpb .panel-pill-label{font-size:11px;}
  .dpb .edit-panel{padding:10px;gap:10px;}
  .dpb .panel-section{padding:12px;}
}

/* ==================================================
   ✅ PRINT
   ================================================== */
@media print {
  .no-print { display: none !important; }
  .serial-booking-button { display: none !important; }
  .dpb { background: #fff; }
  .dpb .preview-wrap { max-width: 100%; padding: 0; margin: 0; }
  .dpb .poster-page { box-shadow: none; border: none; border-radius: 0; }
  .dpb .poster-body { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; }
  .dpb * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
}
@page { margin: 10mm; }

body.generating-poster .dpb .serial-booking-button { display: none !important; }
`;