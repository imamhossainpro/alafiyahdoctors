// components/DoctorEntry.js
import { View, Text, StyleSheet } from 'react-native';

export default function DoctorEntry({ doc, accentColor }) {
  return (
    <View style={[styles.entry, { borderLeftColor: accentColor }]}>
      <Text style={styles.name}>{doc.name}</Text>
      {doc.quals ? <Text style={styles.quals}>{doc.quals}</Text> : null}
      {doc.specialty ? <Text style={styles.specialty}>{doc.specialty}</Text> : null}
      {doc.workplace ? <Text style={styles.workplace}>{doc.workplace}</Text> : null}
      {doc.timeSlots && doc.timeSlots.length > 0 && (
        <View style={styles.slots}>
          {doc.timeSlots.map((slot, idx) => (
            <View key={idx} style={styles.slotChip}>
              <Text style={styles.slotText}>
                ⏱ সাক্ষাতের সময়ঃ {slot.start} - {slot.end}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    marginBottom: 16,
    paddingLeft: 10,
    borderLeftWidth: 3,
  },
  name: {
    color: '#1c5fa8',
    fontWeight: 'bold',
    fontSize: 20,
  },
  quals: {
    color: '#333',
    fontSize: 12,
    marginTop: 2,
  },
  specialty: {
    color: '#9c2a7e',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 2,
  },
  workplace: {
    color: '#333',
    fontSize: 12,
    marginTop: 2,
  },
  slots: {
    marginTop: 6,
    gap: 4,
  },
  slotChip: {
    backgroundColor: '#fef3c7',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  slotText: {
    color: '#b45309',
    fontWeight: '600',
    fontSize: 12,
  },
});