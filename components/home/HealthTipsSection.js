// components/home/HealthTipsSection.js
// ==================================================
// 💡 HealthTipsSection — Health tips list (placeholder)
// ==================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SectionHeader from '../ui/SectionHeader';
import HealthTipCard from '../ui/HealthTipCard';
import { getHealthTips } from '../../services/healthTipsService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';

export default function HealthTipsSection({ hospitalId, style }) {
  const [tips, setTips] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getHealthTips(hospitalId, 3);
      if (mounted) setTips(data);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  if (tips.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <SectionHeader
        title="স্বাস্থ্য পরামর্শ"
        icon="bulb-outline"
        style={styles.header}
      />

      {tips.map((tip) => (
        <HealthTipCard key={tip.id} tip={tip} />
      ))}

      {__DEV__ && (
        <Text style={styles.placeholderNote}>
          ⚠️ Placeholder content — Firebase collection pending
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  header: { marginBottom: spacing.md },
  placeholderNote: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});