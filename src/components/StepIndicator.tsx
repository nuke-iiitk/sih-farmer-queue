import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

/** Horizontal progress stepper used by multi-step flows (booking, registration). */
export default function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  const { fs } = useI18n();
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={styles.stepRow}>
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
              ]}
            >
              <Text style={[styles.dotText, (done || active) && styles.dotTextActive, { fontSize: fs(12) }]}>
                {done ? '✓' : index + 1}
              </Text>
            </View>
            <Text style={[styles.label, (done || active) && styles.labelActive, { fontSize: fs(11) }]} numberOfLines={2}>
              {step}
            </Text>
            {index < steps.length - 1 ? <View style={styles.connector} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  stepRow: {
    flex: 1,
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
  },
  dotDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  dotActive: {
    borderColor: Colors.saffron,
    backgroundColor: Colors.saffronLight,
  },
  dotText: {
    color: Colors.textMuted,
    fontWeight: '800',
  },
  dotTextActive: {
    color: Colors.primaryDark,
  },
  label: {
    marginTop: 6,
    textAlign: 'center',
    color: Colors.textMuted,
    fontWeight: '600',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  connector: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
});
