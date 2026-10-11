// src/utils/distance.js
// ==================================================
// 📏 Distance Calculation — Haversine Formula
// ==================================================
import { HOSPITAL_CONFIG } from '../config/hospital';

const EARTH_RADIUS_KM = 6371;

// ✅ Haversine formula — two GPS coordinates এর মধ্যে distance (km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === null || lat1 === undefined ||
    lon1 === null || lon1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lon2 === null || lon2 === undefined
  ) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 10) / 10;
};

// ✅ Distance from hospital
export const distanceFromHospital = (lat, lon) => {
  return calculateDistance(
    HOSPITAL_CONFIG.location.latitude,
    HOSPITAL_CONFIG.location.longitude,
    lat,
    lon
  );
};

// ✅ Format distance for display
export const formatDistance = (km) => {
  if (km === null || km === undefined) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

// ✅ Distance category
export const getDistanceCategory = (km) => {
  if (km === null || km === undefined) return 'unknown';
  if (km <= 5) return 'near';
  if (km <= 20) return 'local';
  if (km <= 50) return 'district';
  if (km <= 100) return 'far';
  return 'very-far';
};

// ✅ Category with Bengali label + color
export const getDistanceCategoryInfo = (km) => {
  const category = getDistanceCategory(km);
  const info = {
    near:      { label: 'খুব কাছে',   labelEn: 'Very Near',  color: '#16a34a', bg: '#dcfce7', emoji: '🟢' },
    local:     { label: 'স্থানীয়',    labelEn: 'Local',      color: '#0891b2', bg: '#cffafe', emoji: '🔵' },
    district:  { label: 'জেলা',       labelEn: 'District',   color: '#d97706', bg: '#fef3c7', emoji: '🟡' },
    far:       { label: 'দূরে',       labelEn: 'Far',        color: '#ea580c', bg: '#fed7aa', emoji: '🟠' },
    'very-far':{ label: 'খুব দূরে',   labelEn: 'Very Far',   color: '#dc2626', bg: '#fee2e2', emoji: '🔴' },
    unknown:   { label: 'অজানা',      labelEn: 'Unknown',    color: '#94a3b8', bg: '#f1f5f9', emoji: '⚪' },
  };
  return { ...info[category], category };
};

// ✅ Full distance info (Firestore save করার জন্য)
export const buildDistanceInfo = (lat, lon) => {
  if (lat === null || lon === null) {
    return {
      distanceKm: null,
      distanceText: '—',
      category: 'unknown',
      categoryLabel: 'অজানা',
    };
  }
  const km = distanceFromHospital(lat, lon);
  const catInfo = getDistanceCategoryInfo(km);
  return {
    distanceKm: km,
    distanceText: formatDistance(km),
    category: catInfo.category,
    categoryLabel: catInfo.label,
  };
};

export default {
  calculateDistance,
  distanceFromHospital,
  formatDistance,
  getDistanceCategory,
  getDistanceCategoryInfo,
  buildDistanceInfo,
};