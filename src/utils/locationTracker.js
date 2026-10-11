// src/utils/locationTracker.js
// ==================================================
// 📍 Location Tracker — GPS + Geocode + Device
// ==================================================
import {
  distanceFromHospital,
  formatDistance,
  getDistanceCategoryInfo,
} from './distance';

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
        maximumAge: 300000, // 5 min cache
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
    // Step 1: GPS
    const gps = await captureGPS();

    // Step 2: Reverse geocode
    let geo = null;
    if (gps) {
      geo = await reverseGeocode(gps.latitude, gps.longitude);
    }

    // Step 3: Device
    const device = getDeviceInfo();

    // Step 4: Distance
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

    // Step 5: Summary
    const summaryParts = [geo?.area, geo?.city, geo?.district, geo?.division].filter(Boolean);
    const uniqueSummary = [...new Set(summaryParts)];

    return {
      gps: gps || null,
      geo: geo || null,
      device,
      distance,
      summary: uniqueSummary.length > 0 ? uniqueSummary.join(', ') : 'Unknown Location',
      capturedAt: new Date().toISOString(),
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
    };
  }
};

// ==================================================
// ✅ Build Firestore-payload for booking location
// ==================================================
export const buildBookingLocationPayload = (location) => {
  if (!location?.gps) {
    return {
      bookingLocation: null,
      bookingLocationSummary: 'Location not captured',
      bookingDistanceKm: null,
      bookingDistanceText: '—',
      bookingDistanceCategory: 'unknown',
      bookingDistanceCategoryLabel: 'অজানা',
    };
  }

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

      capturedAt: location.capturedAt || new Date().toISOString(),
    },
    bookingLocationSummary: location.summary || 'Unknown Location',
    bookingDistanceKm: location.distance?.distanceKm ?? null,
    bookingDistanceText: location.distance?.distanceText || '—',
    bookingDistanceCategory: location.distance?.category || 'unknown',
    bookingDistanceCategoryLabel: location.distance?.categoryLabel || 'অজানা',
  };
};

export default {
  captureGPS,
  reverseGeocode,
  getDeviceInfo,
  captureCompleteLocation,
  buildBookingLocationPayload,
};