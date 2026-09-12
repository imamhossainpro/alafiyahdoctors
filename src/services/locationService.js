// src/services/locationService.js
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from '../firebase';

// ==================================================
// ✅ সব লোকেশন (শুধু Active) — Multi-field matching
// ==================================================
export const getAllLocations = async (hospitalId, includeInactive = false) => {
  if (!hospitalId) {
    console.warn('⚠️ getAllLocations: hospitalId নেই');
    return [];
  }
  try {
    // ---------- ১. Locations load ----------
    let locQuery = collection(db, 'hospitals', hospitalId, 'locations');
    if (!includeInactive) {
      locQuery = query(locQuery, where('isActive', '==', true));
    }
    const locSnapshot = await getDocs(locQuery);
    const locations = [];
    locSnapshot.forEach((d) => {
      locations.push({ id: d.id, ...d.data() });
    });

    if (locations.length === 0) return [];

    // ---------- ২. Location name → id map (case-insensitive) ----------
    const nameToIdMap = {};
    locations.forEach((loc) => {
      if (loc.name) {
        nameToIdMap[loc.name.toLowerCase().trim()] = loc.id;
      }
      if (loc.normalized) {
        nameToIdMap[loc.normalized.toLowerCase().trim()] = loc.id;
      }
    });

    // ---------- ৩. সব appointments load ----------
    const apptSnapshot = await getDocs(
      collection(db, 'hospitals', hospitalId, 'appointments')
    );

    // ---------- ৪. প্রতিটি appointment এর location নির্ধারণ ----------
    const countMap = {};
    apptSnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // ❌ Archived booking count এ ধরা হবে না
      if (data.isArchived === true) return;

      let matchedLocId = null;

      // ✅ Priority 1: locationId (সবচেয়ে নির্ভরযোগ্য)
      if (data.locationId) {
        const found = locations.find((l) => l.id === data.locationId);
        if (found) matchedLocId = found.id;
      }

      // ✅ Priority 2: locationName (case-insensitive)
      if (!matchedLocId && data.locationName) {
        const key = String(data.locationName).toLowerCase().trim();
        if (nameToIdMap[key]) matchedLocId = nameToIdMap[key];
      }

      // ✅ Priority 3: address (case-insensitive)
      if (!matchedLocId && data.address) {
        const key = String(data.address).toLowerCase().trim();
        if (nameToIdMap[key]) matchedLocId = nameToIdMap[key];
      }

      if (matchedLocId) {
        countMap[matchedLocId] = (countMap[matchedLocId] || 0) + 1;
      }
    });

    // ---------- ৫. Real count merge ----------
    const updatedLocations = locations.map((loc) => ({
      ...loc,
      patientCount: countMap[loc.id] || 0,
    }));

    // ---------- ৬. Sort by patient count ----------
    return updatedLocations.sort(
      (a, b) => (b.patientCount || 0) - (a.patientCount || 0)
    );
  } catch (error) {
    console.error('❌ getAllLocations error:', error);
    return [];
  }
};

// ==================================================
// ✅ লোকেশন তৈরি
// ==================================================
export const createLocation = async (hospitalId, name) => {
  if (!hospitalId) return null;
  try {
    const normalized = name.trim().toLowerCase();
    const q = query(
      collection(db, 'hospitals', hospitalId, 'locations'),
      where('normalized', '==', normalized),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    const newLocation = {
      name: name.trim(),
      normalized: normalized,
      patientCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(
      collection(db, 'hospitals', hospitalId, 'locations'),
      newLocation
    );
    return { id: docRef.id, ...newLocation };
  } catch (error) {
    console.error('❌ createLocation error:', error);
    return null;
  }
};

// ==================================================
// ✅ বুকিং থেকে লোকেশন যোগ/আপডেট
// ==================================================
export const addLocationFromBooking = async (
  hospitalId,
  address,
  appointmentId
) => {
  if (!hospitalId || !address || !address.trim()) return null;
  try {
    const name = address.trim();
    const normalized = name.toLowerCase();
    const q = query(
      collection(db, 'hospitals', hospitalId, 'locations'),
      where('normalized', '==', normalized),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    let locationId;
    if (snapshot.empty) {
      const newLocation = {
        name: name,
        normalized: normalized,
        patientCount: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(
        collection(db, 'hospitals', hospitalId, 'locations'),
        newLocation
      );
      locationId = docRef.id;
    } else {
      const locDoc = snapshot.docs[0];
      locationId = locDoc.id;
      const currentCount = locDoc.data().patientCount || 0;
      await updateDoc(
        doc(db, 'hospitals', hospitalId, 'locations', locationId),
        {
          patientCount: currentCount + 1,
          updatedAt: new Date().toISOString(),
        }
      );
    }
    await updateDoc(
      doc(db, 'hospitals', hospitalId, 'appointments', appointmentId),
      {
        locationId: locationId,
        locationName: name,
      }
    );
    return { id: locationId, name };
  } catch (error) {
    console.error('❌ addLocationFromBooking error:', error);
    return null;
  }
};

// ==================================================
// ✅ লোকেশন আপডেট (name change + appointments sync)
// ==================================================
export const updateLocation = async (hospitalId, id, newName) => {
  if (!hospitalId || !id) return;
  try {
    const docRef = doc(db, 'hospitals', hospitalId, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Location not found');
    const oldName = docSnap.data().name;

    await updateDoc(docRef, {
      name: newName.trim(),
      normalized: newName.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    });

    // Appointments এ locationName update
    const apptQuery = query(
      collection(db, 'hospitals', hospitalId, 'appointments'),
      where('locationName', '==', oldName)
    );
    const apptSnapshot = await getDocs(apptQuery);
    const batch = writeBatch(db);
    apptSnapshot.forEach((d) => {
      batch.update(d.ref, { locationName: newName.trim() });
    });

    // ✅ address matching appointmentsও update
    const apptQuery2 = query(
      collection(db, 'hospitals', hospitalId, 'appointments'),
      where('address', '==', oldName)
    );
    const apptSnapshot2 = await getDocs(apptQuery2);
    apptSnapshot2.forEach((d) => {
      batch.update(d.ref, { address: newName.trim() });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('❌ updateLocation error:', error);
    throw error;
  }
};

// ==================================================
// ✅ লোকেশন ডিলিট (Soft Delete + Appointment Cleanup)
// ==================================================
export const deleteLocation = async (hospitalId, id, force = false) => {
  if (!hospitalId || !id) return;
  try {
    const docRef = doc(db, 'hospitals', hospitalId, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Location not found');

    if (!force && docSnap.data().patientCount > 0) {
      throw new Error('Location has patients, cannot delete');
    }

    // Soft Delete
    await updateDoc(docRef, {
      isActive: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Appointments থেকে reference সরান
    const apptQuery = query(
      collection(db, 'hospitals', hospitalId, 'appointments'),
      where('locationId', '==', id)
    );
    const apptSnapshot = await getDocs(apptQuery);
    const batch = writeBatch(db);
    apptSnapshot.forEach((d) => {
      batch.update(d.ref, {
        locationId: null,
        locationName: null,
      });
    });
    await batch.commit();

    return true;
  } catch (error) {
    console.error('❌ deleteLocation error:', error);
    throw error;
  }
};

// ==================================================
// ✅ লোকেশন মার্জ
// ==================================================
export const mergeLocations = async (hospitalId, masterId, slaveIds) => {
  if (!hospitalId || !masterId || !slaveIds || slaveIds.length === 0) return;
  try {
    const master = await getLocationById(hospitalId, masterId);
    if (!master) throw new Error('Master location not found');

    const batch = writeBatch(db);
    let totalPatients = master.patientCount || 0;
    let deletedSlaves = 0;

    for (const slaveId of slaveIds) {
      const slave = await getLocationById(hospitalId, slaveId);
      if (!slave) continue;

      const apptQuery = query(
        collection(db, 'hospitals', hospitalId, 'appointments'),
        where('locationId', '==', slaveId)
      );
      const apptSnapshot = await getDocs(apptQuery);
      apptSnapshot.forEach((d) => {
        batch.update(d.ref, {
          locationId: masterId,
          locationName: master.name,
        });
      });
      totalPatients += apptSnapshot.size;

      const slaveRef = doc(db, 'hospitals', hospitalId, 'locations', slaveId);
      batch.update(slaveRef, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      deletedSlaves++;
    }

    batch.update(doc(db, 'hospitals', hospitalId, 'locations', masterId), {
      patientCount: totalPatients,
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
    return { success: true, masterId, deletedSlaves, totalPatients };
  } catch (error) {
    console.error('❌ mergeLocations error:', error);
    throw error;
  }
};

// ==================================================
// ✅ ডুপ্লিকেট ডিটেক্ট
// ==================================================
const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
    }
  }
  return matrix[b.length][a.length];
};

const getStringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase(),
    s2 = str2.toLowerCase();
  const getBigrams = (str) => {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++)
      bigrams.push(str.substring(i, i + 2));
    return bigrams;
  };
  const b1 = new Set(getBigrams(s1)),
    b2 = new Set(getBigrams(s2));
  const inter = new Set([...b1].filter((x) => b2.has(x)));
  const union = new Set([...b1, ...b2]);
  const jaccard = union.size > 0 ? inter.size / union.size : 0;
  const maxLen = Math.max(s1.length, s2.length);
  const levDist = levenshteinDistance(s1, s2);
  const levSim = maxLen > 0 ? 1 - levDist / maxLen : 0;
  return (jaccard + levSim) / 2;
};

export const detectDuplicateLocations = async (hospitalId) => {
  if (!hospitalId) return [];
  try {
    const locations = await getAllLocations(hospitalId);
    const duplicates = [];
    const used = new Set();
    for (let i = 0; i < locations.length; i++) {
      if (used.has(i)) continue;
      const group = [locations[i]];
      used.add(i);
      for (let j = i + 1; j < locations.length; j++) {
        if (used.has(j)) continue;
        const sim = getStringSimilarity(
          locations[i].normalized || locations[i].name.toLowerCase(),
          locations[j].normalized || locations[j].name.toLowerCase()
        );
        if (sim > 0.65) {
          group.push(locations[j]);
          used.add(j);
        }
      }
      if (group.length > 1) {
        const master = group.reduce((a, b) =>
          (a.patientCount || 0) > (b.patientCount || 0) ? a : b
        );
        const slaves = group.filter((l) => l.id !== master.id);
        duplicates.push({ master, slaves });
      }
    }
    return duplicates;
  } catch (error) {
    console.error('❌ detectDuplicateLocations error:', error);
    return [];
  }
};

// ==================================================
// ✅ মাইগ্রেশন (legacy support)
// ==================================================
export const migrateAppointmentsToLocations = async (hospitalId) => {
  if (!hospitalId) return null;
  try {
    console.log('🔄 মাইগ্রেশন শুরু...');
    const apptSnapshot = await getDocs(
      collection(db, 'hospitals', hospitalId, 'appointments')
    );
    const appointments = [];
    apptSnapshot.forEach((d) => appointments.push({ id: d.id, ...d.data() }));

    if (appointments.length === 0) return { created: 0, updated: 0 };

    const locationMap = new Map();
    appointments.forEach((appt) => {
      if (appt.isArchived === true) return;
      if (!appt.address || !appt.address.trim()) return;
      const rawName = appt.address.trim();
      const normalized = rawName.toLowerCase();
      if (locationMap.has(normalized)) {
        const existing = locationMap.get(normalized);
        existing.count += 1;
        existing.appointmentIds.push(appt.id);
      } else {
        locationMap.set(normalized, {
          name: rawName,
          count: 1,
          appointmentIds: [appt.id],
        });
      }
    });

    if (locationMap.size === 0) return { created: 0, updated: 0 };

    const batch = writeBatch(db);
    let createdCount = 0;
    let updatedCount = 0;

    for (const [normalized, data] of locationMap) {
      const q = query(
        collection(db, 'hospitals', hospitalId, 'locations'),
        where('normalized', '==', normalized),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);

      let locationId;
      if (snapshot.empty) {
        const newLocation = {
          name: data.name,
          normalized: normalized,
          patientCount: data.count,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const docRef = await addDoc(
          collection(db, 'hospitals', hospitalId, 'locations'),
          newLocation
        );
        locationId = docRef.id;
        createdCount++;
      } else {
        const locDoc = snapshot.docs[0];
        locationId = locDoc.id;
        const currentCount = locDoc.data().patientCount || 0;
        await updateDoc(
          doc(db, 'hospitals', hospitalId, 'locations', locationId),
          {
            patientCount: currentCount + data.count,
            updatedAt: new Date().toISOString(),
          }
        );
        updatedCount++;
      }

      for (const apptId of data.appointmentIds) {
        const apptRef = doc(db, 'hospitals', hospitalId, 'appointments', apptId);
        batch.update(apptRef, { locationId, locationName: data.name });
      }
    }

    await batch.commit();
    console.log(`✅ মাইগ্রেশন: ${createdCount} created, ${updatedCount} updated`);
    return { created: createdCount, updated: updatedCount };
  } catch (error) {
    console.error('❌ মাইগ্রেশন ব্যর্থ:', error);
    throw error;
  }
};

// ==================================================
// ✅ কাউন্ট রিক্যালকুলেট
// ==================================================
export const recalculateAllCounts = async (hospitalId) => {
  if (!hospitalId) return null;
  try {
    console.log('🔄 রিক্যালকুলেট শুরু...');
    const apptSnapshot = await getDocs(
      collection(db, 'hospitals', hospitalId, 'appointments')
    );
    const countMap = {};
    apptSnapshot.forEach((d) => {
      const data = d.data();
      if (data.isArchived === true) return;
      if (data.locationId) {
        countMap[data.locationId] = (countMap[data.locationId] || 0) + 1;
      }
    });

    const locSnapshot = await getDocs(
      query(
        collection(db, 'hospitals', hospitalId, 'locations'),
        where('isActive', '==', true)
      )
    );
    const batch = writeBatch(db);
    let updatedCount = 0;

    locSnapshot.forEach((d) => {
      const locId = d.id;
      const locData = d.data();
      const realCount = countMap[locId] || 0;
      if (locData.patientCount !== realCount) {
        batch.update(d.ref, {
          patientCount: realCount,
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
      }
    });

    await batch.commit();
    console.log(`✅ রিক্যালকুলেট: ${updatedCount} updated`);
    return { updated: updatedCount, success: true };
  } catch (error) {
    console.error('❌ recalculateAllCounts error:', error);
    throw error;
  }
};

// ==================================================
// ✅ লোকেশন পাওয়া
// ==================================================
export const getLocationById = async (hospitalId, id) => {
  if (!hospitalId || !id) return null;
  try {
    const docRef = doc(db, 'hospitals', hospitalId, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    if (data.isActive === false) return null;
    return { id: docSnap.id, ...data };
  } catch (error) {
    console.error('❌ getLocationById error:', error);
    return null;
  }
};

export default {
  getAllLocations,
  createLocation,
  addLocationFromBooking,
  updateLocation,
  deleteLocation,
  mergeLocations,
  detectDuplicateLocations,
  migrateAppointmentsToLocations,
  recalculateAllCounts,
  getLocationById,
};