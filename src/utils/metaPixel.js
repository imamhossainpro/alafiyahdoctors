// src/utils/metaPixel.js
// ==================================================
// 📘 Meta Pixel — Advanced Matching Helper
// ==================================================
// ✅ Email, Phone, Name — SHA256 hashing সহ
// ✅ Phone E.164 format (8801XXXXXXXXX)
// ✅ SPA-তে PageView tracking
// ==================================================

// ✅ SHA-256 hashing (browser built-in)
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
    console.error('SHA256 error:', err);
    return null;
  }
};

// ✅ Normalize functions (Meta requirement)
const normalizeEmail = (email) => {
  if (!email) return null;
  return email.toLowerCase().trim();
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('88')) return '880' + digits.slice(2);
  if (digits.startsWith('0')) return '880' + digits.slice(1);
  return '880' + digits;
};

const normalizeName = (name) => {
  if (!name) return null;
  return name.toLowerCase().trim().replace(/[^a-z\s]/g, '');
};

// ==================================================
// ✅ Track Standard Event with Advanced Matching
// ==================================================
export const trackMetaEvent = async (eventName, params = {}, userData = {}) => {
  // ✅ Step 1: fbq loaded check
  if (typeof window === 'undefined') {
    console.warn(`⚠️ [Meta] window undefined — skipping: ${eventName}`);
    return;
  }

  if (typeof window.fbq !== 'function') {
    console.error(`❌ [Meta] fbq NOT loaded — cannot fire: ${eventName}`);
    console.error(`   → Check index.html Meta Pixel Base Code`);
    return;
  }

  console.log(`🎯 [Meta] Track called: ${eventName}`, { params, userData });

  try {
    // ✅ Step 2: Build Advanced Matching object (hashed)
    const advancedMatching = {};

    if (userData.email) {
      const em = normalizeEmail(userData.email);
      const hashedEm = await sha256(em);
      if (hashedEm) advancedMatching.em = hashedEm;
    }

    if (userData.phone) {
      const ph = normalizePhone(userData.phone);
      const hashedPh = await sha256(ph);
      if (hashedPh) advancedMatching.ph = hashedPh;
    }

    if (userData.name) {
      const parts = normalizeName(userData.name).split(/\s+/);
      if (parts[0]) {
        const hashedFn = await sha256(parts[0]);
        if (hashedFn) advancedMatching.fn = hashedFn;
      }
      if (parts[1]) {
        const hashedLn = await sha256(parts.slice(1).join(' '));
        if (hashedLn) advancedMatching.ln = hashedLn;
      }
    }

    // ✅ Step 3: Re-init Pixel with Advanced Matching
    if (Object.keys(advancedMatching).length > 0) {
      window.fbq('init', '878410400741654', advancedMatching);
      console.log('✅ [Meta] Advanced Matching:', advancedMatching);
    } else {
      console.warn('⚠️ [Meta] No Advanced Matching data provided');
    }

    // ✅ Step 4: Fire the event
    window.fbq('track', eventName, params);
    console.log(`✅ [Meta] Event FIRED: ${eventName}`, params);

    // ✅ Step 5: Also fire Custom event for Meta's Custom Audiences
    window.fbq('trackCustom', eventName, params);

  } catch (err) {
    console.error(`❌ [Meta] Error [${eventName}]:`, err);
  }
};

// ==================================================
// ✅ SPA PageView (route change-এ কল করুন)
// ==================================================
export const trackMetaPageView = () => {
  if (typeof window === 'undefined') return;

  if (typeof window.fbq !== 'function') {
    console.error('❌ [Meta] fbq not loaded — cannot fire PageView');
    return;
  }

  window.fbq('track', 'PageView');
  console.log('✅ [Meta] PageView fired');
};

export default { trackMetaEvent, trackMetaPageView };