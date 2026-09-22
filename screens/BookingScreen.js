// screens/BookingScreen.js
// ==================================================
// 📅 রোগীর ডাক্তার বুকিং ফর্ম
// ==================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import QRCode from 'react-native-qrcode-svg';

import { loadDepartments, loadPanels } from '../services/dataService';
import {
  findPatientByMobile,
  createPatient,
  addPatientVisit,
} from '../services/patientService';
import {
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  Timestamp,
} from '../firebase';
import { useHospital } from '../context/HospitalContext';
import HeaderMenu from '../components/HeaderMenu';

// ==================================================
// ✅ Constants
// ==================================================
const MAX_DAYS_AHEAD = 7;

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

const BANGLA_DAYS_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const BANGLA_DAYS_FULL = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
];

const GENDER_OPTIONS = ['পুরুষ', 'মহিলা', 'অন্যান্য'];

const REFERRAL_OPTIONS = [
  'Walk-in / নিজে এসেছেন',
  'Refer Doctor',
  'Facebook',
  'Google',
  'Campaign / Medical Camp',
  'আত্মীয়/বন্ধু',
  'অন্যান্য',
];

const WEB_APP_URL = 'https://doctors.alafiyahhospital.com';

const toEnglishDigits = (str) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return str.replace(/[০-৯]/g, (char) =>
    banglaDigits.indexOf(char) !== -1 ? englishDigits[banglaDigits.indexOf(char)] : char
  );
};

const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

const getBanglaDayName = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return BANGLA_DAYS_FULL[d.getDay()];
};

// ==================================================
// ✅ Main Component
// ==================================================
export default function BookingScreen({ navigation }) {
  const { hospitalId } = useHospital();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    mobile: '',
    gender: 'পুরুষ',
    address: '',
    referralSource: 'Walk-in / নিজে এসেছেন',
  });

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Doctor Data State
  const [departments, setDepartments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // ✅ Header Menu Button
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerRight: () => <HeaderMenu />,
        headerRightContainerStyle: {
          paddingRight: 12,
        },
      });
    }
  }, [navigation]);

  // Selected Date-এর বাংলা দিন
  const selectedDayName = useMemo(
    () => getBanglaDayName(selectedDate),
    [selectedDate]
  );

  // এ মাসের কত দিন
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);

    return days;
  }, [viewDate]);

  const todayStr = getTodayString();
  const maxDateStr = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + MAX_DAYS_AHEAD);
    return `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-${String(max.getDate()).padStart(2, '0')}`;
  }, []);

  // ==================================================
  // Load Departments & Panels
  // ==================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, pnls] = await Promise.all([
          loadDepartments(hospitalId),
          loadPanels(hospitalId),
        ]);
        setDepartments(depts);
        setPanels(pnls);
      } catch (err) {
        console.error('❌ Load error:', err);
      }
    };
    loadData();
  }, [hospitalId]);

  // ==================================================
  // Date Change → Update Doctors
  // ==================================================
  useEffect(() => {
    if (panels.length === 0 || departments.length === 0) return;

    setLoadingDoctors(true);
    const dayName = getBanglaDayName(selectedDate);
    const dayPanel = panels.find((p) => p.name === dayName);

    if (!dayPanel) {
      setAvailableDoctors([]);
      setSelectedDoctor(null);
      setLoadingDoctors(false);
      return;
    }

    const activeIds = dayPanel.activeDoctorIds || [];
    const docs = [];
    departments.forEach((dept) => {
      (dept.doctors || []).forEach((doc) => {
        if (activeIds.includes(doc.id)) {
          docs.push({
            ...doc,
            deptId: dept.id,
            deptName: dept.name,
            deptColor: dept.color,
          });
        }
      });
    });

    setAvailableDoctors(docs);
    setSelectedDoctor(null);
    setSelectedDepartment('all');
    setLoadingDoctors(false);
  }, [selectedDate, panels, departments]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    if (selectedDepartment === 'all') return availableDoctors;
    return availableDoctors.filter((d) => d.deptId === selectedDepartment);
  }, [availableDoctors, selectedDepartment]);

  const departmentFilterOptions = useMemo(() => {
    const uniqueDepts = new Map();
    availableDoctors.forEach((doc) => {
      if (!uniqueDepts.has(doc.deptId)) {
        uniqueDepts.set(doc.deptId, {
          id: doc.deptId,
          name: doc.deptName,
          color: doc.deptColor,
        });
      }
    });
    return Array.from(uniqueDepts.values());
  }, [availableDoctors]);

  // ==================================================
  // Handlers
  // ==================================================
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9০-৯]/g, '');
    handleChange('mobile', cleaned);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    if (!day) return;
    const year = viewDate.getFullYear();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    if (dateStr < todayStr || dateStr > maxDateStr) return;
    setSelectedDate(dateStr);
  };

  const handleDeselectDoctor = () => {
    setSelectedDoctor(null);
  };

  const handleNewBooking = () => {
    setFormData({
      name: '',
      age: '',
      mobile: '',
      gender: 'পুরুষ',
      address: '',
      referralSource: 'Walk-in / নিজে এসেছেন',
    });
    setSelectedDoctor(null);
    setSelectedDate(getTodayString());
    setBookingResult(null);
  };

  // ==================================================
  // SUBMIT → Firebase Save
  // ==================================================
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('⚠️', 'রোগীর নাম লিখুন');
      return;
    }
    if (!formData.age.trim()) {
      Alert.alert('⚠️', 'বয়স লিখুন');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length < 11) {
      Alert.alert('⚠️', '১১ digit মোবাইল নম্বর লিখুন');
      return;
    }
    if (!selectedDoctor) {
      Alert.alert('⚠️', 'ডাক্তার নির্বাচন করুন');
      return;
    }

    setSubmitting(true);

    try {
      const mobile = toEnglishDigits(formData.mobile.trim());
      const age = toEnglishDigits(formData.age.trim());

      // 1. Patient তৈরি / খুঁজে বের করা
      let patient = await findPatientByMobile(hospitalId, mobile);
      let patientId;
      let isNewPatient = true;

      if (patient) {
        patientId = patient.id;
        isNewPatient = false;
      } else {
        const newPatient = await createPatient(hospitalId, {
          name: formData.name.trim(),
          mobile,
          age,
          gender: formData.gender,
          address: formData.address.trim(),
        });
        patientId = newPatient.id;
        isNewPatient = true;
      }

      // Visit track
      await addPatientVisit(hospitalId, {
        patientId,
        doctorName: selectedDoctor.name,
        visitDate: selectedDate,
      });

      // 2. Serial Number
      const counterKey = `${selectedDoctor.id}_${selectedDate}`;
      const counterRef = doc(
        db,
        'hospitals',
        hospitalId,
        'counters',
        counterKey
      );

      let serialNo = 1;
      const counterDoc = await getDoc(counterRef);

      if (counterDoc.exists()) {
        serialNo = (counterDoc.data().count || 0) + 1;
        await setDoc(
          counterRef,
          {
            count: serialNo,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            date: selectedDate,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } else {
        await setDoc(counterRef, {
          count: serialNo,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          date: selectedDate,
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Appointment তৈরি
      const doctorTime =
        selectedDoctor.timeSlots && selectedDoctor.timeSlots.length > 0
          ? `${selectedDoctor.timeSlots[0].start} - ${selectedDoctor.timeSlots[0].end}`
          : '';

      const appointmentData = {
        name: formData.name.trim(),
        age,
        mobile,
        gender: formData.gender,
        address: formData.address.trim(),
        patientId,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorDept: selectedDoctor.deptName,
        doctorQuals: selectedDoctor.quals || '',
        doctorTime,
        bookingDate: selectedDate,
        bookingDay: selectedDayName,
        serialNo,
        referralSource: formData.referralSource,
        status: 'pending',
        isArchived: false,
        isNew: isNewPatient,
        isRead: false,
        hospitalId,
        timestamp: new Date().toISOString(),
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, 'hospitals', hospitalId, 'appointments'),
        appointmentData
      );

      setBookingResult({
        appointmentId: docRef.id,
        serialNo,
        patientName: formData.name.trim(),
        mobile,
        doctorName: selectedDoctor.name,
        doctorTime,
        bookingDate: selectedDate,
        bookingDay: selectedDayName,
        isNewPatient,
      });
    } catch (error) {
      console.error('❌ Submit error:', error);
      Alert.alert('❌ বুকিং ব্যর্থ', error.message || 'আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  // ==================================================
  // Render Doctor Card
  // ==================================================
  const renderDoctorCard = (doc, isSelected) => (
    <TouchableOpacity
      key={doc.id}
      style={[
        styles.doctorCard,
        isSelected && styles.doctorCardSelected,
        { borderLeftColor: doc.deptColor || '#0d9488' },
      ]}
      onPress={() => setSelectedDoctor(doc)}
      activeOpacity={0.7}
      disabled={isSelected}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.doctorHeaderText}>
          <Text style={styles.doctorName}>{doc.name}</Text>
          <Text style={styles.doctorDept}>{doc.deptName}</Text>
        </View>

        <View
          style={[
            styles.radioCircle,
            isSelected && styles.radioCircleSelected,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </View>

      {doc.specialty ? (
        <Text style={styles.doctorSpecialty}>{doc.specialty}</Text>
      ) : null}

      {doc.quals ? <Text style={styles.doctorQuals}>{doc.quals}</Text> : null}

      {doc.workplace ? (
        <Text style={styles.doctorWorkplace}>{doc.workplace}</Text>
      ) : null}

      {doc.timeSlots && doc.timeSlots.length > 0 && (
        <View style={styles.timeSlotsContainer}>
          {doc.timeSlots.map((slot, idx) => (
            <View key={idx} style={styles.timeSlotBadge}>
              <Ionicons name="time-outline" size={13} color="#b45309" />
              <Text style={styles.timeSlotText}>
                {slot.start} - {slot.end}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // ==================================================
  // SUCCESS SCREEN
  // ==================================================
  if (bookingResult) {
    const checkinUrl = `${WEB_APP_URL}/checkin/${bookingResult.appointmentId}`;

    return (
      <View style={styles.successContainer}>
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          </View>

          <Text style={styles.successTitle}>বুকিং সফল হয়েছে!</Text>

          {bookingResult.isNewPatient && (
            <View style={styles.newPatientBadge}>
              <Ionicons name="sparkles" size={14} color="#7c3aed" />
              <Text style={styles.newPatientText}>নতুন রোগী</Text>
            </View>
          )}

          <View style={styles.serialBox}>
            <Text style={styles.serialLabel}>আপনার সিরিয়াল নম্বর</Text>
            <Text style={styles.serialNumber}>{bookingResult.serialNo}</Text>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>রোগী:</Text>
              <Text style={styles.detailValue}>{bookingResult.patientName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="medkit-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>ডাক্তার:</Text>
              <Text style={styles.detailValue}>{bookingResult.doctorName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <Text style={styles.detailLabel}>তারিখ:</Text>
              <Text style={styles.detailValue}>
                {formatDisplayDate(bookingResult.bookingDate)} ({bookingResult.bookingDay})
              </Text>
            </View>

            {bookingResult.doctorTime ? (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color="#64748b" />
                <Text style={styles.detailLabel}>সময়:</Text>
                <Text style={styles.detailValue}>{bookingResult.doctorTime}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>চেক-ইন QR কোড</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={checkinUrl}
                size={180}
                color="#1c5fa8"
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrSubtext}>
              হাসপাতালে এসে QR স্ক্যান করে চেক-ইন করুন
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newBookingButton}
            onPress={handleNewBooking}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.newBookingText}>নতুন সিরিয়াল দিন</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ==================================================
  // MAIN FORM
  // ==================================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>রোগীর ডাক্তার বুকিং ফর্ম</Text>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#0d9488" />
            <Text style={styles.sectionTitle}>বুকিং তারিখ নির্বাচন</Text>
          </View>

          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.calMonthText}>
              {BANGLA_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.calWeekdays}>
            {BANGLA_DAYS_SHORT.map((d, i) => (
              <View key={i} style={styles.calWeekdayCell}>
                <Text style={styles.calWeekdayText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calDaysGrid}>
            {monthDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.calDayCell} />;
              }

              const year = viewDate.getFullYear();
              const month = String(viewDate.getMonth() + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${year}-${month}-${dayStr}`;

              const isPast = dateStr < todayStr;
              const isBeyondMax = dateStr > maxDateStr;
              const isDisabled = isPast || isBeyondMax;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={day}
                  style={styles.calDayCell}
                  onPress={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.calDayCircle,
                      isSelected && styles.calDaySelected,
                      isToday && !isSelected && styles.calDayToday,
                      isDisabled && styles.calDayDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isSelected && styles.calDayTextSelected,
                        isDisabled && styles.calDayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.selectedDateBox}>
            <Ionicons name="calendar" size={18} color="#0d9488" />
            <Text style={styles.selectedDateText}>
              নির্বাচিত: {formatDisplayDate(selectedDate)} ({selectedDayName})
            </Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#0d9488" />
            <Text style={styles.sectionTitle}>
              রোগীর তথ্য <Text style={styles.required}>*</Text>
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              রোগীর নাম <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder="আপনার পুরো নাম"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              বয়স <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => handleChange('age', toEnglishDigits(text))}
              placeholder="২৫"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              maxLength={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              মোবাইল নম্বর <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.mobile}
              onChangeText={handleMobileChange}
              placeholder="০১৭xxxxxxxx"
              keyboardType="phone-pad"
              placeholderTextColor="#94a3b8"
              maxLength={11}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              লিঙ্গ <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(val) => handleChange('gender', val)}
                style={styles.picker}
                dropdownIconColor="#64748b"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <Picker.Item key={opt} label={opt} value={opt} color="#1e293b" />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>বর্তমান ঠিকানা (ঐচ্ছিক)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="আপনার বর্তমান ঠিকানা লিখুন"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Referral */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#0d9488" />
            <Text style={styles.sectionTitle}>রেফারেল তথ্য (ঐচ্ছিক)</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>রোগী কীভাবে এসেছেন?</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.referralSource}
                onValueChange={(val) => handleChange('referralSource', val)}
                style={styles.picker}
                dropdownIconColor="#64748b"
              >
                {REFERRAL_OPTIONS.map((opt) => (
                  <Picker.Item key={opt} label={opt} value={opt} color="#1e293b" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Doctor Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit-outline" size={20} color="#0d9488" />
            <Text style={styles.sectionTitle}>
              ডাক্তার নির্বাচন ({selectedDayName}) <Text style={styles.required}>*</Text>
            </Text>
          </View>

          {loadingDoctors ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0d9488" />
              <Text style={styles.loadingText}>ডাক্তার লোড হচ্ছে...</Text>
            </View>
          ) : availableDoctors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>
                {selectedDayName}-এ কোনো ডাক্তার নেই
              </Text>
              <Text style={styles.emptySubtext}>অন্য তারিখ নির্বাচন করুন</Text>
            </View>
          ) : selectedDoctor ? (
            <>
              {renderDoctorCard(selectedDoctor, true)}

              <TouchableOpacity
                style={styles.deselectButton}
                onPress={handleDeselectDoctor}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={18} color="#475569" />
                <Text style={styles.deselectButtonText}>
                  ডাক্তার পরিবর্তন করুন (ডিসিলেক্ট)
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>বিভাগ নির্বাচন করুন</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedDepartment}
                    onValueChange={(val) => setSelectedDepartment(val)}
                    style={styles.picker}
                    dropdownIconColor="#64748b"
                  >
                    <Picker.Item
                      label={`সব বিভাগ (${availableDoctors.length})`}
                      value="all"
                      color="#1e293b"
                    />
                    {departmentFilterOptions.map((dept) => {
                      const count = availableDoctors.filter(
                        (d) => d.deptId === dept.id
                      ).length;
                      return (
                        <Picker.Item
                          key={dept.id}
                          label={`${dept.name} (${count})`}
                          value={dept.id}
                          color="#1e293b"
                        />
                      );
                    })}
                  </Picker>
                </View>
              </View>

              <View style={styles.doctorList}>
                {filteredDoctors.map((doc) => renderDoctorCard(doc, false))}
              </View>
            </>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedDoctor || submitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!selectedDoctor || submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>সেভ হচ্ছে...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>সিরিয়াল নিশ্চিত করুন</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f766e' },

  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6,
    flex: 1,
  },
  required: { color: '#dc2626' },

  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  calMonthText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  calWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  calWeekdayCell: { flex: 1, alignItems: 'center' },
  calWeekdayText: { fontSize: 12.5, fontWeight: '700', color: '#64748b' },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calDayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  calDaySelected: { backgroundColor: '#0d9488' },
  calDayToday: { borderWidth: 2, borderColor: '#0d9488' },
  calDayDisabled: { opacity: 0.3 },
  calDayText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  calDayTextSelected: { color: '#fff', fontWeight: 'bold' },
  calDayTextDisabled: { color: '#94a3b8' },
  selectedDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  selectedDateText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0d9488',
    flex: 1,
  },

  // Form
  formGroup: { marginBottom: 14 },
  label: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    minHeight: 50,
  },
  textarea: { minHeight: 80, paddingTop: 12 },

  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 55,
  },
  picker: { height: 55, width: '100%', color: '#1e293b' },

  loadingBox: { padding: 30, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b' },
  emptyBox: { padding: 30, alignItems: 'center', gap: 10 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  emptySubtext: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },

  // Doctor Cards
  doctorList: { gap: 14 },
  doctorCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
  },
  doctorCardSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  doctorHeaderText: { flex: 1 },
  doctorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 4,
  },
  doctorDept: {
    fontSize: 12.5,
    color: '#0d9488',
    fontWeight: '600',
    lineHeight: 18,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: '#0d9488',
    backgroundColor: '#0d9488',
  },
  doctorSpecialty: {
    fontSize: 13.5,
    color: '#9c2a7e',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  doctorQuals: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 6,
  },
  doctorWorkplace: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    lineHeight: 16,
  },

  deselectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  deselectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  // Submit
  submitButton: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success Screen
  successContainer: { flex: 1, backgroundColor: '#f4f7f6' },
  successContent: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
  },
  successIconBox: { marginBottom: 16 },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  newPatientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  newPatientText: { fontSize: 12.5, fontWeight: '700', color: '#7c3aed' },
  serialBox: {
    backgroundColor: '#0d9488',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  serialLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
    fontWeight: '600',
  },
  serialNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 54,
  },
  detailsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13.5,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrSubtext: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  newBookingButton: {
    backgroundColor: '#1c5fa8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    shadowColor: '#1c5fa8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newBookingText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});