import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import type { Booking } from '../data/mockData';

/**
 * 5-stage procurement timeline:
 * Slot Booked → Arrived → In Queue → Procurement → Completed
 */
export default function StatusTimeline({ booking }: { booking: Booking }) {
  const { t, fs } = useI18n();

  const stage =
    booking.status === 'Completed'
      ? 5
      : booking.status === 'Processing'
        ? 4
        : booking.status === 'Waiting' || booking.status === 'Your Turn'
          ? booking.arrived
            ? 3
            : 2
          : 1; // Upcoming / Booked

  const stages = [
    { key: 'status.stage1' as const, done: stage >= 1, current: stage === 1 },
    { key: 'status.stage2' as const, done: stage >= 2, current: stage === 2 },
    { key: 'status.stage3' as const, done: stage >= 3, current: stage === 3 },
    { key: 'status.stage4' as const, done: stage >= 4, current: stage === 4 },
    { key: 'status.stage5' as const, done: stage >= 5, current: stage === 5 },
  ];

  return (
    <View style={styles.wrap}>
      {stages.map((item, index) => (
        <View key={item.key} style={styles.stepRow}>
          <View style={styles.axis}>
            {index > 0 ? (
              <View style={[styles.line, item.done && styles.lineDone, styles.lineTop]} />
            ) : null}
            <View
              style={[
                styles.dot,
                item.done && styles.dotDone,
                item.current && styles.dotCurrent,
              ]}
            >
              <Text style={[styles.dotText, { fontSize: fs(13) }]}>
                {item.done ? '✓' : item.current ? '●' : '○'}
              </Text>
            </View>
            {index < stages.length - 1 ? (
              <View style={[styles.line, stages[index + 1].done && styles.lineDone]} />
            ) : (
              <View style={styles.linePlaceholder} />
            )}
          </View>
          <View style={styles.labelWrap}>
            <Text
              style={[
                styles.label,
                (item.done || item.current) && styles.labelActive,
                { fontSize: fs(15) },
              ]}
            >
              {t(item.key)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
  },
  axis: {
    width: 34,
    alignItems: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  dotCurrent: {
    borderColor: Colors.saffron,
    backgroundColor: Colors.saffronLight,
  },
  dotText: {
    color: Colors.textMuted,
    fontWeight: '800',
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  lineDone: {
    backgroundColor: Colors.green,
  },
  lineTop: {
    marginBottom: 2,
  },
  linePlaceholder: {
    width: 3,
    flex: 0,
  },
  labelWrap: {
    justifyContent: 'center',
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.lg,
    flex: 1,
  },
  label: {
    color: Colors.textMuted,
    fontWeight: '700',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
