import { router } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AlertBanner from '../../components/AlertBanner';
import DemoBadge from '../../components/DemoBadge';
import InfoCard, { MetaRow } from '../../components/InfoCard';
import OfficialShell from '../../components/OfficialShell';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import SectionHeading from '../../components/SectionHeading';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing } from '../../constants/theme';
import { useI18n } from '../../i18n';
import { useStore } from '../../store/AppStore';

export default function OfficialDashboard() {
  const { t, fs } = useI18n();
  const { officerCentreId, centres, queues, queueSnapshot, bookings } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const centre = centres.find((c) => c.id === officerCentreId);
  const queue = queues[officerCentreId];
  const snapshot = queueSnapshot(officerCentreId);

  const todayBookings = bookings.filter((b) => b.centreId === officerCentreId).length + 118;
  const remaining = Math.max(0, (centre?.capacityPerDay ?? 150) - todayBookings);

  return (
    <OfficialShell>
      <SectionHeading
        title={t('off.dash.title')}
        subtitle={t('off.dash.subtitle', { centre: centre?.name ?? '—' })}
        right={<DemoBadge />}
      />

{/* Summary cards */}
      <View style={[styles.cards, !wide && styles.cardsStack]}>
        <StatCard label={t('off.dash.todayBookings')} value={todayBookings} tone="navy" />
        <StatCard label={t('off.dash.waiting')} value={snapshot.waitingCount} tone="saffron" />
        <StatCard label={t('off.dash.processing')} value={snapshot.processingCount} tone="red" />
        <StatCard label={t('off.dash.completed')} value={snapshot.completedCount} tone="green" />
        <StatCard label={t('off.dash.remaining')} value={remaining} tone="grey" />
      </View>

      {/* Now serving / next */}
      <View style={[styles.liveGrid, !wide && styles.liveGridStack]}>
        <InfoCard title={t('off.dash.nowServing')}>
          {snapshot.processing ? (
            <View style={styles.servingRow}>
              <Text style={[styles.servingToken, { fontSize: fs(30) }]}>{snapshot.processing.token}</Text>
              <StatusBadge status="Processing" small />
              <Text style={[styles.servingMeta, { fontSize: fs(13) }]}>
                {snapshot.processing.farmerName} · {snapshot.processing.produce}
              </Text>
            </View>
          ) : (
            <Text style={[styles.grey, { fontSize: fs(14) }]}>{t('off.dash.noServing')}</Text>
          )}
        </InfoCard>

        <InfoCard title={t('off.dash.nextUp')}>
          {queue?.entries
            .filter((e) => e.status === 'Waiting' || e.status === 'Called')
            .slice(0, 3)
            .map((e) => (
              <View key={e.token} style={styles.nextRow}>
                <Text style={[styles.nextToken, { fontSize: fs(14) }]}>{e.token}</Text>
                <Text style={[styles.nextMeta, { fontSize: fs(12) }]}>
                  {e.farmerName} · {e.produce}
                </Text>
              </View>
            ))}
          {!queue || !queue.entries.some((e) => e.status === 'Waiting' || e.status === 'Called') ? (
            <Text style={[styles.grey, { fontSize: fs(14) }]}>{t('off.queue.none')}</Text>
          ) : null}
        </InfoCard>

        <InfoCard title={t('off.dash.recent')}>
          {queue?.entries
            .filter((e) => e.status === 'Completed')
            .slice(-3)
            .map((e) => (
              <View key={e.token} style={styles.nextRow}>
                <Text style={[styles.nextToken, { fontSize: fs(14) }]}>{e.token}</Text>
                <Text style={[styles.nextMeta, { fontSize: fs(12) }]}>{e.farmerName}</Text>
              </View>
            )) ?? null}
        </InfoCard>
      </View>

{/* Quick actions */}
      <SectionHeading title={t('off.dash.quick')} />
      <View style={styles.actions}>
        <PrimaryButton label={t('off.dash.openQueue')} onPress={() => router.push('/official/queue' as never)} />
        <SecondaryButton label={t('off.dash.manageSlots')} onPress={() => router.push('/official/slots' as never)} />
        <SecondaryButton label={t('off.dash.viewAnalytics')} onPress={() => router.push('/official/analytics' as never)} />
      </View>

      {/* Centre overview */}
      <SectionHeading title={t('off.dash.center')} />
      <InfoCard title={centre?.name ?? '—'}>
        <MetaRow label={t('reg.state')} value={`${centre?.state} · ${centre?.district}`} />
        <MetaRow label={t('book.capacity')} value={`${centre?.capacityPerDay} / day`} />
        <MetaRow label={t('book.hours')} value={centre?.openingHours ?? '—'} />
        <MetaRow label={t('book.currentQueue')} value={`${snapshot.waitingCount} ${t('off.dash.waiting')}`} />
      </InfoCard>

      <AlertBanner tone="neutral" message={t('common.demoNote')} />
    </OfficialShell>
  );
}

const styles = StyleSheet.create({
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardsStack: {
    flexDirection: 'column',
  },
  liveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  liveGridStack: {
    flexDirection: 'column',
  },
  servingRow: {
    flexDirection: 'column',
    gap: 6,
  },
  servingToken: {
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  servingMeta: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nextToken: {
    color: Colors.primary,
    fontWeight: '800',
  },
  nextMeta: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  grey: {
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});