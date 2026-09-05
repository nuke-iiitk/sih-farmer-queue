import { router } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import InfoCard from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { path } from '../navigation';

const STEPS = [
  { n: 1, titleKey: 'landing.step1' as const, bodyKey: 'how.detail1' as const, icon: 'person-add' as const },
  { n: 2, titleKey: 'landing.step2' as const, bodyKey: 'how.detail2' as const, icon: 'calendar' as const },
  { n: 3, titleKey: 'landing.step3' as const, bodyKey: 'how.detail3' as const, icon: 'ticket' as const },
  { n: 4, titleKey: 'landing.step4' as const, bodyKey: 'how.detail4' as const, icon: 'checkmark-done' as const },
];

export default function HowItWorksScreen() {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.howItWorks') }]}>
      <SectionHeading title={t('how.title')} subtitle={t('how.subtitle')} />

      <View style={[styles.steps, wide && styles.stepsRow]}>
        {STEPS.map((step) => (
          <View key={step.n} style={styles.step}>
            <View style={styles.numberRow}>
              <View style={styles.number}>
                <Text style={styles.numberText}>{step.n}</Text>
              </View>
              {step.n < STEPS.length ? <View style={styles.connector} /> : <View style={styles.connectorFade} />}
            </View>
            <InfoCard title={t(step.titleKey)}>
              <Text style={[styles.body, { fontSize: fs(14) }]}>{t(step.bodyKey)}</Text>
            </InfoCard>
          </View>
        ))}
      </View>

      <PrimaryButton
        label={t('how.cta')}
        onPress={() => router.push(path.booking)}
        variant="success"
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  steps: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepsRow: {
    flexDirection: 'row',
  },
  step: {
    flex: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  number: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  numberText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  connector: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.saffron,
    marginHorizontal: Spacing.xs,
  },
  connectorFade: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  body: {
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});