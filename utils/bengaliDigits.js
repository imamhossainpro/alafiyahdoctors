// utils/bengaliDigits.js
// ==================================================
// 🔤 Bengali ↔ English Digit Conversion + Normalizers
// ==================================================
// Used for:
//   - Phone number normalization (Bengali → English)
//   - Phone number comparison across collections
//   - Name normalization for safe matching
// ==================================================

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// ==================================================
// ✅ Bengali → English digits
// ==================================================
// "০১৭১২৩৪৫৬৭৮" → "01712345678"
// ==================================================
export const toEnglishDigits = (str) => {
  if (!str) return '';
  return String(str).replace(/[০-৯]/g, (char) => {
    const idx = BENGALI_DIGITS.indexOf(char);
    return idx >= 0 ? ENGLISH_DIGITS[idx] : char;
  });
};

// ==================================================
// ✅ English → Bengali digits
// ==================================================
// "01712345678" → "০১৭১২৩৪৫৬৭৮"
// ==================================================
export const toBengaliDigits = (str) => {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (char) => {
    const idx = ENGLISH_DIGITS.indexOf(char);
    return idx >= 0 ? BENGALI_DIGITS[idx] : char;
  });
};

// ==================================================
// ✅ Phone number normalize
// ==================================================
// Handles:
//   "০১৭...৯৯০৯৩"       → "01712345678"
//   "+8801712345678"     → "01712345678"
//   "8801712345678"      → "01712345678"
//   "017-1234-5678"      → "01712345678"
//   "017 1234 5678"      → "01712345678"
//   "  01712345678  "    → "01712345678"
// ==================================================
export const normalizePhone = (phone) => {
  if (!phone) return '';
  let normalized = toEnglishDigits(String(phone)).replace(/[^0-9]/g, '');

  // Remove country code prefix (880 or 88)
  if (normalized.startsWith('880') && normalized.length > 11) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('88') && normalized.length > 11) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
};

// ==================================================
// ✅ Name normalize for comparison
// ==================================================
// "  Adnan Hamid "        → "adnan hamid"
// "ডাঃ  রায়হান  আহম্মদ"  → "ডাঃ রায়হান আহম্মদ"
// "Dr. Rahim,"            → "dr rahim"
// ==================================================
export const normalizeName = (name) => {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')          // multiple spaces → single
    .replace(/[।,\.\-\–\—]/g, '')  // punctuation remove (Bengali + English)
    .normalize('NFC');
};

// ==================================================
// ✅ Phone validation
// ==================================================
// Returns true if valid Bangladesh mobile number
// (11 digits, starts with 01)
// ==================================================
export const isValidBDPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
};

// ==================================================
// ✅ Default export (optional)
// ==================================================
export default {
  toEnglishDigits,
  toBengaliDigits,
  normalizePhone,
  normalizeName,
  isValidBDPhone,
};