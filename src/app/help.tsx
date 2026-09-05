import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import AlertBanner from '../components/AlertBanner';
import InfoCard from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import FormField from '../components/FormField';
import { Colors, Radius, Spacing } from '../constants/theme';
import { HELPLINE } from '../data/mockData';
import { useI18n } from '../i18n';

const FAQS = [
  { q: 'help.faq1Q' as const, a: 'help.faq1A' as const },
  { q: 'help.faq2Q' as const, a: 'help.faq2A' as const },
  { q: 'help.faq3Q' as const, a: 'help.faq3A' as const },
];

export default function HelpScreen() {
  const { t, fs } = useI18n();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.help') }]}>
      <SectionHeading title={t('help.title')} subtitle={t('help.subtitle')} />

      <InfoCard title={t('help.helpline')} accent={Colors.saffron}>
        <Text style={[styles.headline, { fontSize: fs(24) }]}>{HELPLINE}</Text>
        <Text style={[styles.bodyText, { fontSize: fs(13) }]}>{t('help.hours')}</Text>
        <Pressable
          onPress={() => Linking.openURL(`tel:${HELPLINE.replace(/[^0-9]/g, '')}`)}
          style={styles.callBtn}
          accessibilityRole="button"
        >
          <Text style={styles.callBtnText}>{t('help.call')}</Text>
        </Pressable>
      </InfoCard>

      <InfoCard title={t('help.docs')}>
        {['help.doc1', 'help.doc2', 'help.doc3', 'help.doc4'].map((key) => (
          <View key={key} style={styles.docRow}>
            <View style={styles.docDot} />
            <Text style={[styles.bodyText, { fontSize: fs(14) }]}>{t(key as never)}</Text>
          </View>
        ))}
      </InfoCard>

      <SectionHeading title={t('help.faq')} />
      {FAQS.map((faq) => (
        <InfoCard key={faq.q}>
          <Text style={[styles.faqQ, { fontSize: fs(15) }]}>{t(faq.q)}</Text>
          <Text style={[styles.bodyText, { fontSize: fs(14) }]}>{t(faq.a)}</Text>
        </InfoCard>
      ))}

      <SectionHeading title={t('help.feedback')} />
      <InfoCard>
        <FormField
          label={t('help.feedbackMsg')}
          value={message}
          onChangeText={setMessage}
          placeholder="…"
          multiline
        />
        <PrimaryButton
          label={t('help.feedback')}
          onPress={() => {
            setSent(true);
            setMessage('');
          }}
          disabled={!message.trim()}
        />
        {sent ? (
          <View style={styles.spacerTop}>
            <AlertBanner tone="success" message={t('help.feedbackSent')} />
          </View>
        ) : null}
      </InfoCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headline: {
    color: Colors.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  bodyText: {
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  callBtn: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  docDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.saffron,
  },
  faqQ: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  spacerTop: {
    marginTop: Spacing.md,
  },
});
