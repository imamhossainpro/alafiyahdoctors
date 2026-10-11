// src/utils/mapsLink.js
// ==================================================
// 🗺️ Google Maps Link Builder
// ==================================================
// ✅ Direction link: Hospital → Patient
// ✅ Search link: Patient location only
// ✅ Fallback: manual address search
// ==================================================

import { HOSPITAL_CONFIG } from '../config/hospital';

const HOSPITAL_LAT = HOSPITAL_CONFIG.location.latitude;
const HOSPITAL_LNG = HOSPITAL_CONFIG.location.longitude;
const HOSPITAL_NAME = encodeURIComponent(HOSPITAL_CONFIG.name);

/**
 * ✅ Build "Directions" link from Hospital to Patient
 * Opens Google Maps with turn-by-turn navigation
 *
 * @param {number} lat - Patient latitude
 * @param {number} lng - Patient longitude
 * @param {string} [patientLabel] - Optional patient name/label
 * @returns {string} Google Maps URL
 */
export const buildDirectionsLink = (lat, lng, patientLabel = '') => {
  if (!lat || !lng) return null;

  // ✅ Format: https://www.google.com/maps/dir/?api=1&origin=HOSPITAL&destination=PATIENT&travelmode=driving
  const origin = `${HOSPITAL_LAT},${HOSPITAL_LNG}`;
  const destination = `${lat},${lng}`;

  const params = new URLSearchParams({
    api: '1',
    origin: origin,
    destination: destination,
    travelmode: 'driving',
    dir_action: 'navigate',
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

/**
 * ✅ Build "Search" link for a location name (manual address)
 * Opens Google Maps search
 *
 * @param {string} locationName - Location/address name
 * @returns {string} Google Maps URL
 */
export const buildSearchLink = (locationName) => {
  if (!locationName) return null;
  const query = encodeURIComponent(`${locationName}, Chattogram, Bangladesh`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

/**
 * ✅ Build "View on Map" link for patient location only
 *
 * @param {number} lat - Patient latitude
 * @param {number} lng - Patient longitude
 * @returns {string} Google Maps URL
 */
export const buildViewLink = (lat, lng) => {
  if (!lat || !lng) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

/**
 * ✅ Universal helper — returns best available link
 * Priority: Directions (if GPS) > Search (if address) > null
 *
 * @param {object} appt - Appointment object
 * @returns {string|null} Google Maps URL
 */
export const buildBestMapLink = (appt) => {
  if (!appt) return null;

  // Priority 1: Check-in location (most recent, accurate)
  if (appt.checkInLocation?.latitude && appt.checkInLocation?.longitude) {
    return buildDirectionsLink(
      appt.checkInLocation.latitude,
      appt.checkInLocation.longitude,
      appt.name
    );
  }

  // Priority 2: Booking location with GPS
  if (appt.bookingLocation?.latitude && appt.bookingLocation?.longitude) {
    return buildDirectionsLink(
      appt.bookingLocation.latitude,
      appt.bookingLocation.longitude,
      appt.name
    );
  }

  // Priority 3: Check-in summary as text search
  if (
    appt.checkInLocationSummary &&
    appt.checkInLocationSummary !== 'Location not captured' &&
    appt.checkInLocationSummary !== 'Unknown Location'
  ) {
    return buildSearchLink(appt.checkInLocationSummary);
  }

  // Priority 4: Booking summary as text search
  if (
    appt.bookingLocationSummary &&
    appt.bookingLocationSummary !== 'Location not captured' &&
    appt.bookingLocationSummary !== 'Unknown Location'
  ) {
    return buildSearchLink(appt.bookingLocationSummary);
  }

  // Priority 5: Manual address
  if (appt.address) {
    return buildSearchLink(appt.address);
  }

  return null;
};

/**
 * ✅ Check if appointment has any location data
 */
export const hasLocationData = (appt) => {
  if (!appt) return false;
  return !!(
    (appt.checkInLocation?.latitude && appt.checkInLocation?.longitude) ||
    (appt.bookingLocation?.latitude && appt.bookingLocation?.longitude) ||
    (appt.checkInLocationSummary &&
      appt.checkInLocationSummary !== 'Location not captured') ||
    (appt.bookingLocationSummary &&
      appt.bookingLocationSummary !== 'Location not captured') ||
    appt.address
  );
};

export default {
  buildDirectionsLink,
  buildSearchLink,
  buildViewLink,
  buildBestMapLink,
  hasLocationData,
};