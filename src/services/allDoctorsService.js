// src/services/allDoctorsService.js
// ==================================================
// 👨‍⚕️ All Doctors Service — Public directory data source
// ==================================================
// ✅ Reuses existing Firestore: departments + panels
// ✅ No schema change, no duplicate data
// ✅ Returns unique doctors with merged schedule info
// ✅ Bengali-font-safe, zero PII leak
// ==================================================

import {
  db,
  collection,
  getDocs,
} from '../firebase';

const DEFAULT_HOSPITAL_ID = 'alafiyah_main';

// ==================================================
// ✅ Bengali day order (for schedule sorting)
// ==================================================
const DAY_ORDER = [
  'শনিবার',
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
];

// ==================================================
// ✅ Fetch full public directory
// ==================================================
/**
 * Returns:
 * {
 *   departments: [
 *     {
 *       id, name, icon, color, order,
 *       doctors: [ { ...doctorInfo, chamberDays: ['শনিবার', ...] } ]
 *     }
 *   ],
 *   totalDoctors: number,
 *   fetchedAt: ISO string,
 * }
 */
export const fetchAllDoctors = async (hospitalId = DEFAULT_HOSPITAL_ID) => {
  if (!hospitalId) {
    return { departments: [], totalDoctors: 0, fetchedAt: new Date().toISOString() };
  }

  try {
    // ==================================================
    // 1. Fetch departments + panels in parallel
    // ==================================================
    const [deptSnap, panelSnap] = await Promise.all([
      getDocs(collection(db, 'hospitals', hospitalId, 'departments')),
      getDocs(collection(db, 'hospitals', hospitalId, 'panels')),
    ]);

    const departments = deptSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const panels = panelSnap.docs.map((d) => ({
      id: d.id,
      name: d.data()?.name || d.id,
      ...d.data(),
    }));

    // ==================================================
    // 2. Build doctorId → Set<dayName> map from panels
    // ==================================================
    const doctorChamberDays = {}; // { doctorId: Set(dayName) }

    panels.forEach((panel) => {
      const dayName = panel.name || panel.id;
      if (!DAY_ORDER.includes(dayName)) return;

      const activeIds = Array.isArray(panel.activeDoctorIds)
        ? panel.activeDoctorIds
        : [];

      activeIds.forEach((docId) => {
        if (!doctorChamberDays[docId]) {
          doctorChamberDays[docId] = new Set();
        }
        doctorChamberDays[docId].add(dayName);
      });
    });

    // ==================================================
    // 3. Merge doctors with chamber days, filter empty depts
    // ==================================================
    const mergedDepartments = departments
      .map((dept) => {
        const rawDoctors = Array.isArray(dept.doctors) ? dept.doctors : [];

        const doctors = rawDoctors
          .map((doc) => {
            const daySet = doctorChamberDays[doc.id] || new Set();
            const chamberDays = Array.from(daySet).sort(
              (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
            );
            return {
              ...doc,
              deptId: dept.id,
              deptName: dept.name,
              deptColor: dept.color,
              deptIcon: dept.icon,
              chamberDays,
            };
          })
          // ✅ Only doctors that exist in at least one panel (active)
          .filter((doc) => doc.chamberDays.length > 0);

        return {
          id: dept.id,
          name: dept.name,
          icon: dept.icon,
          color: dept.color,
          order: dept.order ?? 0,
          doctors,
        };
      })
      // ✅ Hide empty departments
      .filter((dept) => dept.doctors.length > 0)
      // ✅ Sort by order
      .sort((a, b) => a.order - b.order);

    const totalDoctors = mergedDepartments.reduce(
      (sum, d) => sum + d.doctors.length,
      0
    );

    return {
      departments: mergedDepartments,
      totalDoctors,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ fetchAllDoctors error:', error);
    throw error;
  }
};

// ==================================================
// ✅ Helpers (exported for reuse)
// ==================================================
export const ALL_DOCTORS_DAY_ORDER = DAY_ORDER;

/**
 * Build a Google-friendly searchable string for a doctor
 */
export const buildDoctorSearchText = (doctor) => {
  const parts = [
    doctor.name || '',
    doctor.nameEn || '',
    doctor.specialty || '',
    doctor.quals || '',
    doctor.workplace || '',
    doctor.deptName || '',
  ];
  return parts.join(' ').toLowerCase().trim();
};

/**
 * Human-friendly label for a chamber day
 */
export const formatChamberDay = (day) => {
  return DAY_ORDER.includes(day) ? day : day || '';
};

export default {
  fetchAllDoctors,
  buildDoctorSearchText,
  formatChamberDay,
  ALL_DOCTORS_DAY_ORDER,
};