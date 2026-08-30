import { db, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch, query, where } from '../firebase';

// ---------- লোকেশন CRUD ----------

// সব লোকেশন পাওয়া
export const getAllLocations = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'locations'));
    const locations = [];
    snapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    console.log('✅ লোকেশন ডেটা:', locations);
    return locations.sort((a, b) => (b.patientCount || 0) - (a.patientCount || 0));
  } catch (error) {
    console.error('Get all locations error:', error);
    return [];
  }
};

// একটি লোকেশন পাওয়া
export const getLocationById = async (id) => {
  try {
    const docRef = doc(db, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Get location error:', error);
    return null;
  }
};

// লোকেশন তৈরি করা (যদি না থাকে)
export const createLocation = async (name) => {
  try {
    const normalized = name.trim().toLowerCase();
    const q = query(collection(db, 'locations'), where('normalized', '==', normalized));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    const newLocation = {
      name: name.trim(),
      normalized: normalized,
      patientCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'locations'), newLocation);
    return { id: docRef.id, ...newLocation };
  } catch (error) {
    console.error('Create location error:', error);
    return null;
  }
};

// লোকেশন এডিট
export const updateLocation = async (id, newName) => {
  try {
    const docRef = doc(db, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Location not found');
    
    const oldName = docSnap.data().name;
    const newNormalized = newName.trim().toLowerCase();
    
    await updateDoc(docRef, {
      name: newName.trim(),
      normalized: newNormalized,
      updatedAt: new Date().toISOString()
    });

    // appointments আপডেট
    const apptQuery = query(collection(db, 'appointments'), where('locationName', '==', oldName));
    const apptSnapshot = await getDocs(apptQuery);
    const batch = writeBatch(db);
    apptSnapshot.forEach((doc) => {
      batch.update(doc.ref, { locationName: newName.trim() });
    });
    await batch.commit();

    // patients আপডেট
    const patientQuery = query(collection(db, 'patients'), where('locationName', '==', oldName));
    const patientSnapshot = await getDocs(patientQuery);
    const batch2 = writeBatch(db);
    patientSnapshot.forEach((doc) => {
      batch2.update(doc.ref, { locationName: newName.trim() });
    });
    await batch2.commit();

    return true;
  } catch (error) {
    console.error('Update location error:', error);
    throw error;
  }
};

// লোকেশন ডিলিট
export const deleteLocation = async (id, moveToLocationId = null) => {
  try {
    const docRef = doc(db, 'locations', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Location not found');
    
    if (moveToLocationId) {
      const targetLocation = await getLocationById(moveToLocationId);
      if (!targetLocation) throw new Error('Target location not found');
      
      const apptQuery = query(collection(db, 'appointments'), where('locationId', '==', id));
      const apptSnapshot = await getDocs(apptQuery);
      const batch = writeBatch(db);
      apptSnapshot.forEach((doc) => {
        batch.update(doc.ref, { 
          locationId: moveToLocationId,
          locationName: targetLocation.name
        });
      });
      await batch.commit();

      const patientQuery = query(collection(db, 'patients'), where('locationId', '==', id));
      const patientSnapshot = await getDocs(patientQuery);
      const batch2 = writeBatch(db);
      patientSnapshot.forEach((doc) => {
        batch2.update(doc.ref, { 
          locationId: moveToLocationId,
          locationName: targetLocation.name
        });
      });
      await batch2.commit();

      await updateDoc(doc(db, 'locations', moveToLocationId), {
        patientCount: (targetLocation.patientCount || 0) + apptSnapshot.size,
        updatedAt: new Date().toISOString()
      });
    }

    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Delete location error:', error);
    throw error;
  }
};

// ---------- লোকেশন মার্জ ----------
export const mergeLocations = async (masterId, slaveIds) => {
  try {
    const master = await getLocationById(masterId);
    if (!master) throw new Error('Master location not found');
    
    const batch = writeBatch(db);
    let totalPatients = master.patientCount || 0;

    for (const slaveId of slaveIds) {
      const slave = await getLocationById(slaveId);
      if (!slave) continue;
      
      const apptQuery = query(collection(db, 'appointments'), where('locationId', '==', slaveId));
      const apptSnapshot = await getDocs(apptQuery);
      apptSnapshot.forEach((doc) => {
        batch.update(doc.ref, { 
          locationId: masterId,
          locationName: master.name
        });
      });
      totalPatients += apptSnapshot.size;

      const patientQuery = query(collection(db, 'patients'), where('locationId', '==', slaveId));
      const patientSnapshot = await getDocs(patientQuery);
      patientSnapshot.forEach((doc) => {
        batch.update(doc.ref, { 
          locationId: masterId,
          locationName: master.name
        });
      });

      batch.delete(doc(db, 'locations', slaveId));
    }

    batch.update(doc(db, 'locations', masterId), {
      patientCount: totalPatients,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Merge locations error:', error);
    throw error;
  }
};

// ---------- রোগী মুভ ----------
export const movePatientsToLocation = async (appointmentIds, newLocationId) => {
  try {
    const targetLocation = await getLocationById(newLocationId);
    if (!targetLocation) throw new Error('Target location not found');
    
    const batch = writeBatch(db);
    const patientIds = new Set();

    for (const apptId of appointmentIds) {
      const apptRef = doc(db, 'appointments', apptId);
      const apptSnap = await getDoc(apptRef);
      if (apptSnap.exists()) {
        const data = apptSnap.data();
        if (data.patientId) patientIds.add(data.patientId);
        batch.update(apptRef, {
          locationId: newLocationId,
          locationName: targetLocation.name
        });
      }
    }

    for (const patientId of patientIds) {
      const patientRef = doc(db, 'patients', patientId);
      batch.update(patientRef, {
        locationId: newLocationId,
        locationName: targetLocation.name
      });
    }

    const locRef = doc(db, 'locations', newLocationId);
    const locSnap = await getDoc(locRef);
    const currentCount = locSnap.exists() ? (locSnap.data().patientCount || 0) : 0;
    batch.update(locRef, {
      patientCount: currentCount + appointmentIds.length,
      updatedAt: new Date().toISOString()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Move patients error:', error);
    throw error;
  }
};

// ---------- ডুপ্লিকেট ডিটেক্ট ----------
export const detectDuplicateLocations = async () => {
  try {
    const locations = await getAllLocations();
    const duplicates = [];
    const used = new Set();

    for (let i = 0; i < locations.length; i++) {
      if (used.has(i)) continue;
      const group = [locations[i]];
      used.add(i);
      
      for (let j = i + 1; j < locations.length; j++) {
        if (used.has(j)) continue;
        const sim = getStringSimilarity(locations[i].normalized, locations[j].normalized);
        if (sim > 0.6) {
          group.push(locations[j]);
          used.add(j);
        }
      }
      
      if (group.length > 1) {
        const master = group.reduce((a, b) => (a.patientCount || 0) > (b.patientCount || 0) ? a : b);
        const slaves = group.filter(l => l.id !== master.id);
        duplicates.push({ master, slaves });
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Detect duplicates error:', error);
    return [];
  }
};

// হেল্পার: স্ট্রিং সিমিলারিটি (জ্যাকার্ড)
const getStringSimilarity = (str1, str2) => {
  const getBigrams = (str) => {
    const bigrams = [];
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.push(str.substring(i, i + 2));
    }
    return bigrams;
  };
  const bigrams1 = new Set(getBigrams(str1));
  const bigrams2 = new Set(getBigrams(str2));
  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
  const union = new Set([...bigrams1, ...bigrams2]);
  return intersection.size / (union.size || 1);
};

// ---------- লোকেশন কাউন্ট রি-ক্যালকুলেট ----------
export const recalculateLocationCounts = async () => {
  try {
    const locations = await getAllLocations();
    const batch = writeBatch(db);
    
    for (const loc of locations) {
      const apptQuery = query(collection(db, 'appointments'), where('locationId', '==', loc.id));
      const apptSnapshot = await getDocs(apptQuery);
      batch.update(doc(db, 'locations', loc.id), {
        patientCount: apptSnapshot.size,
        updatedAt: new Date().toISOString()
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Recalculate counts error:', error);
    return false;
  }
};