// components/PickerField.js
// ==================================================
// 📋 PickerField — Modal-based Picker (iOS fix)
// Bengali font এর জন্য সঠিক height
// ==================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function PickerField({
  value,
  options = [],
  onSelect,
  placeholder = 'নির্বাচন করুন',
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const openModal = () => {
    setTempValue(value);
    setModalVisible(true);
  };

  const handleDone = () => {
    onSelect(tempValue);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  // ✅ Selected option-এর label খুঁজে বের করা
  const getSelectedLabel = () => {
    const found = options.find((opt) => opt.value === value);
    return found ? found.label : placeholder;
  };

  return (
    <View>
      {/* ============================================
          Trigger Button (Input-এর মতো দেখতে)
          ============================================ */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {getSelectedLabel()}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </TouchableOpacity>

      {/* ============================================
          Modal Picker
          ============================================ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          {/* Backdrop - Tap করে বন্ধ */}
          <TouchableOpacity
            style={styles.backdrop}
            onPress={handleCancel}
            activeOpacity={1}
          />

          {/* Picker Box */}
          <View style={styles.pickerBox}>
            {/* Header with Done + Cancel */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
                <Text style={styles.cancelText}>বাতিল</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>নির্বাচন করুন</Text>

              <TouchableOpacity onPress={handleDone} style={styles.headerBtn}>
                <Text style={styles.doneText}>ঠিক আছে</Text>
              </TouchableOpacity>
            </View>

            {/* Picker */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={tempValue}
                onValueChange={(val) => setTempValue(val)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {options.map((opt, idx) => (
                  <Picker.Item
                    key={idx}
                    label={opt.label}
                    value={opt.value}
                    color="#1e293b"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ==================================================
// 🎨 Styles
// ==================================================
const styles = StyleSheet.create({
  // Trigger
  trigger: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  triggerText: {
    fontSize: 15,
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  pickerBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    maxHeight: '60%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  cancelText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'left',
  },
  doneText: {
    fontSize: 15,
    color: '#0d9488',
    fontWeight: '700',
    textAlign: 'right',
  },

  // Picker
  pickerWrapper: {
    // ✅ iOS-এ Picker-এর জন্য পর্যাপ্ত height
    height: Platform.OS === 'ios' ? 250 : 55,
    justifyContent: 'center',
  },
  picker: {
    // ✅ iOS-এ height কম দিলে টেক্সট কাটা পড়ে, তাই বেশি দিতে হবে
    height: Platform.OS === 'ios' ? 250 : 55,
    width: '100%',
    color: '#1e293b',
  },
  pickerItem: {
    // ✅ iOS-এ font size এবং height ঠিক করা
    fontSize: 18,
    height: 250,
    color: '#1e293b',
  },
});