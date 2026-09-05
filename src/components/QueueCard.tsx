import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import DemoBadge from './DemoBadge';
import ProgressTrack from './ProgressTrack';
import StatusBadge from './StatusBadge';
import { formatTime12h } from '../data/mockData';
import { useI18n } from '../i18n';
import { useStore } from '../store/AppStore';
import type { Booking } from '../data/mockData';

/**
 * Institutional live-queue status panel for the farmer dashboard.
 * Structured metrics in bordered cells rather than a dark SaaS card.
 */
export default function QueueCard({ booking }: { booking: Booking }) {
  const { t, fs } = useI18n();
  const { queues, queueSnapshot } = useStore();
  const snapshot = queueSnapshot(booking.centreId, booking.token);
  const queue = queues[booking.centreId];
  const totalAheadAndServing = snapshot.farmersAhead + (snapshot.processing ? 1 : 0);
  const completedCount = snapshot.completedCount;
  const waitingTotal = completedCount + totalAheadAndServing || 1;
  const progress = completedCount / waitingTotal;

  const done = booking.status === 'Completed';
  const yourTurn = booking.status === 'Your Turn' || snapshot.farmersAhead === 0;

  return (
    <View style={[styles.card, yourTurn && !done && styles.turnCard]}>
      <View style={styles.headerRow}>
        <Text style={[styles.cardTitle, { fontSize: fs(14) }]}>{t('dash.liveQueue')}</Text>
        <DemoBadge />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { fontSize: fs(11) }]}>{t('dash.yourToken')}</Text>
          <Text style={[styles.statBig, { fontSize: fs(28) }]}>{booking.token.replace('FPP-', '')}</Text>
        </View>
        <View style={[styles.stat, styles.statAlt]}>
          <Text style={[styles.statLabel, { fontSize: fs(11) }]}>{t('dash.currentToken')}</Text>
          <Text style={[styles.statBig, styles.statBigLight, { fontSize: fs(28) }]}>
            {snapshot.currentlyServing ? snapshot.currentlyServing.replace('FPP-', '') : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { fontSize: fs(20) }]}>{snapshot.farmersAhead}</Text>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('dash.farmersAhead')}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { fontSize: fs(20) }]}>
            {done ? '—' : t('dash.estWaitValue', { n: snapshot.estimatedWaitMinutes })}
          </Text>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('dash.estWait')}</Text>
        </View>
        <View style={styles.metric}>
          <View style={styles.metricBadge}><StatusBadge status={booking.status} small /></View>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('dash.status')}</Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <Text style={[styles.progressLabel, { fontSize: fs(11) }]}>{t('dash.queueProgress')}</Text>
        <ProgressTrack progress={done ? 1 : progress} height={10} />
      </View>

      {queue ? (
        <Text style={[styles.updated, { fontSize: fs(11) }]}>
          {booking.centreName} · {t('book.hours')}: {formatTime12h('08:00')}–{formatTime12h('17:00')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.md,
  },
  turnCard: {
    borderColor: Colors.green,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryDark,
  },
  cardTitle: {
    color: Colors.white,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    padding: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  statAlt: {
    borderRightWidth: 0,
    backgroundColor: Colors.surfaceAlt,
  },
  statLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statBig: {
    color: Colors.primaryDark,
    fontWeight: '800',
    marginTop: 2,
  },
  statBigLight: {
    color: Colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  metricBadge: {
    height: 28,
    justifyContent: 'center',
  },
  metricValue: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  progressLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  progressWrap: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  updated: {
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
