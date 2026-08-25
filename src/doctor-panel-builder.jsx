import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Pencil, Printer, X, ChevronUp, ChevronDown, MapPin, Globe, Phone, Loader2,
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer,
} from 'lucide-react';

const STORAGE_KEY = 'doctor-panel-data-v1';

const uid = () => Math.random().toString(36).slice(2, 10);

const DAYS = [
  { full: 'শনিবার' },
  { full: 'রবিবার' },
  { full: 'সোমবার' },
  { full: 'মঙ্গলবার' },
  { full: 'বুধবার' },
  { full: 'বৃহস্পতিবার' },
  { full: 'শুক্রবার' },
];

const ICONS = {
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer,
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

const SEED_DATA = {
  title: 'শনিবারের ডক্টরস প্যানেল',
  departments: [
    makeDepartment({
      name: 'মেডিসিন বিভাগ', icon: 'Stethoscope', color: '#1c5fa8',
      doctors: [
        makeDoctor({
          name: 'ডাঃ মোহাম্মদ নূর',
          quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এম.ডি (ইন্টারনাল মেডিসিন)\nসিসিডি-ডায়াবেটোলজি (বারডেম)',
          specialty: 'মেডিসিন বিশেষজ্ঞ',
          workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
          time: 'সন্ধ্যা ৬টা - রাত ৯টা',
        }),
        makeDoctor({
          name: 'ডাঃ শারমিন আক্তার',
          quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ),\nবিসিএস (স্বাস্থ্য), এম.ডি (ইন্টারনাল মেডিসিন), বিএমইউ',
          specialty: 'মেডিসিন বিশেষজ্ঞ',
          workplace: '',
          time: 'বিকাল ৩টা - সন্ধ্যা ৬টা',
        }),
        makeDoctor({
          name: 'ডাঃ মুসলিমা আক্তার',
          quals: 'এমবিবিএস, বিসিএস, সিসিডি, এম.আর.সি.পি ১ (ইউ.কে),\nডি.এম.ইউ, এ.এম.আর.ডি.এস (কোর্স)',
          specialty: 'ডায়াবেটিস, থাইরয়েড, আর্থ্রাইটিস ও চর্মরোগের অভিজ্ঞ চিকিৎসক ও সনোলজিস্ট',
          workplace: '',
          time: 'সন্ধ্যা ৬টা - রাত ৯টা',
        }),
        makeDoctor({
          name: 'ডাঃ মোঃ কামরুল আলম',
          quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য)\nএফ.সি.পি.এস, মেডিসিন (শেষ পর্ব)',
          specialty: 'মেডিসিন চিকিৎসক',
          workplace: 'ইনডোর মেডিকেল অফিসার, চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
          time: 'সন্ধ্যা ৭টা - রাত ৯টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'সার্জারী বিভাগ', icon: 'Scissors', color: '#2f9e52',
      doctors: [
        makeDoctor({
          name: 'ডাঃ মিশমা ইসলাম',
          quals: 'এম.এস (জেনারেল সার্জারী), ডি.এম.ইউ, এ.এম.আর.ডি.এস (কোর্স)',
          specialty: 'জেনারেল, ল্যাপারস্কোপিক, ব্রেস্ট এন্ড কোলোরেক্টাল সার্জন',
          workplace: 'সহকারী অধ্যাপক, সার্জারী বিভাগ\nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
          time: 'দুপুর ২টা - বিকাল ৪টা',
        }),
        makeDoctor({
          name: 'ডাঃ মোঃ আকরামুল আলম সাইমন',
          quals: 'এমবিবিএস, এমএস (জেনারেল সার্জারী),\nএমআরসিএস (শেষ পর্ব), ডিএমইউ',
          specialty: 'জেনারেল, ল্যাপারস্কোপিক এন্ড কোলোরেক্টাল সার্জন',
          workplace: 'সহকারী অধ্যাপক (সার্জারী বিভাগ)\nচট্টগ্রাম ইন্টারন্যাশনাল মেডিকেল কলেজ',
          time: 'বিকাল ৪.০০টা - সন্ধ্যা ৬.০০টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'গাইনী বিভাগ', icon: 'Heart', color: '#9c3a9c',
      doctors: [
        makeDoctor({
          name: 'ডাঃ মারজান সিদ্দিকা রূপসা',
          quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ), বিসিএস (স্বাস্থ্য),\nএফসিপিএস (গাইনী এন্ড অবস্)',
          specialty: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ ও সার্জন',
          workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
          time: 'দুপুর ৩টা - বিকাল ৫টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'চর্মরোগ বিভাগ', icon: 'Sparkles', color: '#e0653a',
      doctors: [
        makeDoctor({
          name: 'ডাঃ তাহমিনা আক্তার',
          quals: 'এমবিবিএস (চমেক), বিসিএস (স্বাস্থ্য), ডিডিভি (বিএমইউ)',
          specialty: 'চর্ম ও যৌন রোগ বিশেষজ্ঞ',
          workplace: 'চর্ম ও যৌনরোগ বিভাগ\nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
          time: 'বিকাল ৩.০০টা - বিকাল ৫.০০টা',
        }),
        makeDoctor({
          name: 'ডাঃ আয়াতুল্লাহ মোহাম্মদ সালমান',
          quals: 'এমবিবিএস (দিনাজপুর মেডিকেল কলেজ), ডিভস (ডার্মাটোলজি)\nপিজিটি (যৌন ও চর্ম), সিসিডি (বারডেম), এমসিজিপি (কোর্স), সিএমইউ',
          specialty: 'চর্মরোগ বিশেষজ্ঞ',
          workplace: 'দিনাজপুর মেডিকেল কলেজ হাসপাতাল',
          time: 'সকাল ১১টা - দুপুর ১টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'ডেন্টাল বিভাগ', icon: 'Smile', color: '#2b3f8f',
      doctors: [
        makeDoctor({
          name: 'ডাঃ নুসরাত পারভীন রূপা',
          quals: 'বি.ডি.এস (ঢাকা ডেন্টাল কলেজ), পিজিটি (কনজারভেটিভ ডেন্টিস্ট্রি)',
          specialty: 'ওরাল এন্ড ডেন্টাল সার্জন',
          workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
          time: 'বিকাল ৫.০০টা - রাত ৮.০০টা',
        }),
        makeDoctor({
          name: 'ডাঃ গোলাম মোস্তফা',
          quals: 'বি.ডি.এস, এডভান্স ট্রেনিং অব এন্ডোডন্টিক্স',
          specialty: 'ওরাল এন্ড ডেন্টাল সার্জন',
          workplace: 'চট্টগ্রাম মেডিকেল কলেজ',
          time: 'সকাল ১০টা - দুপুর ২টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'হৃদরোগ বিভাগ', icon: 'Activity', color: '#d1392f',
      doctors: [
        makeDoctor({
          name: 'ডাঃ মোহাম্মদ আব্দুল মান্নান',
          quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য), ডি-কার্ড (বিএমইউ)\nএফসিপিএস (কার্ডিওলজি) পার্ট-২',
          specialty: 'হৃদরোগ বিশেষজ্ঞ',
          workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
          time: 'দুপুর ২টা - বিকাল ৫টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'শিশু বিভাগ', icon: 'Baby', color: '#159a72',
      doctors: [
        makeDoctor({
          name: 'ডাঃ সুলতানা ইয়াসমিন',
          quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য), ডিসিএইচ (বিএমইউ)\nএফসিপিএস, ফাইনাল পার্ট (পেডিয়াট্রিক নেফ্রোলজি)',
          specialty: 'নবজাতক, শিশু ও কিশোর রোগ বিশেষজ্ঞ',
          workplace: '',
          time: 'সন্ধ্যা ৭টা - রাত ৮টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'অর্থোপেডিক বিভাগ', icon: 'Bone', color: '#0e8ca3',
      doctors: [
        makeDoctor({
          name: 'ডাঃ আবু জোনায়েদ রিফাত',
          quals: 'এমবিবিএস, পিজিটি (অর্থোপেডিক সার্জারি), পিজিটি (সার্জারি)',
          specialty: 'হাঁড়-জোড়া, বাত-ব্যথা, জয়েন্ট ও মেরুদণ্ড রোগ চিকিৎসক',
          workplace: 'এক্স মেডিকেল অফিসার, চট্টগ্রাম ইন্টারন্যাশনাল মেডিকেল কলেজ হাসপাতাল',
          time: 'বিকাল ৫.০০টা - রাত ৮.০০টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'খাদ্য ও পুষ্টি বিভাগ', icon: 'Utensils', color: '#8a6a2e',
      doctors: [
        makeDoctor({
          name: 'তানজিলা তাসমিন',
          quals: 'এম.এস.সি (এপ্লায়েড হিউম্যান নিউট্রিশন এন্ড ডায়েটেটিক্স) (সিভাসু)\nবিএসসি (ফুড সায়েন্স এন্ড টেকনোলজি) (সিভাসু)\nপিজিটি (ক্লিনিক্যাল নিউট্রিশন এন্ড ডায়েটেটিক্স, চাইল্ড নিউট্রিশন, ক্রিটিক্যাল কেয়ার এন্ড নিউট্রিশন) (বিএডিএন)',
          specialty: 'নিউট্রিশনিস্ট এন্ড ডায়েট কনসালটেন্ট',
          workplace: '',
          time: 'সন্ধ্যা ৭.৩০টা - রাত ৯.৩০টা',
        }),
      ],
    }),
    makeDepartment({
      name: 'জেনারেল ফিজিশিয়ান', icon: 'User', color: '#7a2d5c',
      doctors: [
        makeDoctor({
          name: 'ডাঃ সামসাদ বেগম',
          quals: 'এমবিবিএস (সিইউ), সিসিডি (বারডেম), সিএমইউ',
          specialty: 'জেনারেল ফিজিশিয়ান ও শিশু রোগে অভিজ্ঞ',
          workplace: '',
          time: 'সকাল ১০টা - দুপুর ১টা',
        }),
      ],
    }),
  ],
  footer: {
    address: 'বাকলিয়া এক্সেস রোড,\nবাকলিয়া, চট্টগ্রাম।',
    website: 'alafiyahhospital.com',
    // hospitalName: 'AL-AFIYAH',
    logo: '/logo.png',
    // hospitalSubtitle: 'Bakalia Access Road, Bakalia, Chattogram.',
    contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
    phones: ['01886 776 512', '01886 776 513'],
  },
};

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
.dpb .tabs{display:flex;background:#eef1f7;border-radius:10px;padding:3px;gap:2px;}
.dpb .tab{border:none;background:transparent;padding:8px 16px;border-radius:8px;font-size:13.5px;font-weight:600;color:#6b7280;}
.dpb .tab.active{background:#1c5fa8;color:#fff;}

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

.dpb .btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:9px;padding:8px 14px;font-size:13.5px;font-weight:600;white-space:nowrap;}
.dpb .btn-primary{background:#1c5fa8;color:#fff;}
.dpb .btn-primary:hover{background:#154a82;}
.dpb .btn-primary:disabled{background:#b9c9dd;cursor:not-allowed;}
.dpb .btn-secondary{background:#eef1f7;color:#1f2937;}
.dpb .btn-secondary:hover{background:#e2e6ee;}
.dpb .btn-danger{background:#dc2626;color:#fff;}
.dpb .btn-outline{background:#fff;border:1px solid #e2e6ee;color:#1f2937;}

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
.dpb .doctor-row-info{min-width:0;}
.dpb .doctor-row-name{font-size:13.5px;font-weight:700;color:#1f2937;}
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
.dpb .preview-toolbar{display:flex;justify-content:flex-end;margin-bottom:14px;}
.dpb .poster-page{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 18px rgba(15,23,42,0.08);border:1px solid #e2e6ee;}
.dpb .poster-header{background:linear-gradient(120deg,#4fa3d1,#1c5fa8);padding:22px 20px;text-align:center;}
.dpb .poster-header h1{color:#fff;font-size:26px;font-weight:800;letter-spacing:0.3px;}

.dpb .poster-body{column-count:3;column-gap:26px;padding:22px;}
@media (max-width:820px){.dpb .poster-body{column-count:2;}}
@media (max-width:560px){.dpb .poster-body{column-count:1;}}

.dpb .dept-block{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;margin-bottom:20px;display:inline-block;width:100%;}

.dpb .dept-header-wrap{display:flex;align-items:center;margin-bottom:10px;}
.dpb .dept-icon-box{width:34px;height:34px;background:#fff;border:2px solid;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,0.15);}
.dpb .dept-ribbon{flex:1;margin-left:-12px;padding:7px 14px 7px 22px;color:#fff;font-weight:700;font-size:13.5px;clip-path:polygon(0 0,94% 0,100% 50%,94% 100%,0 100%);min-height:34px;display:flex;align-items:center;}

.dpb .doctor-entry{margin-bottom:13px;padding:1px 0 1px 10px;border-left:3px solid #ccc;}
.dpb .doctor-name{color:#1c5fa8;font-weight:700;font-size:13.5px;margin-bottom:1px;}
.dpb .doctor-quals{color:#333;font-size:11.5px;line-height:1.45;white-space:pre-line;}
.dpb .doctor-specialty{color:#9c2a7e;font-weight:700;font-size:12px;white-space:pre-line;margin-top:2px;}
.dpb .doctor-workplace{color:#333;font-size:11.5px;line-height:1.4;white-space:pre-line;margin-top:1px;}
.dpb .doctor-time{color:#333;font-size:11.5px;margin-top:2px;}
.dpb .doctor-time strong{color:#111;}
.dpb .empty-dept-note{font-size:11.5px;color:#6b7280;font-style:italic;}

.dpb .poster-footer{display:flex;align-items:center;justify-content:space-between;background:#eef4fb;padding:16px 22px;flex-wrap:wrap;gap:14px;border-top:3px solid #1c5fa8;}
.dpb .footer-col{display:flex;flex-direction:column;gap:5px;font-size:11.5px;color:#333;}
.dpb .footer-line{display:flex;align-items:center;gap:6px;white-space:pre-line; font-size:16px;}
.dpb .footer-center{align-items:center;text-align:center;}
.dpb .hospital-name{font-size:19px;font-weight:800;color:#1c5fa8;letter-spacing:0.5px;}
.dpb .hospital-subtitle{font-size:20px.5px;color:#555;font-weight:600;letter-spacing:0.5px;}
.dpb .footer-right{align-items:flex-end;text-align:right;}
.dpb .footer-contact-label{font-weight:700;color:#1c5fa8;font-size:16px;}
.dpb .footer-phone{display:flex;align-items:center;gap:6px;font-weight:700; font-size: 20px;}

@media print{
  .no-print{display:none !important;}
  .dpb{background:#fff;}
  .dpb .preview-wrap{max-width:100%;padding:0;margin:0;}
  .dpb .poster-page{box-shadow:none;border:none;border-radius:0;}
  .dpb .poster-body{column-count:3 !important;}
  .dpb *{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}
}
@page{margin:10mm;}
`;

function SaveIndicator({ status }) {
  if (status === 'idle') return null;
  const text = status === 'saving' ? 'সংরক্ষণ হচ্ছে...' : status === 'saved' ? '✓ সংরক্ষিত হয়েছে' : 'সংরক্ষণ ব্যর্থ হয়েছে';
  return <span className="save-indicator">{text}</span>;
}

function DoctorRow({ doc, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div className="doctor-row">
      <div className="doctor-row-info">
        <div className="doctor-row-name">{doc.name || 'নামহীন ডাক্তার'}</div>
        {doc.specialty ? <div className="doctor-row-specialty">{doc.specialty}</div> : null}
      </div>
      <div className="doctor-row-actions">
        <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান"><ChevronUp size={14} /></button>
        <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান"><ChevronDown size={14} /></button>
        <button className="icon-btn" onClick={onEdit} title="সম্পাদনা"><Pencil size={14} /></button>
        <button
          className={confirmDelete ? 'icon-btn danger-confirm' : 'icon-btn'}
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          title="মুছুন"
        >
          {confirmDelete ? 'নিশ্চিত?' : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

function DepartmentCard({ dept, index, total, onEdit, onDelete, onMoveUp, onMoveDown, onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctorUp, onMoveDoctorDown }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const Icon = ICONS[dept.icon] || ICONS.Stethoscope;

  return (
    <div className="dept-card" style={{ borderLeftColor: dept.color }}>
      <div className="dept-card-header">
        <div className="dept-card-title">
          <span className="dept-card-icon" style={{ background: dept.color }}>
            <Icon size={15} color="#fff" />
          </span>
          <strong>{dept.name || 'নামহীন বিভাগ'}</strong>
          <span className="dept-doctor-count">{dept.doctors.length} জন ডাক্তার</span>
        </div>
        <div className="dept-card-actions">
          <button className="icon-btn" onClick={onMoveUp} disabled={index === 0} title="উপরে সরান"><ChevronUp size={16} /></button>
          <button className="icon-btn" onClick={onMoveDown} disabled={index === total - 1} title="নিচে সরান"><ChevronDown size={16} /></button>
          <button className="icon-btn" onClick={onEdit} title="সম্পাদনা"><Pencil size={16} /></button>
          <button
            className={confirmDelete ? 'icon-btn danger-confirm' : 'icon-btn'}
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            title="মুছুন"
          >
            {confirmDelete ? 'নিশ্চিত?' : <Trash2 size={16} />}
          </button>
        </div>
      </div>
      <div className="doctor-mini-list">
        {dept.doctors.map((doc, di) => (
          <DoctorRow
            key={doc.id}
            doc={doc}
            index={di}
            total={dept.doctors.length}
            onEdit={() => onEditDoctor(doc)}
            onDelete={() => onDeleteDoctor(doc.id)}
            onMoveUp={() => onMoveDoctorUp(doc.id)}
            onMoveDown={() => onMoveDoctorDown(doc.id)}
          />
        ))}
        <button className="add-doctor-btn" onClick={onAddDoctor}>
          <Plus size={14} /> ডাক্তার যোগ করুন
        </button>
      </div>
    </div>
  );
}

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

function EditPanel({
  data, onUpdateTitle, onSelectDay, onUpdateFooter, onUpdatePhone, onAddPhone, onRemovePhone,
  onAddDept, onEditDept, onDeleteDept, onMoveDept,
  onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctor,
  clearConfirm, onClearAll, onGoPreview,
}) {
  return (
    <div className="edit-panel">
      <section className="panel-section">
        <label>শিরোনাম</label>
        <p className="section-hint">দ্রুত দিন বেছে নিন, অথবা নিজের মতো লিখুন</p>
        <div className="day-buttons">
          {DAYS.map((d) => (
            <button key={d.full} className="day-btn" onClick={() => onSelectDay(d.full)}>{d.full}</button>
          ))}
        </div>
        <input className="input" value={data.title} onChange={(e) => onUpdateTitle(e.target.value)} placeholder="যেমনঃ শনিবারের ডক্টরস প্যানেল" />
      </section>

      <section className="panel-section">
        <div className="section-header">
          <label>বিভাগ ও ডাক্তার তালিকা</label>
          <button className="btn btn-primary" onClick={onAddDept}><Plus size={15} /> নতুন বিভাগ</button>
        </div>
        {data.departments.length === 0 ? (
          <div className="empty-state">এখনো কোনো বিভাগ যোগ করা হয়নি। "নতুন বিভাগ" বাটনে চাপ দিয়ে শুরু করুন।</div>
        ) : null}
        {data.departments.map((dept, i) => (
          <DepartmentCard
            key={dept.id}
            dept={dept}
            index={i}
            total={data.departments.length}
            onEdit={() => onEditDept(dept)}
            onDelete={() => onDeleteDept(dept.id)}
            onMoveUp={() => onMoveDept(dept.id, -1)}
            onMoveDown={() => onMoveDept(dept.id, 1)}
            onAddDoctor={() => onAddDoctor(dept.id)}
            onEditDoctor={(doc) => onEditDoctor(dept.id, doc)}
            onDeleteDoctor={(docId) => onDeleteDoctor(dept.id, docId)}
            onMoveDoctorUp={(docId) => onMoveDoctor(dept.id, docId, -1)}
            onMoveDoctorDown={(docId) => onMoveDoctor(dept.id, docId, 1)}
          />
        ))}
      </section>

      <section className="panel-section">
        <label>ফুটার তথ্য (হাসপাতালের নাম, ঠিকানা ও যোগাযোগ)</label>
        <p className="section-hint">এই তথ্য সাধারণত পরিবর্তন হয় না, একবার দিলেই থেকে যাবে</p>
        <div className="footer-form-grid">
          <div className="field">
            <label>হাসপাতাল/প্রতিষ্ঠানের নাম</label>
            <input className="input" value={data.footer.hospitalName} onChange={(e) => onUpdateFooter({ hospitalName: e.target.value })} />
          </div>
          <div className="field">
            <label>সাবটাইটেল</label>
            <input className="input" value={data.footer.hospitalSubtitle} onChange={(e) => onUpdateFooter({ hospitalSubtitle: e.target.value })} />
          </div>
          <div className="field">
            <label>ঠিকানা</label>
            <textarea className="textarea" rows={2} value={data.footer.address} onChange={(e) => onUpdateFooter({ address: e.target.value })} />
          </div>
          <div className="field">
            <label>ওয়েবসাইট</label>
            <input className="input" value={data.footer.website} onChange={(e) => onUpdateFooter({ website: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>যোগাযোগ লেবেল</label>
            <input className="input" value={data.footer.contactLabel} onChange={(e) => onUpdateFooter({ contactLabel: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>ফোন নম্বর</label>
            {data.footer.phones.map((p, i) => (
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
            <div className="danger-zone-title">সব বিভাগ ও ডাক্তার মুছে নতুন করে শুরু করুন</div>
            <div className="danger-zone-text">এতে সব বিভাগ ও ডাক্তারের তথ্য মুছে যাবে (ফুটার তথ্য থেকে যাবে)। এই কাজ ফিরিয়ে আনা যাবে না।</div>
          </div>
          <button className={clearConfirm ? 'btn btn-danger' : 'btn btn-outline'} onClick={onClearAll}>
            {clearConfirm ? 'আবার ক্লিক করে নিশ্চিত করুন' : 'সব মুছুন'}
          </button>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '30px' }}>
        <button className="btn btn-primary" onClick={onGoPreview} style={{ padding: '11px 26px', fontSize: '14px' }}>
          প্রিভিউ দেখুন ও প্রিন্ট করুন →
        </button>
      </div>
    </div>
  );
}

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

function PreviewPanel({ data }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="preview-wrap">
      <div className="preview-toolbar no-print">
        <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> প্রিন্ট করুন</button>
      </div>

      <div id="dpb-print-area" className="poster-page">
        <div className="poster-header">
          <h1>{data.title}</h1>
        </div>

        <div className="poster-body">
          {data.departments.map((dept) => (
            <div className="dept-block" key={dept.id}>
              <DeptHeader dept={dept} />
              {dept.doctors.map((doc) => (
                <DoctorEntry key={doc.id} doc={doc} accentColor={dept.color} />
              ))}
              {dept.doctors.length === 0 ? (
                <div className="empty-dept-note">এই বিভাগে এখনো কোনো ডাক্তার যোগ করা হয়নি।</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="poster-footer">
          <div className="footer-col footer-left">
            <div className="footer-line"><MapPin size={13} /> <span>{data.footer.address}</span></div>
            <div className="footer-line"><Globe size={13} /> <span>{data.footer.website}</span></div>
          </div>
          <div className="footer-col footer-center">
            <img 
                src={data.footer.logo} 
                alt="Al-Afiyah Hospital Logo" 
                style={{ height: '160px', width: 'auto', objectFit: 'contain' }} 
              />
            <div className="hospital-subtitle">{data.footer.hospitalSubtitle}</div>
          </div>
          <div className="footer-col footer-right">
            <div className="footer-contact-label">{data.footer.contactLabel}</div>
            {data.footer.phones.map((p, i) => (
              <div className="footer-phone" key={i}><Phone size={13} /> {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorPanelBuilder() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('edit');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [deptModal, setDeptModal] = useState(null);
  const [doctorModal, setDoctorModal] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (!cancelled) setData(res && res.value ? JSON.parse(res.value) : SEED_DATA);
      } catch (e) {
        if (!cancelled) setData(SEED_DATA);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = async (next) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next));
      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const updateData = (updater, immediate) => {
    const next = typeof updater === 'function' ? updater(data) : updater;
    setData(next);
    if (immediate) {
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
      setSaveStatus('saving');
      persist(next);
    } else {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persist(next), 700);
    }
  };

  const handleUpdateTitle = (title) => updateData((prev) => ({ ...prev, title }));
  const handleSelectDay = (full) => updateData((prev) => ({ ...prev, title: full + 'ের ডক্টরস প্যানেল' }), true);

  const handleUpdateFooter = (changes) => updateData((prev) => ({ ...prev, footer: { ...prev.footer, ...changes } }));
  const handleUpdatePhone = (idx, value) => updateData((prev) => {
    const phones = prev.footer.phones.slice();
    phones[idx] = value;
    return { ...prev, footer: { ...prev.footer, phones } };
  });
  const handleAddPhone = () => updateData((prev) => ({ ...prev, footer: { ...prev.footer, phones: [...prev.footer.phones, ''] } }), true);
  const handleRemovePhone = (idx) => updateData((prev) => ({ ...prev, footer: { ...prev.footer, phones: prev.footer.phones.filter((_, i) => i !== idx) } }), true);

  const handleAddDept = () => setDeptModal({ mode: 'add' });
  const handleEditDept = (dept) => setDeptModal({ mode: 'edit', dept });
  const handleSaveDept = (fields) => {
    if (deptModal.mode === 'add') {
      updateData((prev) => ({ ...prev, departments: [...prev.departments, makeDepartment(fields)] }), true);
    } else {
      const deptId = deptModal.dept.id;
      updateData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) => (d.id === deptId ? { ...d, ...fields } : d)),
      }), true);
    }
    setDeptModal(null);
  };
  const handleDeleteDept = (deptId) => updateData((prev) => ({
    ...prev,
    departments: prev.departments.filter((d) => d.id !== deptId),
  }), true);
  const handleMoveDept = (deptId, dir) => updateData((prev) => {
    const arr = prev.departments.slice();
    const idx = arr.findIndex((d) => d.id === deptId);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= arr.length) return prev;
    const tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp;
    return { ...prev, departments: arr };
  }, true);

  const handleAddDoctor = (deptId) => setDoctorModal({ deptId, mode: 'add' });
  const handleEditDoctor = (deptId, doctor) => setDoctorModal({ deptId, mode: 'edit', doctor });
  const handleSaveDoctor = (fields) => {
    const deptId = doctorModal.deptId;
    if (doctorModal.mode === 'add') {
      updateData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) => (d.id === deptId ? { ...d, doctors: [...d.doctors, makeDoctor(fields)] } : d)),
      }), true);
    } else {
      const doctorId = doctorModal.doctor.id;
      updateData((prev) => ({
        ...prev,
        departments: prev.departments.map((d) => {
          if (d.id !== deptId) return d;
          return { ...d, doctors: d.doctors.map((doc) => (doc.id === doctorId ? { ...doc, ...fields } : doc)) };
        }),
      }), true);
    }
    setDoctorModal(null);
  };
  const handleDeleteDoctor = (deptId, doctorId) => updateData((prev) => ({
    ...prev,
    departments: prev.departments.map((d) => (d.id === deptId ? { ...d, doctors: d.doctors.filter((doc) => doc.id !== doctorId) } : d)),
  }), true);
  const handleMoveDoctor = (deptId, doctorId, dir) => updateData((prev) => ({
    ...prev,
    departments: prev.departments.map((d) => {
      if (d.id !== deptId) return d;
      const arr = d.doctors.slice();
      const idx = arr.findIndex((doc) => doc.id === doctorId);
      const ni = idx + dir;
      if (idx < 0 || ni < 0 || ni >= arr.length) return d;
      const tmp = arr[idx]; arr[idx] = arr[ni]; arr[ni] = tmp;
      return { ...d, doctors: arr };
    }),
  }), true);

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3500);
      return;
    }
    setClearConfirm(false);
    updateData((prev) => ({ ...prev, title: 'নতুন ডক্টরস প্যানেল', departments: [] }), true);
  };

  if (loading || !data) {
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

  return (
    <div className="dpb">
      <style>{CSS}</style>

      <div className="topbar no-print">
        <div className="topbar-title"><Stethoscope size={20} /><span>ডাক্তার প্যানেল বিল্ডার</span></div>
        <div className="topbar-right">
          <SaveIndicator status={saveStatus} />
          <div className="tabs">
            <button className={mode === 'edit' ? 'tab active' : 'tab'} onClick={() => setMode('edit')}>এডিট করুন</button>
            <button className={mode === 'preview' ? 'tab active' : 'tab'} onClick={() => setMode('preview')}>প্রিভিউ ও প্রিন্ট</button>
          </div>
        </div>
      </div>

      {mode === 'edit' ? (
        <EditPanel
          data={data}
          onUpdateTitle={handleUpdateTitle}
          onSelectDay={handleSelectDay}
          onUpdateFooter={handleUpdateFooter}
          onUpdatePhone={handleUpdatePhone}
          onAddPhone={handleAddPhone}
          onRemovePhone={handleRemovePhone}
          onAddDept={handleAddDept}
          onEditDept={handleEditDept}
          onDeleteDept={handleDeleteDept}
          onMoveDept={handleMoveDept}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onMoveDoctor={handleMoveDoctor}
          clearConfirm={clearConfirm}
          onClearAll={handleClearAll}
          onGoPreview={() => setMode('preview')}
        />
      ) : (
        <PreviewPanel data={data} />
      )}

      {deptModal ? (
        <DepartmentModal
          initial={deptModal.mode === 'edit' ? deptModal.dept : null}
          onSave={handleSaveDept}
          onClose={() => setDeptModal(null)}
        />
      ) : null}
      {doctorModal ? (
        <DoctorModal
          initial={doctorModal.mode === 'edit' ? doctorModal.doctor : null}
          onSave={handleSaveDoctor}
          onClose={() => setDoctorModal(null)}
        />
      ) : null}
    </div>
  );
}
