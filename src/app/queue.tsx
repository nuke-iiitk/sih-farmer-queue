import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AlertBanner from '../components/AlertBanner';
import DemoBadge from '../components/DemoBadge';
import EmptyState from '../components/EmptyState';
import InfoCard from '../components/InfoCard';
import ProgressTrack from '../components/ProgressTrack';
import { PrimaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StatusBadge from '../components/StatusBadge';
import TokenDisplay from '../components/TokenDisplay';
import TokenPdfButton from '../components/TokenPdfButton';
import { Colors, Radius, Spacing } from '../constants/theme';
import { formatDateLong, slotRange } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

export default function QueueScreen() {
  const { t, fs } = useI18n();
  const { farmer, activeBookingFor, queues, queueSnapshot, centres } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  const booking = farmer ? activeBookingFor(farmer.id) : undefined;
  const snapshot = booking ? queueSnapshot(booking.centreId, booking.token) : undefined;
  const queue = booking ? queues[booking.centreId] : undefined;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!booking || !snapshot || !queue) {
    return (
      <ScreenShell breadcrumbs={[{ label: t('nav.queue') }]}>
        <SectionHeading title={t('queue.title')} />
        <EmptyState
          icon="ticket"
          title={t('queue.noActive')}
          message={t('queue.noActiveBody')}
          action={
            <PrimaryButton label={t('dash.bookNow')} onPress={() => router.push(path.booking as never)} />
          }
        />
      </ScreenShell>
    );
  }

  const done = booking.status === 'Completed';
  const yourTurn = snapshot.farmersAhead === 0 && snapshot.processing?.token === booking.token;
  const totalProgress = snapshot.completedCount + snapshot.farmersAhead + (snapshot.processing ? 1 : 0);
  const progress = totalProgress > 0 ? snapshot.completedCount / totalProgress : 0;

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.queue') }]}>
      <SectionHeading
        title={t('queue.title')}
        subtitle={`${booking.centreName} · ${formatDateLong(booking.date)} · ${slotRange(booking.slotStart, booking.slotEnd)}`}
        right={<DemoBadge />}
      />

      <TokenDisplay
        token={booking.token}
        label={t('queue.yourToken')}
        subtitle={done ? t('queue.done') : yourTurn ? t('queue.yourTurn') : t('queue.notice')}
      />

      <TokenPdfButton booking={booking} farmer={farmer} centre={centres.find((c) => c.id === booking.centreId)} />

      {/* Serving & wait */}
      <View style={[styles.statsRow, !wide && styles.statsColumn]}>
        <InfoCard title={t('queue.currentServing')}>
          <Text style={[styles.currentToken, { fontSize: fs(34) }]}>
            {snapshot.currentlyServing ?? '—'}
          </Text>
          {snapshot.processing ? (
            <Text style={[styles.servingName, { fontSize: fs(13) }]}>
              {snapshot.processing.farmerName} · {snapshot.processing.produce}
            </Text>
          ) : null}
        </InfoCard>

        <InfoCard title={t('queue.ahead')}>
          <Text style={[styles.currentToken, { fontSize: fs(34) }]}>
            {done ? 0 : snapshot.farmersAhead}
          </Text>
          <Text style={[styles.servingName, { fontSize: fs(13) }]}>
            {done ? t('queue.done') : t('queue.aheadValue', { n: snapshot.farmersAhead })}
          </Text>
        </InfoCard>

        <InfoCard title={t('queue.estWait')}>
          <Text style={[styles.currentToken, { fontSize: fs(34) }]}>
            {done ? '—' : `~${snapshot.estimatedWaitMinutes}`}
          </Text>
          <Text style={[styles.servingName, { fontSize: fs(13) }]}>{t('common.minutes')}</Text>
        </InfoCard>
      </View>

      {done ? (
        <AlertBanner tone="success" title={t('status.stage5')} message={t('queue.done')} />
      ) : yourTurn ? (
        <AlertBanner
          tone="success"
          title={t('status.Your Turn')}
          message={t('queue.yourTurn')}
          icon="megaphone"
        />
      ) : (
        <AlertBanner tone="neutral" message={t('queue.notice')} />
      )}

      {/* Progress */}
      <View style={styles.progressCard}>
        <Text style={[styles.progressLabel, { fontSize: fs(13) }]}>{t('dash.queueProgress')}</Text>
        <ProgressTrack progress={progress} />
        <Text style={[styles.updatedText, { fontSize: fs(11) }]}>
          <Ionicons name="pulse" size={11} color={Colors.green} /> {t('queue.updated', { n: tick })}
        </Text>
      </View>

{/* Upcoming tokens */}
      <View style={styles.statsRow2}>
        <InfoCard title={t('queue.recent')} padded={false}>
          <View style={styles.tokenList}>
            {queue.entries
              .filter((e) => e.status === 'Completed')
              .slice(-6)
              .map((e) => (
                <View key={e.token} style={styles.tokenRow}>
                  <Text style={[styles.tokenRowText, { fontSize: fs(13) }]}>{e.token}</Text>
                  <StatusBadge status={e.status} small />
                </View>
              ))}
          </View>
        </InfoCard>

        <InfoCard title={t('queue.upcoming')} padded={false}>
          <View style={styles.tokenList}>
            {queue.entries
              .filter((e) => e.status !== 'Completed')
              .slice(0, 8)
              .map((e) => {
                const isYou = e.token === booking.token;
                return (
                  <View key={e.token} style={[styles.tokenRow, isYou && styles.youRow]}>
                    <Text style={[styles.tokenRowText, { fontSize: fs(13) }, isYou && styles.youText]}>
                      {e.token}
                      {isYou ? ` · ${t('queue.you')}` : ''}
                    </Text>
                    <StatusBadge status={e.status} small />
                  </View>
                );
              })}
          </View>
        </InfoCard>
      </View>

      <PrimaryButton label={t('dash.viewQueue')} onPress={() => router.back()} small />
      <View style={styles.spacer} />
      <PrimaryButton label={t('book.backDash')} onPress={() => router.push(path.dashboard as never)} small />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statsColumn: {
    flexDirection: 'column',
  },
  statsRow2: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  currentToken: {
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  servingName: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressLabel: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  updatedText: {
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  tokenList: {
    padding: 0,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tokenRowText: {
    color: Colors.text,
    fontWeight: '700',
  },
  youRow: {
    backgroundColor: Colors.greenLight,
  },
  youText: {
    color: Colors.greenDark,
    fontWeight: '800',
  },
  spacer: {
    height: Spacing.sm,
  },
});