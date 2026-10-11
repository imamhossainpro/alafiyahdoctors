// src/utils/locationTracker.js
// ==================================================
// 📍 Location Tracker — GPS + Geocode + Device
// ==================================================
// ✅ GPS capture with timeout
// ✅ Reverse geocoding (OpenStreetMap Nominatim)
// ✅ Device info
// ✅ Distance calculation
// ✅ Fallback: manual address → approximate GPS
// ==================================================
import {
  distanceFromHospital,
  formatDistance,
  getDistanceCategoryInfo,
} from './distance';
import { getApproximateGPS } from '../config/locations';

// ==================================================
// ✅ GPS Coordinates Capture
// ==================================================
export const captureGPS = () => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('⚠️ GPS capture timeout');
      resolve(null);
    }, 12000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => {
        clearTimeout(timeout);
        console.warn('⚠️ GPS error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
};

// ==================================================
// ✅ Reverse Geocoding (OpenStreetMap Nominatim)
// ==================================================
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      {
        headers: {
          'User-Agent': 'Al-Afiyah-Hospital-App/1.0',
        },
      }
    );

    if (!response.ok) throw new Error('Reverse geocode failed');
    const data = await response.json();
    const addr = data.address || {};

    return {
      country: addr.country || '',
      countryCode: addr.country_code?.toUpperCase() || '',
      division: addr.state || addr.region || '',
      district: addr.state_district || addr.county || '',
      city: addr.city || addr.town || addr.village || '',
      area: addr.suburb || addr.neighbourhood || '',
      road: addr.road || '',
      postcode: addr.postcode || '',
      fullAddress: data.display_name || '',
    };
  } catch (err) {
    console.warn('⚠️ Reverse geocode failed:', err.message);
    return null;
  }
};

// ==================================================
// ✅ Device Info
// ==================================================
export const getDeviceInfo = () => {
  if (typeof navigator === 'undefined') return {};

  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) deviceType = 'Mobile';
  if (/iPad|Tablet/i.test(ua)) deviceType = 'Tablet';

  return {
    userAgent: ua,
    browser,
    os,
    deviceType,
    language: navigator.language || '',
    platform: navigator.platform || '',
    screenSize:
      typeof window !== 'undefined'
        ? `${window.screen.width}x${window.screen.height}`
        : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    referrer: typeof document !== 'undefined' ? document.referrer || 'Direct' : '',
  };
};

// ==================================================
// ✅ Complete Location Bundle (All-in-one)
// ==================================================
export const captureCompleteLocation = async () => {
  try {
    const gps = await captureGPS();

    let geo = null;
    if (gps) {
      geo = await reverseGeocode(gps.latitude, gps.longitude);
    }

    const device = getDeviceInfo();

    let distance = null;
    if (gps) {
      const km = distanceFromHospital(gps.latitude, gps.longitude);
      const catInfo = getDistanceCategoryInfo(km);
      distance = {
        distanceKm: km,
        distanceText: formatDistance(km),
        category: catInfo.category,
        categoryLabel: catInfo.label,
      };
    }

    const summaryParts = [
      geo?.area,
      geo?.city,
      geo?.district,
      geo?.division,
    ].filter(Boolean);
    const uniqueSummary = [...new Set(summaryParts)];

    return {
      gps: gps || null,
      geo: geo || null,
      device,
      distance,
      summary:
        uniqueSummary.length > 0
          ? uniqueSummary.join(', ')
          : 'Unknown Location',
      capturedAt: new Date().toISOString(),
      source: gps ? 'gps' : 'none',
    };
  } catch (err) {
    console.error('❌ captureCompleteLocation error:', err);
    return {
      gps: null,
      geo: null,
      device: getDeviceInfo(),
      distance: null,
      summary: 'Location not captured',
      capturedAt: new Date().toISOString(),
      source: 'error',
    };
  }
};

// ==================================================
// ✅ Build Firestore-payload for booking location
// ==================================================
// @param {Object} location       — output from captureCompleteLocation()
// @param {string} manualAddress  — patient's typed address (fallback)
// ==================================================
export const buildBookingLocationPayload = (
  location,
  manualAddress = ''
) => {
  // ═══════════════════════════════════════════════════
  // ✅ Case 1: GPS captured successfully
  // ═══════════════════════════════════════════════════
  if (location?.gps) {
    return {
      bookingLocation: {
        latitude: location.gps.latitude,
        longitude: location.gps.longitude,
        accuracy: location.gps.accuracy,

        country: location.geo?.country || '',
        countryCode: location.geo?.countryCode || '',
        division: location.geo?.division || '',
        district: location.geo?.district || '',
        city: location.geo?.city || '',
        area: location.geo?.area || '',
        road: location.geo?.road || '',
        postcode: location.geo?.postcode || '',
        fullAddress: location.geo?.fullAddress || '',

        browser: location.device?.browser || '',
        os: location.device?.os || '',
        deviceType: location.device?.deviceType || '',
        language: location.device?.language || '',
        screenSize: location.device?.screenSize || '',
        timezone: location.device?.timezone || '',
        referrer: location.device?.referrer || '',
        userAgent: location.device?.userAgent || '',

        distanceKm: location.distance?.distanceKm ?? null,
        distanceText: location.distance?.distanceText || '—',
        distanceCategory: location.distance?.category || 'unknown',

        source: 'gps',
        capturedAt: location.capturedAt || new Date().toISOString(),
      },
      bookingLocationSummary:
        location.summary || 'Unknown Location',
      bookingDistanceKm: location.distance?.distanceKm ?? null,
      bookingDistanceText: location.distance?.distanceText || '—',
      bookingDistanceCategory: location.distance?.category || 'unknown',
      bookingDistanceCategoryLabel:
        location.distance?.categoryLabel || 'অজানা',
    };
  }

  // ═══════════════════════════════════════════════════
  // ✅ Case 2: GPS failed BUT manual address available
  // ═══════════════════════════════════════════════════
  const trimmedAddress = String(manualAddress || '').trim();
  if (trimmedAddress) {
    const approx = getApproximateGPS(trimmedAddress);

    if (approx) {
      const km = distanceFromHospital(approx.lat, approx.lng);
      const catInfo = getDistanceCategoryInfo(km);

      return {
        bookingLocation: {
          latitude: approx.lat,
          longitude: approx.lng,
          accuracy: null,

          country: 'Bangladesh',
          countryCode: 'BD',
          division: 'Chattogram',
          district: 'Chattogram',
          city: 'Chattogram',
          area: approx.matchedName || trimmedAddress,
          road: '',
          postcode: '',
          fullAddress: trimmedAddress,

          browser: location?.device?.browser || '',
          os: location?.device?.os || '',
          deviceType: location?.device?.deviceType || '',
          language: location?.device?.language || '',
          screenSize: location?.device?.screenSize || '',
          timezone: location?.device?.timezone || '',
          referrer: location?.device?.referrer || '',
          userAgent: location?.device?.userAgent || '',

          distanceKm: km,
          distanceText: formatDistance(km),
          distanceCategory: catInfo.category,

          source: 'manual-address-lookup',
          matchedName: approx.matchedName,
          matchType: approx.matchType,
          capturedAt: new Date().toISOString(),
        },
        bookingLocationSummary: trimmedAddress,
        bookingDistanceKm: km,
        bookingDistanceText: formatDistance(km),
        bookingDistanceCategory: catInfo.category,
        bookingDistanceCategoryLabel: catInfo.label,
      };
    }

    // ═══════════════════════════════════════════════════
    // ✅ Case 2b: Manual address but no GPS match found
    // ═══════════════════════════════════════════════════
    return {
      bookingLocation: {
        latitude: null,
        longitude: null,
        accuracy: null,

        country: 'Bangladesh',
        countryCode: 'BD',
        division: '',
        district: '',
        city: '',
        area: trimmedAddress,
        road: '',
        postcode: '',
        fullAddress: trimmedAddress,

        browser: location?.device?.browser || '',
        os: location?.device?.os || '',
        deviceType: location?.device?.deviceType || '',
        language: location?.device?.language || '',
        screenSize: location?.device?.screenSize || '',
        timezone: location?.device?.timezone || '',
        referrer: location?.device?.referrer || '',
        userAgent: location?.device?.userAgent || '',

        distanceKm: null,
        distanceText: '—',
        distanceCategory: 'unknown',

        source: 'manual-address-only',
        capturedAt: new Date().toISOString(),
      },
      bookingLocationSummary: trimmedAddress,
      bookingDistanceKm: null,
      bookingDistanceText: '—',
      bookingDistanceCategory: 'unknown',
      bookingDistanceCategoryLabel: 'অজানা',
    };
  }

  // ═══════════════════════════════════════════════════
  // ✅ Case 3: Nothing available
  // ═══════════════════════════════════════════════════
  return {
    bookingLocation: null,
    bookingLocationSummary: 'Location not captured',
    bookingDistanceKm: null,
    bookingDistanceText: '—',
    bookingDistanceCategory: 'unknown',
    bookingDistanceCategoryLabel: 'অজানা',
  };
};

export default {
  captureGPS,
  reverseGeocode,
  getDeviceInfo,
  captureCompleteLocation,
  buildBookingLocationPayload,
};