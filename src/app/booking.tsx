import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Alert } from 'react-native';

import CentreCard from '../components/CentreCard';
import DemoBadge from '../components/DemoBadge';
import InfoCard, { MetaRow } from '../components/InfoCard';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StepIndicator from '../components/StepIndicator';
import TokenDisplay from '../components/TokenDisplay';
import TokenPdfButton from '../components/TokenPdfButton';
import { Colors, Radius, Spacing } from '../constants/theme';
import {
  addDaysISO,
  formatDateLong,
  formatDateShort,
  formatTime12h,
  dayName,
  slotAvailability,
  slotRange,
  todayISO,
  type Booking,
  type Slot,
  type SlotAvailability,
} from '../data/mockData';
import { useI18n, type TranslationKey } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

const STEPS: TranslationKey[] = ['book.sCentre', 'book.sSlot', 'book.review', 'book.confirmed'];

export default function BookingScreen() {
  const { t, fs } = useI18n();
  const { centres, slots, createBooking, farmer } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const [step, setStep] = useState(0);
  const [centreId, setCentreId] = useState<string>(farmer?.preferredCentreId ?? 'c1');
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [slotError, setSlotError] = useState('');

  const centre = centres.find((c) => c.id === centreId) ?? centres[0];
  const distinctDistricts = Array.from(new Set(centres.map((c) => c.district)));

  const centreSlots = useMemo(
    () => slots.filter((slot) => slot.centreId === centreId && slot.date === selectedDate),
    [slots, centreId, selectedDate]
  );

  const selectedSlotObj = selectedSlot
    ? centreSlots.find((s) => s.id === selectedSlot)
    : undefined;
  const selectedSlotStart = selectedSlotObj?.start;
  const selectedSlotEnd = selectedSlotObj?.end;

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(todayISO(), i)),
    []
  );

  const availableCount = centreSlots.filter(
    (slot) => slotAvailability(slot) === 'Available' || slotAvailability(slot) === 'Almost Full'
  ).length;

  function confirmBooking() {
    if (!selectedSlot) {
      setSlotError(t('book.slotTaken'));
      return;
    }
    const slot = centreSlots.find((s) => s.id === selectedSlot);
    if (!slot) {
      setSlotError(t('book.slotTaken'));
      return;
    }
    void (async () => {
      const result = await createBooking({
        centreId,
        date: selectedDate,
        slotStart: slot.start,
        slotEnd: slot.end,
        produce: farmer?.crop ?? 'Paddy',
        quantityKg: farmer?.quantityKg ?? '850',
        slotId: slot.id,
      });
      if (!result.ok) {
        setSlotError(t((result.error ?? 'book.slotTaken') as TranslationKey));
        return;
      }
      setConfirmedBooking(result.booking);
      setStep(3);
    })();
  }

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.booking') }]}>
      <SectionHeading title={t('book.title')} subtitle={t('book.subtitle')} />

      <StepIndicator steps={STEPS.map((key) => t(key))} current={Math.min(step, STEPS.length - 1)} />

{step === 0 ? (
        <View>
          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('book.sDistrict')}</Text>
          <View style={styles.chipGrid}>
            {distinctDistricts.map((district) => {
              const active = centre.district === district;
              const count = centres.filter((c) => c.district === district).length;
              return (
                <Pressable
                  key={district}
                  onPress={() => {
                    const first = centres.find((c) => c.district === district);
                    if (first) setCentreId(first.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive, { fontSize: fs(14) }]}>
                    {district}
                  </Text>
                  <Text style={[styles.chipHint, { fontSize: fs(11) }]}>
                    {count} {t('nav.centres')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('book.sCentre')}</Text>
          <View style={[styles.centreGrid, !wide && styles.centreStack]}>
            {centres.filter((c) => c.district === centre.district).map((c) => (
              <View key={c.id} style={styles.centreWrap}>
                <CentreCard
                  centre={c}
                  action={
                    <PrimaryButton
                      label={c.id === centreId ? `${t('book.selected')} ✓` : t('book.selectCentre')}
                      onPress={() => {
                        setCentreId(c.id);
                        setStep(1);
                      }}
                      small
                      variant={c.id === centreId ? 'primary' : 'secondary'}
                    />
                  }
                />
              </View>
            ))}
          </View>

          <View style={styles.sectionRow}>
            <SecondaryButton label={t('common.back')} onPress={() => router.back()} />
            <PrimaryButton label={t('common.continue')} onPress={() => setStep(1)} />
          </View>
        </View>
      ) : null}

{step === 1 ? (
        <View>
          {/* Date selector */}
          <Text style={[styles.section, { fontSize: fs(14) }]}>{t('book.sDate')}</Text>
          <View style={styles.dateRow}>
            {dates.map((date) => {
              const active = date === selectedDate;
              return (
                <Pressable
                  key={date}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setSlotError('');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                >
                  <Text style={[styles.dateDay, active && styles.dateTextActive, { fontSize: fs(11) }]}>
                    {dayName(date)}
                  </Text>
                  <Text style={[styles.dateNum, active && styles.dateTextActive, { fontSize: fs(18) }]}>
                    {formatDateShort(date).split(' ')[0]}
                  </Text>
                  <Text style={[styles.dateMonth, active && styles.dateTextActive, { fontSize: fs(11) }]}>
                    {formatDateShort(date).split(' ')[1]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Slot legend */}
          <View style={styles.legend}>
            <LegendDot color={Colors.green} label={t('book.legendAvailable')} />
            <LegendDot color={Colors.saffron} label={t('book.legendAlmost')} />
            <LegendDot color={Colors.borderDark} label={t('book.legendFull')} />
          </View>

          <Text style={[styles.section, { fontSize: fs(14) }]}>
            {t('book.sSlot')} · {formatDateLong(selectedDate)} · {centre.name}
            {availableCount > 0 ? ` · ${availableCount} ${t('book.availableSlots')}` : ''}
          </Text>
          {centreSlots.length === 0 ? (
            <InfoCard>
              <Text style={[styles.emptyText, { fontSize: fs(14) }]}>{t('book.noSlots')}</Text>
            </InfoCard>
          ) : (
            <View style={styles.slotGrid}>
              {centreSlots.map((slot: Slot) => {
                const availability: SlotAvailability = slotAvailability(slot);
                const disabled = availability === 'Full' || availability === 'Closed';
                const active = selectedSlot === slot.id;
                const colors = {
                  Available: Colors.green,
                  'Almost Full': Colors.saffron,
                  Full: Colors.borderDark,
                  Closed: Colors.borderDark,
                };
                const bg = {
                  Available: Colors.greenLight,
                  'Almost Full': Colors.saffronLight,
                  Full: Colors.surfaceAlt,
                  Closed: Colors.surfaceAlt,
                }[availability];
                return (
                  <Pressable
                    key={slot.id}
                    onPress={() => {
                      if (disabled) return;
                      setSelectedSlot(slot.id);
                      setSlotError('');
                    }}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled }}
                    style={[
                      styles.slotBtn,
                      { borderColor: active ? Colors.primary : colors[availability], backgroundColor: bg },
                      disabled && styles.slotDisabled,
                      active && styles.slotActive,
                    ]}
                  >
                    <Text style={[styles.slotTime, { fontSize: fs(13) }]}>
                      {formatTime12h(slot.start)} – {formatTime12h(slot.end)}
                    </Text>
                    <Text style={[styles.slotMeta, { color: colors[availability], fontSize: fs(11) }]}>
                      {availability === 'Closed'
                        ? t('book.slotClosed')
                        : availability === 'Full'
                          ? t('book.slotFull')
                          : `${slot.capacity - slot.booked} ${t('book.availableSlots')}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {slotError ? <Text style={styles.error}>{slotError}</Text> : null}

          <View style={styles.sectionRow}>
            <SecondaryButton label={t('common.back')} onPress={() => setStep(0)} />
            <PrimaryButton
              label={t('book.review')}
              onPress={() => {
                if (!selectedSlot) {
                  setSlotError(t('book.slotTaken'));
                  return;
                }
                setStep(2);
              }}
              disabled={!selectedSlot}
            />
          </View>
        </View>
      ) : null}

{step === 2 ? (
        <View>
          <InfoCard title={t('book.review')}>
            <MetaRow label={t('book.farmer')} value={farmer?.name ?? t('nav.login')} />
            <MetaRow label={t('dash.centre')} value={centre.name} />
            <MetaRow label={t('dash.date')} value={formatDateLong(selectedDate)} />
            <MetaRow label={t('dash.time')} value={slotRange(selectedSlotStart ?? '10:00', selectedSlotEnd ?? '10:30')} />
            <MetaRow
              label={t('dash.produce')}
              value={`${farmer?.crop ?? 'Paddy'} · ${farmer?.quantityKg ?? 850} kg`}
            />
          </InfoCard>

          {slotError ? <Text style={styles.error}>{slotError}</Text> : null}

          <View style={styles.sectionRow}>
            <SecondaryButton label={t('common.back')} onPress={() => setStep(1)} />
            <PrimaryButton label={t('book.confirm')} onPress={confirmBooking} variant="success" />
          </View>
        </View>
      ) : null}

      {step === 3 && confirmedBooking ? (
        <View style={styles.confirm}>
          <TokenDisplay
            token={confirmedBooking.token}
            label={t('book.confirmed')}
            subtitle={t('book.showToken')}
          />
          <InfoCard title={t('book.confirmed')}>
            <MetaRow label={t('dash.centre')} value={confirmedBooking.centreName} />
            <MetaRow label={t('dash.date')} value={formatDateLong(confirmedBooking.date)} />
            <MetaRow
              label={t('dash.time')}
              value={slotRange(confirmedBooking.slotStart, confirmedBooking.slotEnd)}
            />
            <MetaRow
              label={t('dash.produce')}
              value={`${confirmedBooking.produce} · ${confirmedBooking.quantityKg} kg`}
            />
          </InfoCard>
          <DemoBadge />

          <View style={styles.confirmActions}>
            <TokenPdfButton
              booking={confirmedBooking}
              farmer={farmer}
              centre={centres.find((c) => c.id === confirmedBooking.centreId)}
            />
            <PrimaryButton
              label={t('book.viewQueue')}
              onPress={() => router.replace(path.queue as never)}
              variant="success"
            />
            <SecondaryButton
              label={`📅 ${t('book.addCalendar')}`}
              onPress={() =>
                Alert.alert(t('book.addCalendar'), t('book.calendarNote'), [
                  { text: t('common.close') },
                ])
              }
            />
            <SecondaryButton label={t('book.backDash')} onPress={() => router.replace(path.dashboard as never)} />
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    minWidth: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    color: Colors.text,
    fontWeight: '800',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  chipHint: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  centreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  centreStack: {
    flexDirection: 'column',
  },
  centreWrap: {
    flexGrow: 1,
    minWidth: 280,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateChip: {
    flexGrow: 1,
    flexBasis: 64,
    maxWidth: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dateChipActive: {
    borderColor: Colors.saffron,
    backgroundColor: Colors.saffronLight,
  },
  dateDay: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateNum: {
    color: Colors.text,
    fontWeight: '800',
    marginTop: 2,
  },
  dateMonth: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dateTextActive: {
    color: Colors.saffronDark,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  slotBtn: {
    width: '31%',
    minWidth: 100,
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  slotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  slotDisabled: {
    opacity: 0.6,
  },
  slotTime: {
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  slotMeta: {
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: Colors.danger,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  confirm: {
    alignItems: 'center',
  },
  confirmActions: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});