import { db, collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where } from '../firebase';

export const findPatientByMobile = async (mobile) => {
  try {
    const q = query(collection(db, 'patients'), where('mobile', '==', mobile));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Find patient error:', error);
    return null;
  }
};

export const createPatient = async (patientData) => {
  try {
    const newPatient = {
      ...patientData,
      visits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'patients'), newPatient);
    return { id: docRef.id, ...newPatient };
  } catch (error) {
    console.error('Create patient error:', error);
    return null;
  }
};

export const addPatientVisit = async (patientId, doctorName, date) => {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Patient not found');
    const data = docSnap.data();
    const visits = data.visits || [];
    visits.push({ doctorName, date });
    await updateDoc(docRef, {
      visits: visits,
      updatedAt: new Date().toISOString()
    });
    return visits;
  } catch (error) {
    console.error('Add patient visit error:', error);
    throw error;
  }
};

export const getPatientById = async (patientId) => {
  if (!patientId) return null;
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Get patient error:', error);
    return null;
  }
};

export const getAllPatients = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'patients'));
    const patients = [];
    snapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    return patients;
  } catch (error) {
    console.error('Get all patients error:', error);
    return [];
  }
};