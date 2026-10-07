// src/utils/mouDefaults.js
// ==================================================
// 📄 MoU Client — Default values & templates
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
// ✅ Client Type options
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
  { value: 'other', label: '📌 অন্যান্য', color: '#64748b', bg: '#f1f5f9' },
];

// ==================================================
// ✅ Status options
// ==================================================
export const CLIENT_STATUSES = [
  { value: 'draft', label: '📝 Draft', color: '#475569', bg: '#f1f5f9' },
  { value: 'active', label: '🟢 Active', color: '#166534', bg: '#dcfce7' },
  { value: 'expired', label: '🟡 Expired', color: '#92400e', bg: '#fef3c7' },
  { value: 'terminated', label: '🔴 Terminated', color: '#991b1b', bg: '#fee2e2' },
];

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

  ...TERMS_DEFAULTS,

  clientType: 'madrasah',
  status: 'draft',
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
      { key: 'agreement_date', label: 'Agreement Date', type: 'date', required: true },
      { key: 'agreement_place', label: 'Place of Agreement', type: 'text', required: true },
    ],
  },
  {
    title: '🕌 Client Institution (org2)',
    fields: [
      { key: 'org2_name', label: 'Institution Name', type: 'text', required: true, placeholder: 'Kamale Ishq-e Mustafa (SM) Fazil Madrasah' },
      { key: 'org2_short_name', label: 'Short Name (for signature header)', type: 'text', placeholder: 'KIM Fazil Madrasah' },
      { key: 'org2_address', label: 'Address', type: 'textarea', rows: 2, required: true, placeholder: 'East Bakalia, GPO-4000, Bakalia, Chattogram' },
      {
        key: 'org2_description',
        label: 'Description (shown after "Whereas ...")',
        type: 'textarea',
        rows: 3,
        hint: 'Use **word** to make it bold',
        placeholder: 'is an esteemed Islamic educational institution dedicated to ...',
      },
      { key: 'org2_contact_name', label: 'Contact Person Name', type: 'text', required: true },
      { key: 'org2_contact_designation', label: 'Contact Person Designation', type: 'text' },
      { key: 'org2_contact_phone', label: 'Contact Phone', type: 'tel' },
      { key: 'org2_contact_email', label: 'Contact Email', type: 'email' },
      { key: 'org2_signatory_name', label: 'Authorized Signatory Name', type: 'text', required: true },
      { key: 'org2_signatory_designation', label: 'Authorized Signatory Designation', type: 'text' },
      { key: 'org2_witness_name', label: 'Witness Name', type: 'text' },
      { key: 'org2_witness_designation', label: 'Witness Designation', type: 'text' },
    ],
  },
  {
    title: '💰 Discount Terms',
    fields: [
      { key: 'discount_pathology', label: 'Pathology Discount (%)', type: 'number', min: 0, max: 100, required: true },
      { key: 'discount_radiology', label: 'Radiology & Imaging Discount (%)', type: 'number', min: 0, max: 100, required: true },
      { key: 'discount_bed', label: 'Bed Rent & Service Charge Discount (%)', type: 'number', min: 0, max: 100, required: true },
    ],
  },
  {
    title: '📜 Termination Terms',
    fields: [
      { key: 'notice_days', label: 'Termination Notice (days)', type: 'number', min: 0, required: true },
      { key: 'remedy_days', label: 'Breach Remedy Period (days)', type: 'number', min: 0, required: true },
    ],
  },
  {
    title: '📂 Meta',
    fields: [
      { key: 'clientType', label: 'Client Type', type: 'select', options: CLIENT_TYPES.map(t => ({ value: t.value, label: t.label })), required: true },
      { key: 'status', label: 'Status', type: 'select', options: CLIENT_STATUSES.map(s => ({ value: s.value, label: s.label })), required: true },
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

export const getClientTypeInfo = (type) =>
  CLIENT_TYPES.find(t => t.value === type) || CLIENT_TYPES[CLIENT_TYPES.length - 1];

export const getStatusInfo = (status) =>
  CLIENT_STATUSES.find(s => s.value === status) || CLIENT_STATUSES[0];