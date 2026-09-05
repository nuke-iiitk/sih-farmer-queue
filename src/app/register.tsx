import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AlertBanner from '../components/AlertBanner';
import ChoiceChips from '../components/ChoiceChips';
import DropdownSelect from '../components/DropdownSelect';
import FormField from '../components/FormField';
import InfoCard, { MetaRow } from '../components/InfoCard';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StepIndicator from '../components/StepIndicator';
import { Colors, Spacing } from '../constants/theme';
import { crops, districtsByState, states, type Farmer } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

type RegistrationForm = {
  name: string;
  mobile: string;
  aadhaar: string;
  dateOfBirth: string;
  state: string;
  district: string;
  village: string;
  address: string;
  landSizeAcres: string;
  crop: string;
  quantityKg: string;
  preferredCentreId: string;
};

const INITIAL: RegistrationForm = {
  name: '',
  mobile: '',
  aadhaar: '',
  dateOfBirth: '',
  state: 'Kerala',
  district: '',
  village: '',
  address: '',
  landSizeAcres: '',
  crop: 'Paddy',
  quantityKg: '',
  preferredCentreId: 'c1',
};

const STEP_KEYS = ['reg.step1', 'reg.step2', 'reg.step3', 'reg.step4'] as const;

export default function RegisterScreen() {
  const { t, fs } = useI18n();
  const { registerFarmer, centres } = useStore();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegistrationForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [touched, setTouched] = useState(false);

  function set<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: undefined }));
  }

  function validatePersonal() {
    const e: typeof errors = {};
    if (form.name.trim().length < 3) e.name = t('reg.errName');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = t('reg.errMobile');
    if (!/^\d{12}$/.test(form.aadhaar)) e.aadhaar = t('reg.errAadhaar');
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.dateOfBirth)) e.dateOfBirth = t('reg.errDob');
    return e;
  }

  function validateAddress() {
    const e: typeof errors = {};
    if (!form.state) e.state = t('reg.errState');
    if (!form.district) e.district = t('reg.errDistrict');
    if (form.village.trim().length < 2) e.village = t('reg.errVillage');
    return e;
  }

  function validateFarm() {
    const e: typeof errors = {};
    if (!form.crop) e.crop = t('reg.errCrop');
    if (!form.quantityKg || Number(form.quantityKg) <= 0) e.quantityKg = t('reg.errQuantity');
    if (!form.landSizeAcres || Number(form.landSizeAcres) <= 0) e.landSizeAcres = t('reg.errLand');
    return e;
  }

  function next() {
    let e = {};
    if (step === 0) e = validatePersonal();
    if (step === 1) e = validateAddress();
    if (step === 2) e = validateFarm();
    setErrors(e);
    setTouched(true);
    if (Object.keys(e).length > 0) return;
    setTouched(false);
    setStep((s) => s + 1);
  }

  function submit() {
    const farmer: Farmer = {
      id: `FPP-F-2026-${form.mobile.slice(-4)}`,
      name: form.name.trim(),
      mobile: form.mobile,
      aadhaar: form.aadhaar,
      dateOfBirth: form.dateOfBirth,
      state: form.state,
      district: form.district,
      village: form.village.trim(),
      address: form.address.trim(),
      landSizeAcres: form.landSizeAcres,
      crop: form.crop,
      quantityKg: form.quantityKg,
      preferredCentreId: form.preferredCentreId,
    };
    registerFarmer(farmer);
    router.replace(path.dashboard as never);
  }

  const centreOptions = centres.map((c) => ({ value: c.id, label: `${c.name} · ${c.district}` }));

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.register') }]}>
      <SectionHeading title={t('reg.title')} subtitle={t('reg.subtitle')} />

      <StepIndicator steps={STEP_KEYS.map((key) => t(key))} current={step} />

{step === 0 ? (
        <View>
          <FormField
            label={t('reg.name')}
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder={t('reg.namePlaceholder')}
            error={errors.name}
            required
          />
          <FormField
            label={t('reg.mobile')}
            value={form.mobile}
            onChangeText={(v) => set('mobile', v.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.mobile}
            required
          />
          <FormField
            label={t('reg.aadhaar')}
            value={form.aadhaar}
            onChangeText={(v) => set('aadhaar', v.replace(/\D/g, '').slice(0, 12))}
            placeholder={t('reg.aadhaarPlaceholder')}
            keyboardType="numeric"
            maxLength={12}
            error={errors.aadhaar}
            hint={t('reg.aadhaarNote')}
            required
          />
          <FormField
            label={t('reg.dob')}
            value={form.dateOfBirth}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, '').slice(0, 8);
              let out = digits;
              if (digits.length >= 5) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
              else if (digits.length >= 3) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
              set('dateOfBirth', out);
            }}
            placeholder={t('reg.dobPlaceholder')}
            keyboardType="numeric"
            maxLength={10}
            error={errors.dateOfBirth}
            required
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View>
          <DropdownSelect
            label={t('reg.state')}
            value={form.state}
            options={states.map((s) => ({ value: s, label: s }))}
            onSelect={(v) => {
              set('state', v);
              set('district', '');
            }}
            error={errors.state}
          />
          <DropdownSelect
            label={t('reg.district')}
            value={form.district}
            options={(districtsByState[form.state] ?? []).map((d) => ({ value: d, label: d }))}
            onSelect={(v) => set('district', v)}
            placeholder="—"
            error={errors.district}
          />
          <FormField
            label={t('reg.village')}
            value={form.village}
            onChangeText={(v) => set('village', v)}
            placeholder={t('reg.villagePlaceholder')}
            error={errors.village}
            required
          />
          <FormField
            label={t('reg.address')}
            value={form.address}
            onChangeText={(v) => set('address', v)}
            placeholder={t('reg.addressPlaceholder')}
            multiline
          />
        </View>
      ) : null}

{step === 2 ? (
        <View>
          <FormField
            label={t('reg.land')}
            value={form.landSizeAcres}
            onChangeText={(v) => set('landSizeAcres', v.replace(/[^\d.]/g, ''))}
            placeholder={t('reg.landPlaceholder')}
            keyboardType="numeric"
            error={errors.landSizeAcres}
            required
          />
          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('reg.crop')}</Text>
          <ChoiceChips
            value={form.crop}
            onChange={(id) => set('crop', id)}
            items={crops.map((crop) => ({ id: crop, label: crop }))}
          />
          {errors.crop ? <Text style={styles.error}>{errors.crop}</Text> : null}
          <FormField
            label={t('reg.quantity')}
            value={form.quantityKg}
            onChangeText={(v) => set('quantityKg', v.replace(/[^\d.]/g, ''))}
            placeholder={t('reg.quantityPlaceholder')}
            keyboardType="numeric"
            error={errors.quantityKg}
            required
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('reg.centre')}</Text>
          <DropdownSelect
            label=""
            value={form.preferredCentreId}
            options={centreOptions}
            onSelect={(v) => set('preferredCentreId', v)}
          />

          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('reg.summary')}</Text>
          <InfoCard>
            <MetaRow label={t('reg.name')} value={form.name} />
            <MetaRow label={t('reg.mobile')} value={form.mobile} />
            <MetaRow label={t('reg.district')} value={`${form.district}, ${form.state}`} />
            <MetaRow label={t('reg.village')} value={form.village} />
            <MetaRow label={t('reg.crop')} value={`${form.crop} · ${form.quantityKg} kg`} />
            <MetaRow label={t('reg.land')} value={`${form.landSizeAcres} acres`} />
          </InfoCard>
        </View>
      ) : null}

      {touched && Object.keys(errors).length > 0 ? (
        <AlertBanner tone="error" message={t('common.required')} />
      ) : null}

      <View style={styles.buttonRow}>
        {step > 0 ? (
          <SecondaryButton label={t('common.back')} onPress={() => setStep((s) => s - 1)} />
        ) : null}
        <View style={styles.grow}>
          <PrimaryButton
            label={step < 3 ? t('common.continue') : t('reg.submit')}
            onPress={step < 3 ? next : submit}
          />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  section: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  error: {
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  grow: {
    flex: 1,
  },
});