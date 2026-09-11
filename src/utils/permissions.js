// src/utils/permissions.js

// ==================================================
// ✅ TABS / Navigation Sections
// ==================================================
export const TABS = {
  OVERVIEW: 'overview',
  APPOINTMENTS: 'appointments',
  MARKETING: 'marketing',
  DISPLAY: 'display',
  LOCATIONS: 'locations',
  LOGS: 'logs',
  ARCHIVED: 'archived',
  USER_ACCESS: 'user_access',
};

// ==================================================
// ✅ PERMISSION REGISTRY – সব permission এখানে
// নতুন feature যোগ করলে শুধু এখানে add করুন
// ==================================================
export const PERMISSION_REGISTRY = [
  {
    module: 'Dashboard & Statistics',
    icon: '📊',
    permissions: [
      { key: 'dashboard.view', label: 'ড্যাশবোর্ড দেখুন' },
      { key: 'statistics.view', label: 'পরিসংখ্যান দেখুন' },
    ],
  },
  {
    module: 'Booking List',
    icon: '📋',
    permissions: [
      { key: 'booking.view', label: 'বুকিং দেখুন' },
      { key: 'booking.create', label: 'নতুন বুকিং' },
      { key: 'booking.edit', label: 'বুকিং এডিট' },
      { key: 'booking.delete', label: 'বুকিং ডিলিট' },
      { key: 'booking.status_change', label: 'স্ট্যাটাস পরিবর্তন' },
      { key: 'booking.patient_type_change', label: 'রোগীর টাইপ পরিবর্তন' },
      { key: 'booking.marketing_assignment', label: 'Marketing Officer assign' },
      { key: 'booking.referral_edit', label: 'Referral / Remarks এডিট' },
      { key: 'booking.print', label: 'প্রিন্ট' },
      { key: 'booking.qr_view', label: 'QR কোড দেখুন' },
    ],
  },
  {
    module: 'Marketing Report',
    icon: '📈',
    permissions: [
      { key: 'marketing_report.view', label: 'রিপোর্ট দেখুন' },
      { key: 'marketing_report.filter', label: 'Filter ব্যবহার' },
      { key: 'marketing_report.export_pdf', label: 'PDF ডাউনলোড' },
      { key: 'marketing_report.delete_officer', label: 'Marketing Officer ডিলিট' },
    ],
  },
  {
    module: 'Marketing Manager',
    icon: '👥',
    permissions: [
      { key: 'marketing_manager.view', label: 'দেখুন' },
      { key: 'marketing_manager.create', label: 'নতুন Officer' },
      { key: 'marketing_manager.edit', label: 'এডিট' },
      { key: 'marketing_manager.delete', label: 'ডিলিট' },
    ],
  },
  {
    module: 'Doctor Management',
    icon: '👨‍⚕️',
    permissions: [
      { key: 'doctor.view', label: 'ডাক্তার দেখুন' },
      { key: 'doctor.create', label: 'নতুন ডাক্তার' },
      { key: 'doctor.edit', label: 'ডাক্তার এডিট' },
      { key: 'doctor.delete', label: 'ডাক্তার ডিলিট' },
      { key: 'doctor.schedule.edit', label: 'Schedule এডিট' },
    ],
  },
  {
    module: 'Location Manager',
    icon: '📍',
    permissions: [
      { key: 'location.view', label: 'লোকেশন দেখুন' },
      { key: 'location.create', label: 'নতুন লোকেশন' },
      { key: 'location.edit', label: 'এডিট' },
      { key: 'location.delete', label: 'ডিলিট' },
      { key: 'location.merge', label: 'মার্জ' },
      { key: 'location.move_patient', label: 'রোগী মুভ' },
    ],
  },
  {
    module: 'Display Settings',
    icon: '📺',
    permissions: [
      { key: 'display.view', label: 'ডিসপ্লে দেখুন' },
      { key: 'display.manage', label: 'ডিসপ্লে সেটিংস পরিবর্তন' },
    ],
  },
  {
    module: 'Activity Log',
    icon: '📜',
    permissions: [
      { key: 'activity_log.view', label: 'Activity Log দেখুন' },
    ],
  },
  {
    module: 'Archived',
    icon: '🗄️',
    permissions: [
      { key: 'archive.view', label: 'Archived দেখুন' },
      { key: 'archive.restore', label: 'রিস্টোর' },
      { key: 'archive.delete', label: 'স্থায়ী ডিলিট' },
    ],
  },
  {
    module: 'User & Role Management',
    icon: '🔐',
    permissions: [
      { key: 'user.view', label: 'ইউজার দেখুন' },
      { key: 'user.create', label: 'নতুন ইউজার' },
      { key: 'user.edit', label: 'ইউজার এডিট' },
      { key: 'user.disable', label: 'ইউজার নিষ্ক্রিয়' },
      { key: 'user.delete', label: 'ইউজার ডিলিট' },
      { key: 'user.role_change', label: 'Role পরিবর্তন' },
      { key: 'user.permission_manage', label: 'Permission مدیریت' },
    ],
  },
];

// ==================================================
// ✅ Flat list of all permission keys
// ==================================================
export const ALL_PERMISSIONS = PERMISSION_REGISTRY.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

// ==================================================
// ✅ Default Role Templates
// ==================================================
export const ROLE_TEMPLATES = {
  admin: {
    label: 'Admin',
    permissions: ALL_PERMISSIONS.reduce((acc, k) => ({ ...acc, [k]: true }), {}),
  },
  'sub-admin': {
    label: 'Sub-Admin',
    permissions: ALL_PERMISSIONS.reduce((acc, k) => {
      acc[k] = ![
        'user.permission_manage',
        'user.delete',
        'booking.delete',
      ].includes(k);
      return acc;
    }, {}),
  },
  editor: {
    label: 'Editor',
    permissions: {
      'dashboard.view': true,
      'statistics.view': true,
      'booking.view': true,
      'booking.create': true,
      'booking.edit': true,
      'booking.status_change': true,
      'booking.patient_type_change': true,
      'booking.marketing_assignment': true,
      'booking.referral_edit': true,
      'booking.print': true,
      'booking.qr_view': true,
      'marketing_report.view': true,
      'marketing_report.filter': true,
    },
  },
  viewer: {
    label: 'Viewer',
    permissions: {
      'dashboard.view': true,
      'statistics.view': true,
      'booking.view': true,
    },
  },
  moderator: {
    label: 'Moderator',
    permissions: {
      'dashboard.view': true,
      'statistics.view': true,
      'booking.view': true,
      'booking.status_change': true,
      'activity_log.view': true,
    },
  },
  pending: {
    label: 'Pending',
    permissions: {},
  },
};

// ==================================================
// ✅ Effective Permissions Calculator
// Priority: user.overrides > role.permissions
// ==================================================
export const calculateEffectivePermissions = (userData) => {
  if (!userData) return {};

  // Admin all-access
  if (userData.role === 'admin') {
    return ALL_PERMISSIONS.reduce((acc, k) => ({ ...acc, [k]: true }), {});
  }

  const roleTemplate = ROLE_TEMPLATES[userData.role] || ROLE_TEMPLATES.pending;
  const rolePerms = roleTemplate.permissions || {};
  const overrides = userData.permissionOverrides || {};

  const effective = {};
  ALL_PERMISSIONS.forEach((key) => {
    // User-specific override takes priority
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      effective[key] = overrides[key] === true;
    } else {
      effective[key] = rolePerms[key] === true;
    }
  });

  return effective;
};

// ==================================================
// ✅ hasPermission helper
// ==================================================
export const hasPermission = (effectivePermissions, key) => {
  if (!effectivePermissions) return false;
  return effectivePermissions[key] === true;
};

// ==================================================
// ✅ Role label helper
// ==================================================
export const getRoleLabel = (role) => {
  return ROLE_TEMPLATES[role]?.label || role || 'Unknown';
};

// ==================================================
// ✅ Permission dependency (view required for others)
// ==================================================
export const PERMISSION_DEPENDENCIES = {
  'booking.create': 'booking.view',
  'booking.edit': 'booking.view',
  'booking.delete': 'booking.view',
  'booking.status_change': 'booking.view',
  'booking.patient_type_change': 'booking.view',
  'booking.marketing_assignment': 'booking.view',
  'booking.referral_edit': 'booking.view',
  'booking.print': 'booking.view',
  'booking.qr_view': 'booking.view',

  'marketing_report.filter': 'marketing_report.view',
  'marketing_report.export_pdf': 'marketing_report.view',
  'marketing_report.delete_officer': 'marketing_report.view',

  'marketing_manager.create': 'marketing_manager.view',
  'marketing_manager.edit': 'marketing_manager.view',
  'marketing_manager.delete': 'marketing_manager.view',

  'doctor.create': 'doctor.view',
  'doctor.edit': 'doctor.view',
  'doctor.delete': 'doctor.view',
  'doctor.schedule.edit': 'doctor.view',

  'location.create': 'location.view',
  'location.edit': 'location.view',
  'location.delete': 'location.view',
  'location.merge': 'location.view',
  'location.move_patient': 'location.view',

  'display.manage': 'display.view',

  'archive.restore': 'archive.view',
  'archive.delete': 'archive.view',

  'user.create': 'user.view',
  'user.edit': 'user.view',
  'user.disable': 'user.view',
  'user.delete': 'user.view',
  'user.role_change': 'user.view',
  'user.permission_manage': 'user.view',
};

// ✅ Auto-enable dependent permission
export const applyDependencies = (perms) => {
  const result = { ...perms };
  Object.entries(PERMISSION_DEPENDENCIES).forEach(([child, parent]) => {
    if (result[child]) result[parent] = true;
  });
  return result;
};