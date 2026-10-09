// src/dpb/utils.js
import { BOOKING_BASE_URL, COLOR_THEMES } from './constants';

export const uid = () =>
  Math.random().toString(36).slice(2, 10);

export const buildBookingUrl = (doctorId, doctorName = '', source = 'qr') => {
  if (!doctorId) return null;
  const params = new URLSearchParams();

  if (source === 'qr') {
    params.set('utm_source', 'qr');
    params.set('utm_medium', 'offline');
    params.set('utm_campaign', `doctor_${doctorId}`);
    if (doctorName) params.set('utm_content', encodeURIComponent(doctorName));
  } else if (source === 'direct') {
    params.set('utm_source', 'website');
    params.set('utm_medium', 'web_button');
    params.set('utm_campaign', `doctor_${doctorId}`);
    if (doctorName) params.set('utm_content', encodeURIComponent(doctorName));
  }

  const queryString = params.toString();
  return `${BOOKING_BASE_URL}/booking/${doctorId}${queryString ? `?${queryString}` : ''}`;
};

export const html2canvasIgnoreElements = (el) => {
  if (!el || !el.classList) return false;
  return (
    el.classList.contains('serial-booking-button') ||
    el.classList.contains('no-print')
  );
};

export const getOrderedDepartments = (departments, panelDepartmentOrder) => {
  if (!departments || departments.length === 0) return [];

  if (!panelDepartmentOrder || panelDepartmentOrder.length === 0) {
    return [...departments].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const orderMap = {};
  panelDepartmentOrder.forEach((deptId, index) => {
    orderMap[deptId] = index;
  });

  return [...departments].sort((a, b) => {
    const aOrder = orderMap[a.id] ?? 9999;
    const bOrder = orderMap[b.id] ?? 9999;
    return aOrder - bOrder;
  });
};

const TIME_REGEX = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/;

export const validateTimeFormat = (timeStr) => {
  if (!timeStr || !timeStr.trim()) return false;
  return TIME_REGEX.test(timeStr.trim());
};

export const standardizeTime = (timeStr) => {
  if (!timeStr || !timeStr.trim()) return '';
  const match = timeStr.trim().match(TIME_REGEX);
  if (!match) return timeStr.trim();
  const [, hour, minute, period] = match;
  const h = hour.padStart(2, '0');
  const p = period.toUpperCase();
  return `${h}:${minute} ${p}`;
};

export const timeToMinutes = (timeStr) => {
  const match = timeStr?.trim().match(TIME_REGEX);
  if (!match) return null;
  let [, hour, minute, period] = match;
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  const p = period.toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

export function makeDoctor(overrides) {
  return {
    id: uid(),
    name: '',
    nameEn: '',
    quals: '',
    specialty: '',
    workplace: '',
    timeSlots: [],
    imageUrl: '',
    ...(overrides || {}),
  };
}

export function makeDepartment(overrides) {
  return {
    id: uid(),
    name: '',
    icon: 'Stethoscope',
    color: COLOR_THEMES[0],
    doctors: [],
    ...(overrides || {}),
  };
}