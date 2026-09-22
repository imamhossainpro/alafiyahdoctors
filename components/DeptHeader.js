// components/DeptHeader.js
// ==================================================
// 🏥 Department Header with Lucide SVG Icons
// ==================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Stethoscope,
  Scissors,
  Heart,
  Baby,
  Bone,
  Syringe,
  Pill,
  Activity,
  Brain,
  Eye,
  Utensils,
  Smile,
  Sparkles,
  User,
  Droplet,
  Thermometer,
  Ear,
} from 'lucide-react-native';

// ✅ ICONS Map (Web app-এর সাথে হুবহু মিল)
const ICONS = {
  Stethoscope,
  Scissors,
  Heart,
  Baby,
  Bone,
  Syringe,
  Pill,
  Activity,
  Brain,
  Eye,
  Utensils,
  Smile,
  Sparkles,
  User,
  Droplet,
  Thermometer,
  Ear,
};

export default function DeptHeader({ dept }) {
  const IconComponent = ICONS[dept.icon] || ICONS.Stethoscope;
  const color = dept.color || '#1c5fa8';

  return (
    <View style={styles.wrapper}>
      {/* Icon Box */}
      <View style={[styles.iconBox, { borderColor: color }]}>
        <IconComponent size={20} color={color} />
      </View>

      {/* Ribbon */}
      <View style={[styles.ribbon, { backgroundColor: color }]}>
        <Text style={styles.ribbonText} numberOfLines={1}>
          {dept.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  ribbon: {
    flex: 1,
    marginLeft: -12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    paddingLeft: 24,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
  },
  ribbonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});