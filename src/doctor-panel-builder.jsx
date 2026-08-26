import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Ear, Trash2, Pencil, Printer, X, ChevronUp, ChevronDown, MapPin, Globe, Phone, Loader2,
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain, Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer,
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

// ===================== SEED DATA (YOUR EXACT DOCTOR LIST) =====================
const SEED_DEPARTMENTS = [
  // ----- মেডিসিন বিভাগ -----
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
        name: 'ডা: শারমিন আকতার',
        quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ), বিসিএস (স্বাস্থ্য) \nএম.ডি (ইন্টারনাল মেডিসিন), বিএমইউ',
        specialty: 'মেডিসিন বিশেষজ্ঞ',
        workplace: '',
        time: 'বিকেল ৩টা - সন্ধ্যা ৬টা',
      }),
      makeDoctor({
        name: 'ডাঃ রায়হান আহম্মদ',
        quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এফসিপিএস-এফ-পি (নিউরোলজি), পিজিটি (মেডিসিন)',
        specialty: 'মেডিসিন, নিউরোমেডিসিন, ডায়াবেটিস, চর্মরোগ ও বাত-ব্যাথা রোগে অভিজ্ঞ',
        workplace: '',
        time: 'প্রতিদিন রাত ৮টা - রাত ১০টা',
      }),
      makeDoctor({
        name: 'ডাঃ মুসলিমা আক্তার',
        quals: 'এমবিবিএস, বিসিএস, সিসিডি, এম.আর.সি.পি ১ (ইউ.কে),\nডি.এম.ইউ, এ.এম.আর.ডি.এস (কোর্স)',
        specialty: 'ডায়াবেটিস, থাইরয়েড, আর্থ্রাইটিস ও \nচর্মরোগের অভিজ্ঞ চিকিৎসক ও সনোলজিস্ট',
        workplace: '',
        time: 'সন্ধ্যা ৬টা - রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডাঃ মুহাম্মাদ মোসলেহ উদ্দিন',
        quals: 'এমবিবিএস. (চমেক), পিজিটি (মেডিসিন), \nএফসিপিএস (শেষ পর্ব) [হৃদরোগ]',
        specialty: 'মেডিসিন, ডায়াবেটিস, বক্ষব্যধি, পরিপাকতন্ত্র চর্ম ও হৃদরোগ চিকিৎসক',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ ও হাসপাতাল',
        time: 'দুপুর ২টা - বিকেল ৪টা',
      }),
      makeDoctor({
        name: 'ডা. মোঃ আব্দুল্লাহ আল নোমান',
        quals: 'এমবিবিএস (সিইউ), এফসিপিএস ফাইনাল পার্ট (মেডিসিন), \nএমআরসিপি - ইউকে (পেসেস)',
        specialty: 'মেডিসিন, ডায়াবেটিস ও চর্মরোগে অভিজ্ঞ',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ ও হাসপাতাল',
        time: 'সন্ধ্যা ৭টা - রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডা: সায়্যিদুল আবরার',
        quals: 'এমবিবিএস, পিজিটি (মেডিসিন), এফসিপিএস, \nগ্যাস্ট্রোএন্টারোলজি (এফ.পি)',
        specialty: 'মেডিসিন, পরিপাকতন্ত্র চিকিৎসক',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ ও হাসপাতাল',
        time: 'সন্ধ্যা ৭ঃ৩০টা  - রাত ৯ঃ৩০টা',
      }),
      makeDoctor({
        name: 'ডাঃ মোঃ কামরুল আলম',
        quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য)\nএফ.সি.পি.এস, মেডিসিন (শেষ পর্ব)',
        specialty: 'মেডিসিন চিকিৎসক',
        workplace: 'ইনডোর মেডিকেল অফিসার, চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
        time: 'সন্ধ্যা ৭টা - রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডাঃ মোহাম্মদ আমিনুল ইসলাম',
        quals: 'এমবিবিএস (সিওমেক), বিসিএস (স্বাস্থ্য)\nএমডি (এন্ডোক্রাইনোলজি এন্ড মেটাবলিজম)',
        specialty: 'ডায়াবেটিস, থাইরয়েড ও হরমোন রোগ বিশেষজ্ঞ',
        workplace: 'কনসালট্যান্ট, ন্যাশনাল একাডেমি ফর প্ল্যানিং এন্ড ডেভেলপমেন্ট',
        time: 'সকাল ১০টা - দুপুর ১টা',
      }),
      makeDoctor({
        name: 'ডাঃ আব্দুল্লাহ আল জাহেদ',
        quals: 'এমবিবিএস (এজাজ মেডিকেল কলেজ), বিসিএস (স্বাস্থ্য) \nএফসিপিএস-এফপি (মেডিসিন)',
        specialty: 'মেডিসিন, বাত-ব্যথা ও ডায়াবেটিস রোগ বিশেষজ্ঞ',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
        time: 'সন্ধ্যা ৬টা - রাত ৯টা',
      }),
    ],
  }),
  // ----- সার্জারী বিভাগ -----
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
      makeDoctor({
        name: 'ডাঃ তাসফিয়া রহমান',
        quals: 'এমবিবিএস, এম এস (সার্জিক্যাল অনকোলোজি)-কোর্স \nপিজিটি - (জেনারেল সার্জারী, সি এম সি)',
        specialty: 'জেনারেল,কোলোরেক্টাল এন্ড ব্রেস্ট সার্জারীতে অভিজ্ঞ',
        workplace: 'বাংলাদেশ মেডিকেল বিশ্ববিদ্যালয়, ঢাকা।',
        time: 'বিকাল ৪টা - রাত ৮টা',
      }),
      makeDoctor({
        name: 'ডা. মো. আসফাকুল আসিফ',
        quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ) বিসিএস (স্বাস্থ্য) \nএমএস (জেনারেল সার্জারি), বিএমইউ,সিসিডি (বারডেম)',
        specialty: 'জেনারেল, ল্যাপারোস্কপিক, কলোরেক্টাল এন্ড ব্রেস্ট সার্জন',
        workplace: 'কনসালটেন্ট, সার্জারি রেজিস্ট্রার \nচট্টগ্রাম মেডিকেল কলেজ এন্ড হাসপাতাল',
        time: 'দুপুর ২টা - বিকাল ৪টা',
      }),
    ],
  }),
  // ----- গাইনী বিভাগ -----
  makeDepartment({
    name: 'গাইনী বিভাগ', icon: 'Heart', color: '#9c3a9c',
    doctors: [
      makeDoctor({
        name: 'ডা: সুলতানা রওশন',
        quals: 'এমবিবিএস (ডিইউ), বিসিএস (স্বাস্থ্য) এমএস (বিএসএমএমইউ) \nডিএমইউ, এফসিজিপি ট্রেনিং ইন ইনফার্টিলিটি (আইসিআরসি)\nট্রেনিং ইন ল্যাপারোস্কপিক সার্জারী \nকনসালট্যান্ট-স্ত্রীরোগ, প্রসূতি \n',
        specialty: 'বন্ধ্যাত্ব্য বিশেষজ্ঞ ও ল্যাপারোস্কপিক সার্জন',
        workplace: 'সহকারী অধ্যাপক, চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        time: 'সন্ধ্যা ৭টা - রাত ৮:৩০টা',
      }),
      makeDoctor({
        name: 'ডাঃ মারজান সিদ্দিকা রূপসা',
        quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ), বিসিএস (স্বাস্থ্য),\nএফসিপিএস (গাইনী এন্ড অবস্)',
        specialty: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ ও সার্জন',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        time: 'দুপুর ৩টা - বিকাল ৫টা',
      }),
      makeDoctor({
        name: 'ডাঃ নুরুন নাহার রুমা',
        quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এমএস (গাইনী এন্ড অবস্)',
        specialty: 'গাইনী, স্ত্রীরোগ এবং বন্ধ্যাত্ব বিশেষজ্ঞ',
        workplace: ' রেজিস্ট্রার (গাইনী ও অবস্ বিভাগ) \nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        time: 'সন্ধ্যা ৬টা - রাত ৮টা',
      }),
      makeDoctor({
        name: 'ডাঃ সাবরীনা আবেদীন',
        quals: 'এমবিবিএস (চট্টগ্রাম মেডিকেল কলেজ) এমএস (গাইনী এন্ড অ্যস), বিএমইউ',
        specialty: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ সার্জন',
        workplace: '',
        time: 'বিকাল ৪টা- সন্ধ্যা ৬টা',
      }),
      makeDoctor({
        name: 'ডাঃ রোজি আকতার',
        quals: 'এমবিবিএস, এফসিপিএস (শেষ পর্ব), এমসিপিএস (গাইনি এন্ড অবস্)',
        specialty: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
        time: 'বিকাল ৫টা- রাত ৮টা',
      }),
      makeDoctor({
        name: 'ডা: কুসুম আক্তার',
        quals: 'এমবিবিএস, সিসিডি (বারডেম), সিএমইউ, ডিএমইউ, এফএমডি',
        specialty: 'প্রসূতি ও স্ত্রীরোগ চিকিৎসক',
        workplace: 'এক্স মেডিকেল অফিসার, \nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        time: 'দুপুর ১২টা - দুপুর ৩টা',
      }),
      makeDoctor({
        name: 'ডা: ফাতেমা-তুজ-জোহরা',
        quals: 'এমবিবিএস, এমএরসিওজি (ইউকে) পার্ট-২',
        specialty: 'প্রসূতি ও স্ত্রীরোগ চিকিৎসক',
        workplace: 'এক্স মেডিকেল অফিসার, চট্টগ্রাম মেট্রোপলিটন হাসপাতাল\nএক্স আবাসিক মেডিকেল অফিসার\nহাটহাজারী মা ও শিশু হাসপাতাল',
        time: 'দুপুর ১২টা - দুপুর ৩টা',
      }),
    ],
  }),
  // ----- নাক-কান-গলা রোগ বিভাগ -----
  makeDepartment({
    name: 'নাক-কান-গলা রোগ বিভাগ', icon: 'Ear', color: '#522fd1',
    doctors: [
      makeDoctor({
        name: 'ডা: মাহমুদ উল্লাহ ফারুকী ',
        quals: 'এমবিবিএস (ঢাকা মেডিকেল কলেজ) \nবিসিএস (স্বাস্থ্য) এম.এস (ইএনটি)',
        specialty: 'নাক-কান-গলা রোগ বিশেষজ্ঞ এবং \nহেড-নেক সার্জন কনসালটেন্ট',
        workplace: 'সহকারী অধ্যাপক, ইএনটি ও হেড নেক সার্জারী',
        time: 'রাত ০৯টা - রাত ১০টা',
      }),
      makeDoctor({
        name: 'ডা: মোঃ ইকবাল হোসেন',
        quals: 'এমবিবিএস, পিজিটি(ইএনটি), ডিএলও (কোর্স)  \nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        specialty: 'নাক কান গলা ও হেড নেক রোগের অভিজ্ঞ চিকিৎসক',
        workplace: '',
        time: 'সন্ধ্যা ৬ টা রাত ৮ টা',
      }),
    ],
  }),
  // ----- চর্মরোগ বিভাগ -----
  makeDepartment({
    name: 'চর্মরোগ বিভাগ', icon: 'Sparkles', color: '#e0653a',
    doctors: [
      makeDoctor({
        name: 'ডা: মো. ওমর ফারুখ (রাজু)',
        quals: 'এমবিবিএস, ডিডিভি (বিএমইউ)',
        specialty: 'চর্ম, এলার্জি, কুষ্ঠ, এইডস, যৌনরোগ বিশেষজ্ঞ ও ডার্মাটোসার্জন',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল।',
        time: 'সন্ধ্যা ৭টা -রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডাঃ আয়াতুল্লাহ মোহাম্মদ সালমান',
        quals: 'এমবিবিএস (দিনাজপুর মেডিকেল কলেজ), ডিভস (ডার্মাটোলজি)\nপিজিটি (যৌন ও চর্ম), সিসিডি (বারডেম), এমসিজিপি (কোর্স), সিএমইউ',
        specialty: 'চর্মরোগ বিশেষজ্ঞ',
        workplace: '',
        time: 'সকাল ১১টা - দুপুর ১টা',
      }),
      makeDoctor({
        name: 'ডাঃ সাবরিনা ইসলাম ফারমী',
        quals: 'এম.বি.বি.এস, ডি.এম.ইউ (আল্ট্রা) সিসিডি (বারডেম), পিজিটি (চর্ম ও যৌন)',
        specialty: 'এলার্জি, চর্ম, যৌন, ডায়াবেটিস ও আল্ট্রাসনোগ্রাফীতে অভিজ্ঞ',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ ও হাসপাতাল',
        time: 'সন্ধ্যা ৬টা - রাত ৮টা',
      }),
    ],
  }),
  // ----- ডেন্টাল বিভাগ -----
  makeDepartment({
    name: 'ডেন্টাল বিভাগ', icon: 'Smile', color: '#2b3f8f',
    doctors: [
      makeDoctor({
        name: 'ডাঃ নুসরাত পারভীন রূপা',
        quals: 'বি.ডি.এস (ঢাকা ডেন্টাল কলেজ), \nপিজিটি (কনজারভেটিভ ডেন্টিস্ট্রি)',
        specialty: 'ওরাল এন্ড ডেন্টাল সার্জন',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
        time: 'বিকাল ৫.০০টা - রাত ৮.০০টা',
      }),
      makeDoctor({
        name: 'ডাঃ ইশতিয়াক মো: আশফাক',
        quals: 'বিডিএস (ডিইউ) পিজিটি (ওএমএস)\nএক্স-অনারারী মেডিকেল অফিসার, \nওরাল এন্ড ম্যাক্সিলোফেসিয়াল সার্জারী (বিএসএমএমইউ) \nকনসালটেন্ট, ওরাল এন্ড ডেন্টাল ইউনিট \nচট্টগ্রাম সিটি কর্পোরেশন মোস্তফা হাকিম মাতৃসদন হাসপাতাল।',
        specialty: 'ওরাল এন্ড ডেন্টাল সার্জন',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ',
        time: 'সকাল ১০টা - দুপুর ২টা',
      }),
    ],
  }),
  // ----- হৃদরোগ বিভাগ -----
  makeDepartment({
    name: 'হৃদরোগ বিভাগ', icon: 'Activity', color: '#d1392f',
    doctors: [
      makeDoctor({
        name: 'ডা: মোহাম্মদ শহীদুল্লাহ',
        quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), ডি কার্ড, এমডি (কার্ডিওলজী)',
        specialty: 'হৃদরোগ, প্রেশার ও মেডিসিন বিশেষজ্ঞ',
        workplace: 'মেম্বার অব আমেরিকান কলেজ অব কার্ডিওলজি প্রিভেনটিব, ক্লিনিক্যাল এন্ড ইন্টারভেনশনাল কার্ডিওলজিস্ট',
        time: 'সন্ধ্যা ৬টা রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডা: তাজকিয়া তামকিন',
        quals: 'এমবিবিএস (সিএমসি), ডি-কার্ড (বিএমইউ) \n এফসিপিএস কার্ডিওলজি (কোর্স) \nট্রেইন্ড ইন ইকোকার্ডিওগ্রাফি (বাফ)',
        specialty: 'হৃদরোগ, উচ্চ রক্তচাপ ও বাতজ্বর বিশেষজ্ঞ ও মেডিসিনে অভিজ্ঞ',
        workplace: 'কনসালটেন্ট (কার্ডিওলজি) \nসম্মিলিত সামরিক হাসপাতাল (সিএমএইচ), চট্টগ্রাম।',
        time: 'বিকাল ৫টা - রাত ৭টা',
      }),
      makeDoctor({
        name: 'ডাঃ সুজন কুমার ধর',
        quals: 'এম.বি.বি.এস, ডি-কার্ড সিসিডি (ডায়াবেটিস) পি.জি.টি. (মেডিসিন)',
        specialty: 'হৃদরোগ, বাত জ্বর, উচ্চ রক্তচাপ, মেডিসিন বিশেষজ্ঞ ও ডায়াবেটোলজিস্ট',
        workplace: 'কনসালটেন্ট কার্ডিওলজিস্ট',
        time: 'সকাল ১১টা - দুপুর ১টা',
      }),
      
    ],
  }),
  // ----- শিশু বিভাগ -----
  makeDepartment({
    name: 'শিশু বিভাগ', icon: 'Baby', color: '#159a72',
    doctors: [
      makeDoctor({
        name: 'ডা: সুনন্দা শীল',
        quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), ডিসিএইচ',
        specialty: 'নবজাতক, শিশু ও কিশোর রোগ বিশেষজ্ঞ ',
        workplace: 'সহযোগী অধ্যাপক (শিশুস্বাস্থ্য বিভাগ) \nচট্টগ্রাম মেডিকেল কলেজ হাসপাতাল',
        time: 'সন্ধ্যা ৬টা - রাত ৮টা',
      }),
      makeDoctor({
        name: 'ডা: নুসাইবা দ্বীন মুহাম্মদ',
        quals: 'এমবিবিএস (চট্টগ্রাম মা ও শিশু হাসপাতাল মেডিকেল কলেজ) \nএমডি (শিশু স্বাস্থ্য),',
        specialty: 'নবজাতক, শিশু ও কিশোর রোগ বিশেষজ্ঞ ',
        workplace: '',
        time: 'বিকাল ৩টা - বিকাল ৫টা',
      }),
      makeDoctor({
        name: 'ডা: তাজরিনা রহমান জেনি',
        quals: 'এমবিবিএস, ডিসিএইচ (বিএসএমএমইউ) \nএফসিপিএস (শেষ পর্ব), সিসিডি (বারডেম)',
        specialty: 'নবজাতক, শিশু ও কিশোর রোগ বিশেষজ্ঞ ',
        workplace: 'রেজিস্ট্রার (শিশু স্বাস্থ্য বিভাগ), \nচট্টগ্রাম ইন্টারন্যাশনাল মেডিকেল কলেজ হাসপাতাল।',
        time: 'বিকাল ৫টা - রাত ৮টা',
      }),
      makeDoctor({
        name: 'ডাঃ সুলতানা ইয়াসমিন',
        quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য), ডিসিএইচ (বিএমইউ)\nএফসিপিএস, ফাইনাল পার্ট (পেডিয়াট্রিক নেফ্রোলজি)',
        specialty: 'নবজাতক, শিশু ও কিশোর রোগ বিশেষজ্ঞ',
        workplace: '',
        time: 'সন্ধ্যা ৭টা - রাত ৮টা',
      }),
    ],
  }),
  // ----- অর্থোপেডিক বিভাগ -----
  makeDepartment({
    name: 'অর্থোপেডিক বিভাগ', icon: 'Bone', color: '#0e8ca3',
    doctors: [
      makeDoctor({
        name: 'ডাঃ মোঃ দিদারুল আলম',
        quals: 'এমবিবিএস, বিসিএস (স্বাস্থ্য) \nডি-অর্থো (বিএমইউ), এও ট্রমা (বেসিক) \nঅর্থোপেডিক ও ট্রমা সার্জন',
        specialty: 'হাঁড়-জোড়া, বাত-ব্যথা, জয়েন্ট ও মেরুদণ্ড রোগ বিশেষজ্ঞ',
        workplace: 'চট্টগ্রাম মেডিকেল কলেজ ও হাসপাতাল।',
        time: 'সন্ধ্যা ৬ টা- রাত ৮ টা',
      }),
      makeDoctor({
        name: 'ডাঃ আবু জোনায়েদ রিফাত',
        quals: 'এমবিবিএস, পিজিটি (অর্থোপেডিক সার্জারি), পিজিটি (সার্জারি)',
        specialty: 'হাঁড়-জোড়া, বাত-ব্যথা, জয়েন্ট ও \nমেরুদণ্ড রোগ চিকিৎসক',
        workplace: 'এক্স মেডিকেল অফিসার  \nচট্টগ্রাম ইন্টারন্যাশনাল মেডিকেল কলেজ হাসপাতাল',
        time: 'বিকাল ৫.০০টা - রাত ৮.০০টা',
      }),
    ],
  }),
  // ----- খাদ্য ও পুষ্টি বিভাগ -----
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
  // ----- জেনারেল ফিজিশিয়ান -----
  makeDepartment({
    name: 'জেনারেল ফিজিশিয়ান', icon: 'User', color: '#7a2d5c',
    doctors: [
      makeDoctor({
        name: 'ডা: সাইফুল ইসলাম',
        quals: 'এমবিবিএস (সিইউ), জেনারেল ফিজিশিয়ান',
        specialty: 'বাত ব্যথা ও চর্মরোগ চিকিৎসক',
        workplace: '',
        time: 'সকাল ১০টা - দুপুর ২টা',
      }),
      makeDoctor({
        name: 'ডা: তোফায়েল আহমদ',
        quals: 'এমবিবিএস (সিএমসি), বিসিএস (স্বাস্থ্য) জেনারেল ফিজিশিয়ান',
        specialty: 'এডভ্যান্স ট্রেনিং টিভিএস, কালার ডপলার উন্নত প্রশিক্ষণ',
        workplace: '',
        time: 'সন্ধ্যা ৭টা - রাত ৯টা',
      }),
      makeDoctor({
        name: 'ডা: চৌধুরী আরজিনা ইয়ামিন',
        quals: 'এমবিবিএস (সিএমসি), এমপিএইচ, ডিএমইউ (আল্ট্রাসনোগ্রাফি) \nসিসিডি (ডায়াবেটিস-বারডেম), ইসিডিভি (স্কিন ও ভিডি)',
        specialty: 'নবজাতক ও শিশু রোগে অভিজ্ঞ',
        workplace: '',
        time: 'সকাল ১১টা - দুপুর ১টা',
      }),
      makeDoctor({
        name: 'ডাঃ আফরোজা সুলতানা নাসরিন',
        quals: 'এমবিবিএস, পিজিটি (গাইনি এন্ড অবস্) ডিএমইউ (আল্ট্রা) \nএডভ্যান্স ট্রেনিং অন টিভিএস, ফিটাল এনোমেলি স্ক্যান, \nথাইরয়েড এন্ড বেস্ট কনসালটেন্ট সনোলজিস্ট',
        specialty: 'প্রসূতি ও স্ত্রীরোগ চিকিৎসক',
        workplace: '',
        time: 'বিকাল ৫টা - সন্ধ্যা ৭টা',
      }),
    ],
  }),
];

// ===================== FOOTER =====================
const SEED_FOOTER = {
  address: 'বাকলিয়া এক্সেস রোড,\nবাকলিয়া, চট্টগ্রাম।',
  website: 'alafiyahhospital.com',
  logo: '/logo.png',
  contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
  phones: ['01886 776 512', '01886 776 513'],
};

// ===================== CSS (UNCHANGED) =====================
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

.dpb .panel-switcher{display:flex;align-items:center;gap:10px;padding:10px 20px;background:#fff;border-bottom:1px solid #e2e6ee;flex-wrap:wrap;position:sticky;top:57px;z-index:19;}
.dpb .panel-switcher-scroll{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0;}
.dpb .day-btn-panel{border:1px solid #e2e6ee;background:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;color:#1f2937;cursor:pointer;transition:all 0.2s;}
.dpb .day-btn-panel:hover{border-color:#1c5fa8;color:#1c5fa8;}
.dpb .day-btn-panel.active{background:#1c5fa8;color:#fff;border-color:#1c5fa8;}

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
`;

// ===================== SAVE INDICATOR =====================
function SaveIndicator({ status }) {
  if (status === 'idle') return null;
  const text = status === 'saving' ? 'সংরক্ষণ হচ্ছে...' : status === 'saved' ? '✓ সংরক্ষিত হয়েছে' : 'সংরক্ষণ ব্যর্থ হয়েছে';
  return <span className="save-indicator">{text}</span>;
}

// ===================== DoctorRow (with checkbox) =====================
function DoctorRow({ doc, index, total, checked, onToggleChecked, onEdit, onDelete, onMoveUp, onMoveDown }) {
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

// ===================== DepartmentCard =====================
function DepartmentCard({ dept, index, total, checkedIds, onEdit, onDelete, onMoveUp, onMoveDown, onAddDoctor, onEditDoctor, onDeleteDoctor, onMoveDoctorUp, onMoveDoctorDown, onToggleDoctorChecked, onToggleAllChecked }) {
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
            checked={checkedIds.has(doc.id)}
            onToggleChecked={() => onToggleDoctorChecked(doc.id)}
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
    onSave({ 
      name: trimmed, 
      title: titleForName(trimmed), 
      duplicate,
      selectedIds: [...selectedIds] 
    });
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
          <h3>{mode === 'add' ? 'নতুন দিন/প্যানেল যোগ করুন' : 'নাম পরিবর্তন করুন'}</h3>
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
              <button className="panel-pill-icon" onClick={() => onRename(p)} title="নাম পরিবর্তন"><Pencil size={11} /></button>
              {panels.length > 1 ? (
                <button
                  className={confirmDeleteId === p.id ? 'panel-pill-icon danger-confirm' : 'panel-pill-icon'}
                  onClick={() => (confirmDeleteId === p.id ? onDelete(p.id) : setConfirmDeleteId(p.id))}
                  title="এই দিনের প্যানেল মুছুন"
                >
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
          <button className="toggle-all-btn" onClick={onToggleAll}>
            {allChecked ? 'সব বাদ দিন' : 'সব বাছুন'}
          </button>
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
          />
        ))}
      </section>

      <section className="panel-section">
        <label>ফুটার তথ্য (হাসপাতালের নাম, ঠিকানা ও যোগাযোগ)</label>
        <p className="section-hint">এই তথ্য সব দিনের জন্য একই থাকে — একবার দিলেই সব প্যানেলে দেখাবে</p>
        <div className="footer-form-grid">
          <div className="field">
            <label>হাসপাতাল/প্রতিষ্ঠানের নাম</label>
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
          <button className={clearConfirm ? 'btn btn-danger' : 'btn btn-outline'} onClick={onClearAll}>
            {clearConfirm ? 'আবার ক্লিক করে নিশ্চিত করুন' : 'সব আনচেক করুন'}
          </button>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '30px' }}>
        <button className="btn btn-primary" onClick={onGoPreview} style={{ padding: '11px 26px', fontSize: '14px' }}>
          প্রিভিউ দেখুন →
        </button>
      </div>
    </div>
  );
}

// ===================== Preview Components =====================
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
        <button className="btn btn-secondary" onClick={downloadPNG}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {' '}PNG ডাউনলোড
        </button>
        <button className="btn btn-secondary" onClick={downloadPDF}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          {' '}PDF ডাউনলোড
        </button>
      </div>

      <div id="dpb-print-area" className="poster-page" ref={printRef}>
        <div className="poster-header"><h1>{panel.title}</h1></div>
        {visibleDepartments.length === 0 ? (
          <div className="poster-empty-note" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
            "{panel.name}"-এর জন্য কোনো ডাক্তার নির্বাচন করা হয়নি।
          </div>
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

// ===================== MAIN COMPONENT =====================
export default function DoctorPanelBuilder() {
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [activePanelId, setActivePanelId] = useState(null);
  const [footer, setFooter] = useState(SEED_FOOTER);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('edit');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [deptModal, setDeptModal] = useState(null);
  const [doctorModal, setDoctorModal] = useState(null);
  const [panelModal, setPanelModal] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const debounceRef = useRef(null);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load master departments
        const deptDocRef = doc(db, 'master', 'departments');
        const deptDoc = await getDoc(deptDocRef);
        let depts = [];
        if (deptDoc.exists()) {
          depts = deptDoc.data().departments;
        } else {
          depts = SEED_DEPARTMENTS;
          await setDoc(deptDocRef, { departments: depts });
        }
        setDepartments(depts);

        // 2. Load all panels
        const panelsSnapshot = await getDocs(collection(db, 'panels'));
        const panelList = [];
        panelsSnapshot.forEach((doc) => {
          panelList.push({ id: doc.id, ...doc.data() });
        });
        if (panelList.length === 0) {
          // Create default panel for Saturday
          const defaultPanel = {
            id: 'শনিবার',
            name: 'শনিবার',
            title: 'শনিবারের ডক্টরস প্যানেল',
            activeDoctorIds: depts.flatMap(d => d.doctors.map(doc => doc.id)),
          };
          await setDoc(doc(db, 'panels', 'শনিবার'), defaultPanel);
          panelList.push(defaultPanel);
        }
        setPanels(panelList);
        const active = panelList[0];
        setActivePanelId(active.id);
        setCheckedIds(new Set(active.activeDoctorIds || []));
        setLoading(false);
      } catch (error) {
        console.error('Firebase load error:', error);
        alert('ডেটা লোড করতে সমস্যা হয়েছে। Firebase কনফিগারেশন চেক করুন।');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save footer to Firebase (global)
  const saveFooter = async (newFooter) => {
    try {
      await setDoc(doc(db, 'master', 'footer'), newFooter);
    } catch (e) { console.error('Footer save error:', e); }
  };

  // Save panel to Firebase
  const savePanelToFirebase = async (panel) => {
    try {
      await setDoc(doc(db, 'panels', panel.id), panel);
    } catch (e) { console.error('Panel save error:', e); }
  };

  // Save departments to Firebase
  const saveDepartments = async (newDepts) => {
    try {
      await setDoc(doc(db, 'master', 'departments'), { departments: newDepts });
    } catch (e) { console.error('Departments save error:', e); }
  };

  // Delete panel from Firebase
  const deletePanelFromFirebase = async (panelId) => {
    try {
      await deleteDoc(doc(db, 'panels', panelId));
    } catch (e) { console.error('Delete panel error:', e); }
  };

  const activePanel = panels.find(p => p.id === activePanelId) || panels[0];
  const allDoctorIds = departments.flatMap(d => d.doctors.map(doc => doc.id));
  const allChecked = allDoctorIds.length > 0 && allDoctorIds.every(id => checkedIds.has(id));

  // Handlers
  const updatePanel = (updater, immediate) => {
    const updated = updater(activePanel);
    const newPanels = panels.map(p => p.id === activePanelId ? updated : p);
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

  const handleUpdateTitle = (title) => updatePanel(p => ({ ...p, title }), true);

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
  const handleRemovePhone = (idx) => handleUpdateFooter({ phones: footer.phones.filter((_, i) => i !== idx) });

  const handleAddDept = () => setDeptModal({ mode: 'add' });
  const handleEditDept = (dept) => setDeptModal({ mode: 'edit', dept });
  const handleSaveDept = (fields) => {
    if (deptModal.mode === 'add') {
      updateDepartments(d => [...d, makeDepartment(fields)], true);
    } else {
      const deptId = deptModal.dept.id;
      updateDepartments(d => d.map(dept => dept.id === deptId ? { ...dept, ...fields } : dept), true);
    }
    setDeptModal(null);
  };
  const handleDeleteDept = (deptId) => {
    const removedIds = departments.find(d => d.id === deptId)?.doctors.map(doc => doc.id) || [];
    updateDepartments(d => d.filter(dept => dept.id !== deptId), true);
    // Also remove from checkedIds of all panels
    const newPanels = panels.map(p => ({
      ...p,
      activeDoctorIds: p.activeDoctorIds.filter(id => !removedIds.includes(id))
    }));
    setPanels(newPanels);
    newPanels.forEach(p => savePanelToFirebase(p));
  };
  const handleMoveDept = (deptId, dir) => {
    const idx = departments.findIndex(d => d.id === deptId);
    const ni = idx + dir;
    if (ni < 0 || ni >= departments.length) return;
    const newDepts = [...departments];
    [newDepts[idx], newDepts[ni]] = [newDepts[ni], newDepts[idx]];
    updateDepartments(() => newDepts, true);
  };

  const handleAddDoctor = (deptId) => setDoctorModal({ deptId, mode: 'add' });
  const handleEditDoctor = (deptId, doctor) => setDoctorModal({ deptId, mode: 'edit', doctor });
  const handleSaveDoctor = (fields) => {
    const deptId = doctorModal.deptId;
    if (doctorModal.mode === 'add') {
      const newDoctor = makeDoctor(fields);
      updateDepartments(d => d.map(dept => 
        dept.id === deptId ? { ...dept, doctors: [...dept.doctors, newDoctor] } : dept
      ), true);
      // Add to current panel
      updatePanel(p => ({ ...p, activeDoctorIds: [...p.activeDoctorIds, newDoctor.id] }), true);
    } else {
      const doctorId = doctorModal.doctor.id;
      updateDepartments(d => d.map(dept => 
        dept.id === deptId ? { ...dept, doctors: dept.doctors.map(doc => doc.id === doctorId ? { ...doc, ...fields } : doc) } : dept
      ), true);
    }
    setDoctorModal(null);
  };
  const handleDeleteDoctor = (deptId, doctorId) => {
    updateDepartments(d => d.map(dept => 
      dept.id === deptId ? { ...dept, doctors: dept.doctors.filter(doc => doc.id !== doctorId) } : dept
    ), true);
    // Remove from all panels
    const newPanels = panels.map(p => ({
      ...p,
      activeDoctorIds: p.activeDoctorIds.filter(id => id !== doctorId)
    }));
    setPanels(newPanels);
    newPanels.forEach(p => savePanelToFirebase(p));
  };
  const handleMoveDoctor = (deptId, doctorId, dir) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;
    const idx = dept.doctors.findIndex(doc => doc.id === doctorId);
    const ni = idx + dir;
    if (ni < 0 || ni >= dept.doctors.length) return;
    const newDepts = departments.map(d => {
      if (d.id !== deptId) return d;
      const newDoctors = [...d.doctors];
      [newDoctors[idx], newDoctors[ni]] = [newDoctors[ni], newDoctors[idx]];
      return { ...d, doctors: newDoctors };
    });
    updateDepartments(() => newDepts, true);
  };

  const handleToggleDoctorChecked = (doctorId) => {
    const newIds = checkedIds.has(doctorId) 
      ? [...checkedIds].filter(id => id !== doctorId)
      : [...checkedIds, doctorId];
    setCheckedIds(new Set(newIds));
    updatePanel(p => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleToggleDeptAllChecked = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;
    const deptIds = dept.doctors.map(doc => doc.id);
    const allChecked = deptIds.every(id => checkedIds.has(id));
    let newIds;
    if (allChecked) {
      newIds = [...checkedIds].filter(id => !deptIds.includes(id));
    } else {
      newIds = [...checkedIds];
      deptIds.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
    }
    setCheckedIds(new Set(newIds));
    updatePanel(p => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleToggleAll = () => {
    let newIds;
    if (allChecked) {
      newIds = [];
    } else {
      newIds = allDoctorIds;
    }
    setCheckedIds(new Set(newIds));
    updatePanel(p => ({ ...p, activeDoctorIds: newIds }), true);
  };

  const handleClearActivePanelChecks = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3500);
      return;
    }
    setClearConfirm(false);
    setCheckedIds(new Set());
    updatePanel(p => ({ ...p, activeDoctorIds: [] }), true);
  };

  const handleSwitchPanel = (panelId) => {
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      setActivePanelId(panelId);
      setCheckedIds(new Set(panel.activeDoctorIds || []));
    }
  };

  const handleAddPanel = async (fields) => {
    const newPanel = {
      id: fields.name,
      name: fields.name,
      title: fields.title,
      activeDoctorIds: fields.duplicate ? [...activePanel.activeDoctorIds] : (fields.selectedIds || []),
    };
    await savePanelToFirebase(newPanel);
    setPanels([...panels, newPanel]);
    setActivePanelId(newPanel.id);
    setCheckedIds(new Set(newPanel.activeDoctorIds));
    setPanelModal(null);
  };

  const handleRenamePanel = (fields) => {
    const panelId = panelModal.panel.id;
    const updated = panels.map(p => p.id === panelId ? { ...p, name: fields.name } : p);
    setPanels(updated);
    savePanelToFirebase(updated.find(p => p.id === panelId));
    setPanelModal(null);
  };

  const handleDeletePanel = async (panelId) => {
    if (panels.length <= 1) return;
    await deletePanelFromFirebase(panelId);
    const remaining = panels.filter(p => p.id !== panelId);
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
          onMoveDept={handleMoveDept}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onMoveDoctor={handleMoveDoctor}
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
    </div>
  );
}