import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AlertBanner from '../components/AlertBanner';
import FormField from '../components/FormField';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import { Colors, Radius, Spacing } from '../constants/theme';
import { DEMO_MOBILE } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCaptcha(): string {
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return out;
}

export default function LoginScreen() {
  const { t, fs } = useI18n();
  const { loginFarmer, loginDemoFarmer } = useStore();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [mobile, setMobile] = useState(DEMO_MOBILE);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [errors, setErrors] = useState<{ mobile?: string; secret?: string; captcha?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const captchaStyle = useMemo(
    () => ({
      backgroundColor: '#fff7e6',
      letterSpacing: 6,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: Radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
    }),
    []
  );

  function submit() {
    const nextErrors: typeof errors = {};
    if (!/^[6-9]\d{9}$/.test(mobile)) nextErrors.mobile = t('login.errMobile');
    if (mode === 'password' && password.length < 4) nextErrors.secret = t('login.errPassword');
    if (mode === 'otp' && otp.length !== 6) nextErrors.secret = t('login.errOtp');
    if (captchaInput.trim().toUpperCase() !== captcha) {
      nextErrors.captcha = t('login.errCaptcha');
    }
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length > 0) return;

    void (async () => {
      const result = await loginFarmer(
        mobile,
        mode === 'password' ? password : undefined,
        mode === 'otp' ? otp : undefined
      );
      if (!result.ok) {
        const key = result.error ?? 'login.errOtp';
        setErrors({ secret: t(key as never) });
        return;
      }
      router.replace(path.dashboard as never);
    })();
  }

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.login') }]}>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardHeaderText, { fontSize: fs(14) }]}>{t('common.appName')}</Text>
            <Text style={[styles.cardHeaderSub, { fontSize: fs(11) }]}>{t('common.gov')}</Text>
          </View>
          <View style={styles.cardBody}>
            <SectionHeading title={t('login.title')} subtitle={t('login.subtitle')} />

          {/* Mode switch */}
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setMode('password')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'password' }}
              style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive, { fontSize: fs(13) }]}>
                {t('login.modePassword')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('otp')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'otp' }}
              style={[styles.modeBtn, mode === 'otp' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive, { fontSize: fs(13) }]}>
                {t('login.modeOtp')}
              </Text>
            </Pressable>
          </View>

          <FormField
            label={t('login.mobile')}
            value={mobile}
            onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('login.mobilePlaceholder')}
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobile}
            required
          />

          {mode === 'password' ? (
            <FormField
              label={t('login.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.passwordPlaceholder')}
              secure
              error={errors.secret}
              required
            />
          ) : (
            <>
              <FormField
                label={t('login.otp')}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                placeholder="••••••"
                error={errors.secret}
                required
              />
              {otpSent ? <AlertBanner tone="info" message={t('login.otpSent')} /> : null}
              <SecondaryButton
                label={otpSent ? t('login.otpResend') : t('login.otpSend')}
                onPress={() => setOtpSent(true)}
                small
              />
              <View style={styles.spacerSm} />
            </>
          )}

{/* Mock captcha */}
          <View style={styles.captchaBlock}>
            <Text style={[styles.captchaLabel, { fontSize: fs(13) }]}>{t('login.captcha')}</Text>
            <View style={styles.captchaRow}>
              <Text style={[styles.captchaCode, { fontSize: fs(18) }, captchaStyle]}>{captcha}</Text>
              <Pressable
                onPress={() => setCaptcha(generateCaptcha())}
                accessibilityRole="button"
                accessibilityLabel={t('login.captchaRefresh')}
                style={styles.captchaRefresh}
              >
                <Ionicons name="refresh" size={18} color={Colors.primary} />
              </Pressable>
            </View>
            <FormField
              label=""
              value={captchaInput}
              onChangeText={(value) =>
                setCaptchaInput(value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5))
              }
              placeholder="•••••"
              error={errors.captcha}
            />
            <Text style={[styles.captchaNote, { fontSize: fs(11) }]}>{t('login.captchaNote')}</Text>
          </View>

          {submitted && Object.keys(errors).length > 0 ? (
            <AlertBanner tone="error" message={t('common.required')} />
          ) : null}

          <View style={styles.spacerSm} />
          <PrimaryButton label={t('login.btn')} onPress={submit} />

          <Pressable onPress={() => undefined}>
            <Text style={[styles.link, { fontSize: fs(13) }]}>❓ {t('login.forgot')}</Text>
          </Pressable>
          <Text style={[styles.forgotNote, { fontSize: fs(11) }]}>{t('login.forgotNote')}</Text>

          <View style={styles.divider} />
          <SecondaryButton
            label={t('login.demoBtn')}
            onPress={() => {
              loginDemoFarmer();
              router.replace(path.dashboard as never);
            }}
          />
          <Text style={[styles.demoHint, { fontSize: fs(11) }]}>{t('login.demoHint')}</Text>

          <Pressable onPress={() => router.push(path.register)} accessibilityRole="link">
            <Text style={[styles.registerLink, { fontSize: fs(14) }]}>{t('login.newFarmer')} →</Text>
          </Pressable>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    padding: 0,
  },
  cardHeader: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  cardHeaderText: {
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardHeaderSub: {
    color: Colors.saffronLight,
    marginTop: 2,
    textAlign: 'center',
  },
  cardBody: {
    padding: Spacing.xl,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  modeBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modeText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  modeTextActive: {
    color: Colors.primary,
  },
  captchaBlock: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  captchaLabel: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  captchaCode: {
    fontWeight: '800',
    color: Colors.saffronDark,
  },
  captchaRefresh: {
    padding: 6,
  },
  captchaNote: {
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: 2,
  },
  link: {
    color: Colors.info,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  forgotNote: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  demoHint: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  registerLink: {
    color: Colors.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  spacerSm: {
    height: Spacing.sm,
  },
});