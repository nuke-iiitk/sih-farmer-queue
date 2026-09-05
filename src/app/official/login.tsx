import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import FormField from '../../components/FormField';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import SectionHeading from '../../components/SectionHeading';
import { Colors, Radius, Spacing } from '../../constants/theme';
import { useI18n } from '../../i18n';
import { useStore } from '../../store/AppStore';

export default function OfficialLoginScreen() {
  const { t, fs } = useI18n();
  const { loginOfficer, loginDemoOfficer } = useStore();

  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});

  function submit() {
    const nextErrors: typeof errors = {};
    if (officerId.trim().length < 4) nextErrors.id = t('off.login.errId');
    if (password.length < 4) nextErrors.password = t('off.login.errPassword');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    loginOfficer(officerId, password);
    router.replace('/official' as never);
  }

  return (
    <View style={styles.root}>
      {/* Govt-style banner */}
      <View style={styles.banner}>
        <View style={styles.flagRow} accessibilityElementsHidden>
          <View style={[styles.flagBand, { backgroundColor: Colors.flag[0] }]} />
          <View style={[styles.flagBand, { backgroundColor: Colors.flag[1] }]} />
          <View style={[styles.flagBand, { backgroundColor: Colors.flag[2] }]} />
        </View>
        <View style={styles.bannerInner}>
          <View style={styles.emblem}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.white} />
          </View>
          <View>
            <Text style={[styles.bannerTitle, { fontSize: fs(18) }]}>{t('off.portal')}</Text>
            <Text style={[styles.bannerSub, { fontSize: fs(12) }]}>
              {t('common.appName')} · {t('common.gov')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.card}>
          <SectionHeading title={t('off.login.title')} subtitle={t('off.login.subtitle')} />

          <FormField
            label={t('off.login.id')}
            value={officerId}
            onChangeText={setOfficerId}
            placeholder={t('off.login.idPlaceholder')}
            error={errors.id}
            required
          />
          <FormField
            label={t('off.login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
            error={errors.password}
            required
          />

          <PrimaryButton label={t('login.btn')} onPress={submit} />
          <View style={styles.divider} />
          <SecondaryButton
            label={t('off.login.demo')}
            onPress={() => {
              loginDemoOfficer();
              router.replace('/official' as never);
            }}
          />
          <Text style={[styles.hint, { fontSize: fs(11) }]}>{t('off.login.demoHint')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { fontSize: fs(11) }]}>{t('common.demoNote')}</Text>
        <Text style={[styles.footerText, { fontSize: fs(11) }]}>{t('common.appName')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    backgroundColor: Colors.primaryDark,
    borderBottomWidth: 4,
    borderBottomColor: Colors.saffron,
  },
  flagRow: {
    flexDirection: 'row',
    height: 4,
  },
  flagBand: {
    flex: 1,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  emblem: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: Colors.white,
    fontWeight: '800',
  },
  bannerSub: {
    color: Colors.textOnDark,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  hint: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  footer: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
});