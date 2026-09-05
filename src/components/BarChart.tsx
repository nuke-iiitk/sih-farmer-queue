import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import type { HourlyStat } from '../data/mockData';

type Props = {
  title: string;
  data: HourlyStat[];
  color?: string;
  suffix?: string;
};

/** Lightweight dependency-free bar chart (pure Views). */
export default function BarChart({ title, data, color = Colors.primary, suffix }: Props) {
  const { fs } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { fontSize: fs(14) }]}>{title}</Text>
      <View style={styles.chartRow}>
        {data.map((item) => (
          <View key={item.label} style={[styles.barColumn, compact && styles.barColumnCompact]}>
            <Text style={[styles.value, { fontSize: fs(10) }]}>
              {item.value}
              {suffix ?? ''}
            </Text>
            <View style={[styles.bar, { height: 10 + (item.value / max) * 90, backgroundColor: color }]} />
            <Text style={[styles.label, { fontSize: fs(10) }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barColumnCompact: {
    gap: 2,
  },
  bar: {
    width: '70%',
    maxWidth: 42,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  value: {
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    marginTop: 6,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
