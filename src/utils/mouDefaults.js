// src/utils/mouDefaults.js
// ==================================================
// 📄 MoU Client — Default values & templates
// ==================================================
// ✅ Custom Client Type support (Gym, Garments, etc.)
// ✅ Dynamic color assignment for custom types
// ==================================================

// ==================================================
// ✅ Org 1 = আল-আফিয়া হাসপাতাল (fixed)
// ==================================================
export const ORG1_DEFAULTS = {
  org1_name: 'Al-Afiyah Hospital & Diagnostic Centre Ltd.',
  org1_short_name: 'Al Afiyah Hospital',
  org1_address: 'Bakalia Access Road, Bakalia, Chattogram, Bangladesh',
  org1_description:
    'is committed to providing quality, modern, and patient-centered healthcare services while maintaining a **Shariah-compliant environment** based on ethics, integrity, compassion, and patient welfare.',
  org1_contact_name: 'Imam Hossain',
  org1_contact_designation: 'Business Development Manager',
  org1_contact_phone: '+8801898-792301',
  org1_contact_email: 'alafiyahhospital@gmail.com',
  org1_signatory_name: 'Dr. Abu Jonayed Rifat',
  org1_signatory_designation: 'Managing Director',
  org1_witness_name: 'Kazi Mizan',
  org1_witness_designation: 'Manager',
};

// ==================================================
// ✅ Beneficiary defaults
// ==================================================
export const BENEFICIARY_DEFAULTS = {
  beneficiary_label: 'Employees & Students',
  beneficiary_member_text: 'along with their member',
  beneficiary_full_text: '',
};

// ==================================================
// ✅ Predefined Client Type options
// (আরও যোগ করতে পারবেন এখানে)
// ==================================================
export const CLIENT_TYPES = [
  { value: 'madrasah', label: '🕌 মাদ্রাসা', color: '#16a34a', bg: '#dcfce7' },
  { value: 'school', label: '🏫 স্কুল', color: '#0891b2', bg: '#cffafe' },
  { value: 'college', label: '🎓 কলেজ', color: '#7c3aed', bg: '#ede9fe' },
  { value: 'university', label: '🏛️ বিশ্ববিদ্যালয়', color: '#9333ea', bg: '#f3e8ff' },
  { value: 'company', label: '🏢 কোম্পানি', color: '#1c5fa8', bg: '#dbeafe' },
  { value: 'hospital', label: '🏥 হাসপাতাল / ক্লিনিক', color: '#dc2626', bg: '#fee2e2' },
  { value: 'ngo', label: '🤝 NGO / ফাউন্ডেশন', color: '#ea580c', bg: '#ffedd5' },
  { value: 'government', label: '🏛️ সরকারি প্রতিষ্ঠান', color: '#475569', bg: '#f1f5f9' },
  { value: 'gym', label: '🏋️ জিম / ফিটনেস', color: '#0ea5e9', bg: '#e0f2fe' },
  { value: 'garments', label: '👕 গার্মেন্টস', color: '#ec4899', bg: '#fce7f3' },
  { value: 'restaurant', label: '🍽️ রেস্টুরেন্ট', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'bank', label: '🏦 ব্যাংক', color: '#059669', bg: '#d1fae5' },
  { value: 'pharmacy', label: '💊 ফার্মেসি', color: '#7c2d12', bg: '#fed7aa' },
  { value: 'other', label: '📌 অন্যান্য', color: '#64748b', bg: '#f1f5f9' },
];

// ==================================================
// ✅ Custom color palette (for unknown types)
// ==================================================
const CUSTOM_COLORS = [
  { color: '#1e40af', bg: '#dbeafe' },
  { color: '#166534', bg: '#dcfce7' },
  { color: '#9a3412', bg: '#fed7aa' },
  { color: '#7c2d12', bg: '#fef3c7' },
  { color: '#6b21a8', bg: '#f3e8ff' },
  { color: '#a16207', bg: '#fef9c3' },
  { color: '#0f766e', bg: '#ccfbf1' },
  { color: '#9f1239', bg: '#fce7f3' },
  { color: '#1e3a8a', bg: '#e0e7ff' },
  { color: '#365314', bg: '#ecfccb' },
];

// ==================================================
// ✅ Hash string → consistent index
// ==================================================
const stringHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// ==================================================
// ✅ Get client type info (predefined or custom)
// ==================================================
export const getClientTypeInfo = (type) => {
  if (!type) {
    return {
      value: 'unknown',
      label: '❓ অজানা',
      color: '#64748b',
      bg: '#f1f5f9',
      isCustom: false,
    };
  }

  // 1️⃣ Check predefined types
  const found = CLIENT_TYPES.find((t) => t.value === type);
  if (found) return { ...found, isCustom: false };

  // 2️⃣ Custom type — assign deterministic color
  const idx = stringHash(type) % CUSTOM_COLORS.length;
  const palette = CUSTOM_COLORS[idx];

  return {
    value: type,
    label: `📌 ${type}`, // ✅ Show actual name with pin icon
    color: palette.color,
    bg: palette.bg,
    isCustom: true,
  };
};

// ==================================================
// ✅ Status options
// ==================================================
export const CLIENT_STATUSES = [
  { value: 'unknown', label: '❓ Unknown', color: '#64748b', bg: '#f1f5f9' },
  { value: 'draft', label: '📝 Draft', color: '#475569', bg: '#f1f5f9' },
  { value: 'active', label: '🟢 Active', color: '#166534', bg: '#dcfce7' },
  { value: 'expired', label: '🟡 Expired', color: '#92400e', bg: '#fef3c7' },
  { value: 'terminated', label: '🔴 Terminated', color: '#991b1b', bg: '#fee2e2' },
];

export const getStatusInfo = (status) =>
  CLIENT_STATUSES.find((s) => s.value === status) || CLIENT_STATUSES[0];

// ==================================================
// ✅ Terms defaults
// ==================================================
export const TERMS_DEFAULTS = {
  discount_pathology: '40',
  discount_radiology: '30',
  discount_bed: '25',
  notice_days: '30',
  remedy_days: '7',
};

// ==================================================
// ✅ Blank new client template
// ==================================================
export const blankClient = () => ({
  agreement_date: new Date().toISOString().slice(0, 10),
  agreement_place: 'Chattogram, Bangladesh',

  ...ORG1_DEFAULTS,
  ...BENEFICIARY_DEFAULTS,
  ...TERMS_DEFAULTS,

  org2_name: '',
  org2_short_name: '',
  org2_address: '',
  org2_description: '',
  org2_contact_name: '',
  org2_contact_designation: '',
  org2_contact_phone: '',
  org2_contact_email: '',
  org2_signatory_name: '',
  org2_signatory_designation: '',
  org2_witness_name: '',
  org2_witness_designation: '',

  clientType: 'madrasah',
  customClientType: '',      // ✅ NEW — for custom type
  status: 'active',
  internalNotes: '',
  isArchived: false,
});

// ==================================================
// ✅ Form field definitions
// ==================================================
export const MOU_FORM_GROUPS = [
  {
    title: '📅 Agreement Information',
    fields: [
      { key: 'agreement_date', label: 'Agreement Date', type: 'date', req: true },
      { key: 'agreement_place', label: 'Place of Agreement', type: 'text', req: true },
    ],
  },
  {
    title: '🕌 Client Institution (org2)',
    fields: [
      { key: 'org2_name', label: 'Institution Name', type: 'text', req: true, placeholder: 'Chattogram International Model Madrasah' },
      { key: 'org2_short_name', label: 'Short Name (for signature header)', type: 'text', placeholder: 'CIM Madrasah' },
      { key: 'org2_address', label: 'Address', type: 'textarea', rows: 2, req: true, placeholder: 'East Bakalia, GPO-4000, Bakalia, Chattogram' },
      {
        key: 'org2_description',
        label: 'Description (shown after "Whereas ...")',
        type: 'textarea',
        rows: 3,
        hint: 'Use **word** to make it bold',
        placeholder: 'is an esteemed Islamic educational institution dedicated to ...',
      },
      { key: 'org2_contact_name', label: 'Contact Person Name', type: 'text', req: true },
      { key: 'org2_contact_designation', label: 'Contact Person Designation', type: 'text' },
      { key: 'org2_contact_phone', label: 'Contact Phone', type: 'tel' },
      { key: 'org2_contact_email', label: 'Contact Email', type: 'email' },
      { key: 'org2_signatory_name', label: 'Authorized Signatory Name', type: 'text', req: true },
      { key: 'org2_signatory_designation', label: 'Authorized Signatory Designation', type: 'text' },
      { key: 'org2_witness_name', label: 'Witness Name', type: 'text' },
      { key: 'org2_witness_designation', label: 'Witness Designation', type: 'text' },
    ],
  },
  {
    title: '👥 Beneficiary (Discounted Parties)',
    fields: [
      {
        key: 'beneficiary_label',
        label: 'Beneficiary Label',
        type: 'text',
        req: true,
        hint: 'যেমন: Employees & Students / Members / Staff',
        placeholder: 'Employees & Students',
      },
      {
        key: 'beneficiary_member_text',
        label: 'Member Suffix (optional)',
        type: 'text',
        hint: 'যেমন: along with their member / along with their family',
        placeholder: 'along with their member',
      },
      {
        key: 'beneficiary_full_text',
        label: 'Full Custom Line (optional — leave empty to auto-compose)',
        type: 'textarea',
        rows: 3,
        hint: 'পুরো লাইনটি নিজে লিখতে চাইলে এখানে লিখুন। খালি রাখলে উপরের label + member দিয়ে auto-compose হবে।',
        placeholder: 'আপনি চাইলে পুরো বাক্যটি এখানে কাস্টম লিখতে পারেন...',
      },
    ],
  },
  {
    title: '💰 Discount Terms',
    fields: [
      { key: 'discount_pathology', label: 'Pathology Discount (%)', type: 'number', min: 0, max: 100, req: true },
      { key: 'discount_radiology', label: 'Radiology & Imaging Discount (%)', type: 'number', min: 0, max: 100, req: true },
      { key: 'discount_bed', label: 'Bed Rent & Service Charge Discount (%)', type: 'number', min: 0, max: 100, req: true },
    ],
  },
  {
    title: '📜 Termination Terms',
    fields: [
      { key: 'notice_days', label: 'Termination Notice (days)', type: 'number', min: 0, req: true },
      { key: 'remedy_days', label: 'Breach Remedy Period (days)', type: 'number', min: 0, req: true },
    ],
  },
  {
    title: '📂 Meta',
    fields: [
      // ✅ Client Type — special field (handled by MoUForm with custom option)
      { key: 'clientType', label: 'Client Type', type: 'clientType', req: true },
      { key: 'status', label: 'Status', type: 'select', options: CLIENT_STATUSES.map(s => ({ value: s.value, label: s.label })), req: true },
      { key: 'internalNotes', label: 'Internal Notes (admin only)', type: 'textarea', rows: 2 },
    ],
  },
];

// ==================================================
// ✅ Helpers
// ==================================================
export const formatDateLong = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

// ==================================================
// ✅ Build beneficiary line
// ==================================================
export const buildBeneficiaryLine = (data = {}) => {
  const custom = (data.beneficiary_full_text || '').trim();
  if (custom) return custom;

  const hospital = (data.org1_name || '').trim() || 'The Hospital';
  const partner = (data.org2_name || '').trim() || 'the Institution';
  const label = (data.beneficiary_label || '').trim() || 'Employees & Students';
  const member = (data.beneficiary_member_text || '').trim() || 'along with their member';

  return `${hospital} will provide following Special discount rates & facilities for the ${label} of ${partner} ${member}.`;
};

// ==================================================
// ✅ Get effective client type value
// (if clientType === 'custom', use customClientType)
// ==================================================
export const getEffectiveClientType = (data = {}) => {
  if (data.clientType === 'custom') {
    return (data.customClientType || '').trim() || 'other';
  }
  return data.clientType || 'other';
};

// ==================================================
// ✅ Validation helpers
// ==================================================
export const validateField = (field, value) => {
  const v = String(value ?? '').trim();
  const isRequired = field.req === true || field.required === true;

  if (isRequired && !v) return 'এই ঘরটি পূরণ করুন';
  if (!v) return '';

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'সঠিক ইমেইল দিন';
  if (field.type === 'tel' && !/^\+?[0-9][0-9\s\-()]{6,19}$/.test(v))
    return 'সঠিক ফোন নম্বর দিন';
  if (field.type === 'date' && isNaN(new Date(v).getTime()))
    return 'সঠিক তারিখ দিন';
  if (field.type === 'number') {
    const n = Number(v);
    if (isNaN(n) || n < 0) return 'সঠিক সংখ্যা দিন';
    if (field.min !== undefined && n < field.min) return `সর্বনিম্ন ${field.min}`;
    if (field.max !== undefined && n > field.max) return `সর্বোচ্চ ${field.max}`;
  }
  return '';
};

export const validateAllFields = (data) => {
  const errors = {};
  let firstInvalid = null;

  MOU_FORM_GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      // ✅ Special handling for clientType
      if (field.key === 'clientType') {
        if (data.clientType === 'custom' && !(data.customClientType || '').trim()) {
          errors.customClientType = 'কাস্টম টাইপ লিখুন';
          if (!firstInvalid) firstInvalid = 'customClientType';
        }
        return;
      }

      const err = validateField(field, data[field.key]);
      if (err) {
        errors[field.key] = err;
        if (!firstInvalid) firstInvalid = field.key;
      }
    });
  });

  return { errors, firstInvalid, isValid: !firstInvalid };
};