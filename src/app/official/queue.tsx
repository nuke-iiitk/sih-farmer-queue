import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AlertBanner from '../../components/AlertBanner';
import DataTable from '../../components/DataTable';
import DemoBadge from '../../components/DemoBadge';
import OfficialShell from '../../components/OfficialShell';
import SectionHeading from '../../components/SectionHeading';
import StatusBadge from '../../components/StatusBadge';
import { PrimaryButton, SecondaryButton } from '../../components/PrimaryButton';
import { Colors, Spacing } from '../../constants/theme';
import type { QueueEntry } from '../../data/mockData';
import { useI18n } from '../../i18n';
import { useStore } from '../../store/AppStore';

export default function OfficialQueue() {
  const { t, fs } = useI18n();
  const {
    officerCentreId,
    queues,
    callFarmer,
    startProcurement,
    completeProcurement,
    toggleHold,
    advanceQueue,
  } = useStore();

  const [search] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Waiting' | 'Called' | 'Processing' | 'On Hold' | 'Completed'>('All');

  const queue = queues[officerCentreId];
  const entries = queue?.entries ?? [];

  const filtered = entries.filter((e) => {
    const matchesSearch =
      search.trim().length === 0 ||
      e.token.toLowerCase().includes(search.toLowerCase()) ||
      e.farmerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const actions = (entry: QueueEntry) => (
    <View style={styles.actions}>
      {entry.status === 'Waiting' && (
        <SecondaryButton
          label={t('off.queue.call')}
          onPress={() => callFarmer(officerCentreId, entry.token)}
        />
      )}
      {entry.status === 'Called' && (
        <PrimaryButton
          label={t('off.queue.start')}
          onPress={() => startProcurement(officerCentreId, entry.token)}
        />
      )}
      {entry.status === 'Processing' && (
        <PrimaryButton
          label={t('off.queue.complete')}
          onPress={() => completeProcurement(officerCentreId, entry.token)}
        />
      )}
      {entry.status !== 'Processing' && entry.status !== 'Completed' && (
        <SecondaryButton
          label={entry.status === 'On Hold' ? t('off.queue.release') : t('off.queue.hold')}
          onPress={() => toggleHold(officerCentreId, entry.token)}
        />
      )}
    </View>
  );

  const columns = [
    { key: 'token', header: t('off.queue.token'), width: 110, render: (e: QueueEntry) => (
      <Text style={[styles.token, { fontSize: fs(14) }]}>{e.token}</Text>
    )},
    { key: 'farmer', header: t('off.queue.farmer'), render: (e: QueueEntry) => (
      <Text style={[styles.cellText, { fontSize: fs(14) }]}>{e.farmerName}</Text>
    )},
    { key: 'slot', header: t('off.queue.slot'), width: 90, render: (e: QueueEntry) => (
      <Text style={[styles.cellText, { fontSize: fs(14) }]}>{e.slot}</Text>
    )},
    { key: 'produce', header: t('off.queue.produce'), width: 100, render: (e: QueueEntry) => (
      <Text style={[styles.cellText, { fontSize: fs(14) }]}>{e.produce}</Text>
    )},
    { key: 'status', header: t('off.queue.statusCol'), width: 120, render: (e: QueueEntry) => (
      <StatusBadge status={e.status} small />
    )},
    { key: 'action', header: t('off.queue.action'), width: 160, render: actions },
  ];

  return (
    <OfficialShell>
      <SectionHeading
        title={t('off.queue.title')}
        subtitle={t('off.queue.subtitle')}
        right={<DemoBadge />}
      />

      {/* Search and filter */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <Text style={[styles.searchPlaceholder, { fontSize: fs(14) }]}>
            {t('off.queue.search')}
          </Text>
        </View>
        <View style={styles.statusFilters}>
          {(['All', 'Waiting', 'Called', 'Processing', 'On Hold', 'Completed'] as const).map((s) => (
            <SecondaryButton
              key={s}
              label={s === 'All' ? t('off.queue.filter') : s}
              onPress={() => setStatusFilter(s)}
            />
          ))}
        </View>
      </View>

      {/* Advance button */}
      <View style={styles.advanceRow}>
        <PrimaryButton
          label={t('off.queue.advance')}
          onPress={() => advanceQueue(officerCentreId)}
        />
      </View>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.token}
        emptyLabel={t('off.queue.none')}
      />

      <AlertBanner tone="neutral" message={t('common.demoNote')} />
    </OfficialShell>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchPlaceholder: {
    color: Colors.textMuted,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  advanceRow: {
    marginBottom: Spacing.md,
  },
  token: {
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cellText: {
    color: Colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});
