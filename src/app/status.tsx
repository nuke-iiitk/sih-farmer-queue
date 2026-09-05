import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AlertBanner from '../components/AlertBanner';
import DemoBadge from '../components/DemoBadge';
import EmptyState from '../components/EmptyState';
import InfoCard, { MetaRow } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StatusTimeline from '../components/StatusTimeline';
import TokenDisplay from '../components/TokenDisplay';
import TokenPdfButton from '../components/TokenPdfButton';
import { Colors, Spacing } from '../constants/theme';
import { formatDateLong, slotRange } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

export default function StatusScreen() {
  const { t, fs } = useI18n();
  const { farmer, activeBookingFor, markArrived, centres } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const booking = farmer ? activeBookingFor(farmer.id) : undefined;

  if (!booking) {
    return (
      <ScreenShell breadcrumbs={[{ label: t('status.title') }]}>
        <SectionHeading title={t('status.title')} />
        <EmptyState
          icon="flag"
          title={t('bookings.empty')}
          action={
            <PrimaryButton label={t('dash.bookNow')} onPress={() => router.push(path.booking as never)} />
          }
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.status') }]}>
      <SectionHeading
        title={t('status.title')}
        subtitle={`${booking.centreName} · ${booking.token}`}
        right={<DemoBadge />}
      />

      <View style={[styles.grid, wide && styles.gridRow]}>
        <View style={styles.col}>
          <TokenDisplay
            token={booking.token}
            label={t('dash.token')}
            subtitle={`${formatDateLong(booking.date)} · ${slotRange(booking.slotStart, booking.slotEnd)}`}
          />
          <TokenPdfButton booking={booking} farmer={farmer} centre={centres.find((c) => c.id === booking.centreId)} />
        </View>
        <View style={styles.col}>
          <InfoCard title={t('dash.timelineTitle')}>
            <StatusTimeline booking={booking} />
          </InfoCard>

          {booking.status === 'Upcoming' || (booking.status === 'Waiting' && !booking.arrived) ? (
            <>
              <AlertBanner tone="info" message={t('status.stage2Hint')} />
              <PrimaryButton
                label={`✓ ${t('dash.checkIn')}`}
                onPress={() => markArrived(booking.id)}
                variant="success"
              />
            </>
          ) : null}

          {booking.status === 'Completed' ? (
            <AlertBanner tone="success" title={t('status.stage5')} message={t('queue.done')} icon="checkmark-done" />
          ) : null}
        </View>
      </View>

      <InfoCard title={t('status.payment')}>
        <MetaRow
          label={t('status.payment')}
          value={
            booking.status === 'Completed'
              ? t('status.Completed')
              : t('status.paymentPending')
          }
        />
        <Text style={[styles.slipNote, { fontSize: fs(12) }]}>
          <Ionicons name="receipt" size={12} color={Colors.textMuted} /> {t('status.slipNote')}
        </Text>
      </InfoCard>

      <PrimaryButton label={t('book.backDash')} onPress={() => router.push(path.dashboard as never)} small />
      <View style={styles.spacer} />
      <PrimaryButton label={t('dash.viewQueue')} onPress={() => router.push(path.queue as never)} small />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  slipNote: {
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  spacer: {
    height: Spacing.sm,
  },
});