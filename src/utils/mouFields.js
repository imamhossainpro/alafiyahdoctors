// src/utils/mouFields.js
// ==================================================
// 📋 MOU Field Schema — সব form field এর definition
// ==================================================
// Firestore path: hospitals/{hospitalId}/mous/{mouId}
// প্রতিটি field সরাসরি MOU document-এ store হয়
// ==================================================

// ==================================================
// ✅ Organization fields factory
// ==================================================
const orgFields = (n, L) =>
  [
    ['name', 'Name', 'text', 1],
    ['short_name', 'Short Name (shown in signature header)'],
    ['address', 'Address'],
    [
      'description',
      'Description (text after the name in "Whereas"; wrap **words** to make them bold)',
      'area',
    ],
    ['contact_name', 'Contact Person', null, 1],
    ['contact_designation', 'Contact Designation'],
    ['contact_phone', 'Contact Phone', 'tel'],
    ['contact_email', 'Contact Email', 'email'],
    ['signatory_name', 'Authorized Person (signatory)'],
    ['signatory_designation', 'Authorized Person Designation'],
    ['witness_name', 'Witness Name'],
    ['witness_designation', 'Witness Designation'],
  ].map(([k, l, t, r]) => ({
    key: `org${n}_${k}`,
    label: `${L} ${l}`,
    type: t || 'text',
    req: !!r,
  }));

// ==================================================
// ✅ Groups — form section গুলো
// ==================================================
export const MOU_GROUPS = [
  {
    title: 'Agreement',
    fields: [
      { key: 'agreement_date', label: 'Agreement Date', type: 'date', req: 1 },
      { key: 'agreement_place', label: 'Place of Agreement', type: 'text' },
    ],
  },
  {
    title: 'Institution 1 (Service Provider)',
    fields: orgFields(1, 'Institution 1'),
  },
  {
    title: 'Institution 2 (Client Institution)',
    fields: orgFields(2, 'Institution 2'),
  },
  {
    title: 'Beneficiary (Discounted Parties)',
    fields: [
      {
        key: 'beneficiary_label',
        label: 'Beneficiary Label',
        type: 'text',
        req: 1,
      },
      {
        key: 'beneficiary_member_text',
        label: 'Member Suffix (e.g. "along with their member")',
        type: 'text',
      },
    ],
  },
  {
    title: 'Terms',
    fields: [
      { key: 'discount_pathology', label: 'Pathology Discount (%)', type: 'num' },
      {
        key: 'discount_radiology',
        label: 'Radiology & Imaging Discount (%)',
        type: 'num',
      },
      {
        key: 'discount_bed',
        label: 'Bed Rent & Service Charge Discount (%)',
        type: 'num',
      },
      { key: 'notice_days', label: 'Termination Notice (days)', type: 'num' },
      { key: 'remedy_days', label: 'Breach Remedy Period (days)', type: 'num' },
    ],
  },
];

// ==================================================
// ✅ Flat list
// ==================================================
export const MOU_FIELDS = MOU_GROUPS.flatMap((g) => g.fields);

export const MOU_FIELD_MAP = Object.fromEntries(
  MOU_FIELDS.map((f) => [f.key, f])
);

// ==================================================
// ✅ Defaults — হাসপাতালের তথ্য প্রি-ফিল
// ==================================================
export const MOU_DEFAULTS = {
  agreement_date: new Date().toISOString().slice(0, 10),
  agreement_place: 'Chattogram, Bangladesh',

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

  // ✅ Beneficiary (dynamic)
  beneficiary_label: 'Employees & Students',
  beneficiary_member_text: 'along with their member',

  discount_pathology: '40',
  discount_radiology: '30',
  discount_bed: '25',
  notice_days: '30',
  remedy_days: '7',
};

// ==================================================
// ✅ Blank doc — Institution 2 ফাঁকা
// ==================================================
export const makeBlankMou = () => {
  const d = { ...MOU_DEFAULTS };
  Object.keys(d)
    .filter((k) => k.startsWith('org2_'))
    .forEach((k) => (d[k] = ''));
  return d;
};

// ==================================================
// ✅ Validation
// ==================================================
export const validateMouField = (field, value) => {
  const v = (value || '').trim();
  if (field.req && !v) return `${field.label} is required.`;
  if (!v) return '';
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'Enter a valid email address.';
  if (field.type === 'tel' && !/^\+?[0-9][0-9\s-]{6,19}$/.test(v))
    return 'Enter a valid phone number (digits, +, spaces, hyphens).';
  if (field.type === 'date' && isNaN(new Date(v)))
    return 'Enter a valid date.';
  if (field.type === 'num' && !(Number(v) >= 0))
    return 'Enter a valid non-negative number.';
  return '';
};

// ==================================================
// ✅ Date formatting (Agreement Date → "05 October 2026")
// ==================================================
export const formatDateLong = (dateStr) => {
  if (!dateStr) return '';
  const t = new Date(dateStr + 'T00:00:00');
  if (isNaN(t.getTime())) return '';
  return t.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};