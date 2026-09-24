// components/ui/Dropdown.js
// ==================================================
// 🔽 Dropdown — Select dropdown (uses Modal picker)
// ==================================================
// NOTE: This wraps @react-native-picker/picker in a
// modern design-system Modal.
// For simpler cases, use existing PickerField.js.
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
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontFamily } from '../../theme/typography';
import { radius } from '../../theme/radius';

export default function Dropdown({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'নির্বাচন করুন',
  required = false,
  error,
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const openModal = () => {
    setTempValue(value);
    setModalVisible(true);
  };

  const handleDone = () => {
    onSelect?.(tempValue);
    setModalVisible(false);
  };

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.7}
        style={[styles.trigger, error && styles.triggerError]}
      >
        <Text
          style={[
            styles.triggerText,
            !value && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal Picker */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.pickerBox}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.headerBtn}
              >
                <Text style={styles.cancelText}>বাতিল</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>নির্বাচন করুন</Text>

              <TouchableOpacity onPress={handleDone} style={styles.headerBtn}>
                <Text style={styles.doneText}>ঠিক আছে</Text>
              </TouchableOpacity>
            </View>

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
                    color={colors.textPrimary}
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

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  required: { color: colors.error },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  triggerError: { borderColor: colors.error },
  triggerText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  placeholderText: { color: colors.textTertiary },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs + 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  pickerBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.round,
    borderTopRightRadius: radius.round,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 8, minWidth: 70 },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  cancelText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  doneText: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.accent,
    textAlign: 'right',
  },
  pickerWrapper: {
    height: Platform.OS === 'ios' ? 250 : 55,
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? 250 : 55,
    width: '100%',
    color: colors.textPrimary,
  },
  pickerItem: {
    fontSize: 18,
    height: 250,
    color: colors.textPrimary,
  },
});