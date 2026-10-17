// src/utils/metaPixel.js
// ==================================================
// 📘 Meta Pixel — Advanced Matching Helper (Fixed)
// ==================================================
// ✅ Email, Phone, Name — SHA256 hashing সহ
// ✅ Phone E.164 format (8801XXXXXXXXX)
// ✅ SPA-তে PageView tracking
// ✅ Bengali name support (unicode-aware normalization)
// ✅ Advanced matching cache (hashes মেমোইজড)
// ✅ Event deduplication via eventID (CAPI-ready)
// ✅ Single-fire per event (no trackCustom duplication)
// ==================================================

// ==================================================
// ✅ Config
// ==================================================
const PIXEL_ID = '878410400741654';
const DEBUG = import.meta.env?.DEV === true;

const log = (...args) => {
  if (DEBUG) console.log(...args);
};
const warn = (...args) => {
  console.warn(...args);
};

// ==================================================
// ✅ SHA-256 hashing (browser built-in)
// ==================================================
const sha256 = async (value) => {
  if (!value) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    console.error('[Meta] SHA256 error:', err);
    return null;
  }
};

// ==================================================
// ✅ Advanced Matching Cache
// ==================================================
// একই email/phone/name বার বার hash করা এড়াতে
// key = `${type}:${value}`, value = hash
const hashCache = new Map();
const CACHE_LIMIT = 100;

const cachedHash = async (type, value) => {
  if (!value) return null;
  const key = `${type}:${value}`;

  if (hashCache.has(key)) return hashCache.get(key);

  const hash = await sha256(value);
  if (!hash) return null;

  // Cache limit (LRU-ish — oldest entry out)
  if (hashCache.size >= CACHE_LIMIT) {
    const firstKey = hashCache.keys().next().value;
    hashCache.delete(firstKey);
  }
  hashCache.set(key, hash);
  return hash;
};

// ==================================================
// ✅ Normalize functions (Meta requirement)
// ==================================================

// Email — lowercase + trim
const normalizeEmail = (email) => {
  if (!email) return null;
  return String(email).toLowerCase().trim();
};

// Phone — E.164 format (8801XXXXXXXXX)
const normalizePhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('88')) return '880' + digits.slice(2);
  if (digits.startsWith('0')) return '880' + digits.slice(1);
  return '880' + digits;
};

// ✅ Name — Bengali + English support
// Meta requires: lowercase, trim, no punctuation/digits
// ⚠️ OLD bug: `[^a-z\s]` stripped ALL Bengali characters → empty string
// ✅ NEW: unicode-aware — keeps \p{L} (letters) and \p{M} (marks)
const normalizeName = (name) => {
  if (!name) return null;
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\s]/gu, '') // keep letters + combining marks
    .replace(/\s+/g, ' ')
    .trim();
};

// ==================================================
// ✅ Build Advanced Matching object (hashed)
// ==================================================
const buildAdvancedMatching = async (userData = {}) => {
  const am = {};

  // Email
  if (userData.email) {
    const em = normalizeEmail(userData.email);
    const hashed = await cachedHash('em', em);
    if (hashed) am.em = hashed;
  }

  // Phone
  if (userData.phone) {
    const ph = normalizePhone(userData.phone);
    const hashed = await cachedHash('ph', ph);
    if (hashed) am.ph = hashed;
  }

  // Name (first + last)
  if (userData.name) {
    const normalized = normalizeName(userData.name);
    if (normalized) {
      const parts = normalized.split(' ').filter(Boolean);
      if (parts[0]) {
        const hashed = await cachedHash('fn', parts[0]);
        if (hashed) am.fn = hashed;
      }
      if (parts.length > 1) {
        const last = parts.slice(1).join(' ');
        const hashed = await cachedHash('ln', last);
        if (hashed) am.ln = hashed;
      }
    }
  }

  return am;
};

// ==================================================
// ✅ Track Standard Event with Advanced Matching
// ==================================================
// ⚠️ IMPORTANT: এই ফাংশন একই event একবারই fire করে
// (আগে trackCustom + track দিয়ে ডাবল কাউন্ট হচ্ছিল — সেটা ঠিক করা হয়েছে)
// ==================================================
export const trackMetaEvent = async (
  eventName,
  params = {},
  userData = {},
  options = {}
) => {
  // Guard: SSR / non-browser
  if (typeof window === 'undefined') {
    warn(`[Meta] window undefined — skipping: ${eventName}`);
    return;
  }

  // Guard: fbq not loaded
  if (typeof window.fbq !== 'function') {
    warn(`[Meta] fbq NOT loaded — cannot fire: ${eventName}`);
    warn(`   → Check index.html Meta Pixel Base Code`);
    return;
  }

  log(`[Meta] Track called: ${eventName}`, { params, userData });

  try {
    // ── Step 1: Build Advanced Matching
    const advancedMatching = await buildAdvancedMatching(userData);

    if (Object.keys(advancedMatching).length > 0) {
      window.fbq('init', PIXEL_ID, advancedMatching);
      log('[Meta] Advanced Matching:', advancedMatching);
    }

    // ── Step 2: Prepare event options
    const eventOptions = {};
    if (options.eventID) {
      eventOptions.eventID = options.eventID; // CAPI dedup
    }

    // ── Step 3: Fire the event ONCE
    // ⚠️ DO NOT also fire trackCustom with the same name —
    //    that causes Meta to count each conversion twice.
    if (Object.keys(eventOptions).length > 0) {
      window.fbq('track', eventName, params, eventOptions);
    } else {
      window.fbq('track', eventName, params);
    }

    log(`[Meta] ✅ Event fired: ${eventName}`, params);
  } catch (err) {
    console.error(`[Meta] Error [${eventName}]:`, err);
  }
};

// ==================================================
// ✅ Custom (non-standard) Event
// ==================================================
// Meta standard events-এর বাইরের ইভেন্টের জন্য
// (যেমন: 'BookingClicked', 'DoctorFiltered')
// ==================================================
export const trackMetaCustomEvent = async (
  eventName,
  params = {},
  userData = {},
  options = {}
) => {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') {
    warn(`[Meta] fbq NOT loaded — cannot fire custom: ${eventName}`);
    return;
  }

  try {
    const advancedMatching = await buildAdvancedMatching(userData);
    if (Object.keys(advancedMatching).length > 0) {
      window.fbq('init', PIXEL_ID, advancedMatching);
    }

    const eventOptions = {};
    if (options.eventID) eventOptions.eventID = options.eventID;

    if (Object.keys(eventOptions).length > 0) {
      window.fbq('trackCustom', eventName, params, eventOptions);
    } else {
      window.fbq('trackCustom', eventName, params);
    }

    log(`[Meta] ✅ Custom event fired: ${eventName}`, params);
  } catch (err) {
    console.error(`[Meta] Custom error [${eventName}]:`, err);
  }
};

// ==================================================
// ✅ SPA PageView (route change-এ কল করুন)
// ==================================================
export const trackMetaPageView = () => {
  if (typeof window === 'undefined') return;

  if (typeof window.fbq !== 'function') {
    warn('[Meta] fbq not loaded — cannot fire PageView');
    return;
  }

  window.fbq('track', 'PageView');
  log('[Meta] ✅ PageView fired');
};

// ==================================================
// ✅ Helper: Generate eventID for dedup
// ==================================================
// CAPI + Pixel একই event-এ fire করলে একই eventID দিতে হবে
export const generateEventId = (prefix = 'evt') => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

// ==================================================
// ✅ Default export
// ==================================================
export default {
  trackMetaEvent,
  trackMetaCustomEvent,
  trackMetaPageView,
  generateEventId,
};