// src/dpb/constants.js
import {
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain,
  Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer, Ear,
} from 'lucide-react';

export const DAY_NAMES = [
  'শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার',
  'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার',
];

export function titleForName(name) {
  return DAY_NAMES.indexOf(name) !== -1
    ? name + 'ের ডক্টরস প্যানেল'
    : name;
}

export const ICONS = {
  Stethoscope, Scissors, Heart, Baby, Bone, Syringe, Pill, Activity, Brain,
  Eye, Utensils, Smile, Sparkles, User, Droplet, Thermometer, Ear,
};

export const ICON_KEYS = Object.keys(ICONS);

export const COLOR_THEMES = [
  '#1c5fa8', '#2f9e52', '#9c3a9c', '#d1392f', '#0e8ca3',
  '#e0653a', '#2b3f8f', '#159a72', '#8a6a2e', '#7a2d5c',
  '#4438ab', '#475569',
];

export const RESTRICTED_ROLES = ['viewer', 'patient', 'user'];

export const BOOKING_BASE_URL = 'https://doctors.alafiyahhospital.com';

export const DEFAULT_FOOTER = {
  address: 'বাকলিয়া এক্সেস রোড,\nবাকলিয়া, চট্টগ্রাম।',
  website: 'alafiyahhospital.com',
  logo: '/logo.png',
  contactLabel: 'সিরিয়ালের এবং তথ্যের জন্যে যোগাযোগ',
  phones: ['01886 776 512', '01886 776 513'],
  hospitalName: 'আল আফিয়াহ হাসপাতাল',
  hospitalSubtitle: 'স্বাস্থ্যসেবায় বিশ্বাস',
};

export const DEFAULT_BRANDING = {
  name: 'আল আফিয়াহ হাসপাতাল',
  logo: '/logo.png',
};