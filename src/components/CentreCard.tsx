import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { useStore } from '../store/AppStore';
import type { ProcurementCentre } from '../data/mockData';

type Props = {
  centre: ProcurementCentre;
  action?: React.ReactNode;
};

/** Centre card for the directory and booking flow. */
export default function CentreCard({ centre, action }: Props) {
  const { t, fs } = useI18n();
  const { slots, queueSnapshot } = useStore();

  const centreSlots = slots.filter((slot) => slot.centreId === centre.id);
  const today = centreSlots.filter(
    (slot) => slot.date === centreSlots[0]?.date
  );
  const openSlots = today.filter((slot) => !slot.closed && slot.booked < slot.capacity).length;
  const snapshot = queueSnapshot(centre.id);

  // Simplify "Open | Busy | Full" -> Open, otherwise Closed.
  const isOpen = centre.status === 'Open' || centre.status === 'Busy' || centre.status === 'Full';
  const statusTone = isOpen ? Colors.green : Colors.textMuted;
  const statusIcon: keyof typeof Ionicons.glyphMap = isOpen ? 'checkmark-circle' : 'close-circle';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Ionicons name="business" size={18} color={Colors.primary} />
          <Text style={[styles.name, { fontSize: fs(16) }]} numberOfLines={2}>
            {centre.name}
          </Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name={statusIcon} size={13} color={statusTone} />
          <Text style={[styles.statusText, { color: statusTone, fontSize: fs(12) }]}>
            {isOpen ? t('centres.open') : t('centres.closed')}
          </Text>
        </View>
      </View>

      <Text style={[styles.location, { fontSize: fs(13) }]}>
        <Ionicons name="location" size={12} color={Colors.textMuted} /> {centre.address},{' '}
        {centre.district}, {centre.state} · {centre.distanceKm} {t('common.km')}
      </Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Ionicons name="time" size={14} color={Colors.primary} style={styles.metricIcon} />
          <Text style={[styles.metricValue, { fontSize: fs(18), color: Colors.green }]}>{openSlots}</Text>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('centres.slotsLeft')}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="people" size={14} color={Colors.saffronDark} style={styles.metricIcon} />
          <Text style={[styles.metricValue, { fontSize: fs(18), color: Colors.saffronDark }]}>
            {snapshot.waitingCount}
          </Text>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('centres.queueNow')}</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="archive" size={14} color={Colors.primary} style={styles.metricIcon} />
          <Text style={[styles.metricValue, { fontSize: fs(18), color: Colors.primary }]}>
            {centre.capacityPerDay}
          </Text>
          <Text style={[styles.metricLabel, { fontSize: fs(11) }]}>{t('book.capacity')}</Text>
        </View>
      </View>

      <Text style={[styles.hours, { fontSize: fs(12) }]}>
        <Ionicons name="time" size={12} color={Colors.textMuted} /> {t('book.hours')}: {centre.openingHours}
      </Text>
      <Text style={[styles.crops, { fontSize: fs(12) }]}>
        <Ionicons name="leaf" size={12} color={Colors.green} /> {centre.crops.join(' · ')}
      </Text>

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexGrow: 1,
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  name: {
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    fontWeight: '800',
  },
  location: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricIcon: {
    marginBottom: 2,
  },
  metricValue: {
    fontWeight: '800',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  hours: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  crops: {
    color: Colors.textSecondary,
  },
  action: {
    marginTop: Spacing.md,
  },
});
