import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../components/EmptyState';
import InfoCard from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import NotificationCard from '../components/NotificationCard';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import { Colors, Spacing } from '../constants/theme';
import { useI18n, type TranslationKey } from '../i18n';
import { router } from 'expo-router';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

function relativeTime(ts: number, t: (k: TranslationKey, vars?: Record<string, string | number>) => string): string {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return t('notif.justNow');
  if (diffMin < 60) return t('notif.minAgo', { n: diffMin });
  if (diffMin < 60 * 24) return t('notif.hourAgo', { n: Math.round(diffMin / 60) });
  return t('notif.yesterday');
}

export default function NotificationsScreen() {
  const { t, fs } = useI18n();
  const { notifications, markAllNotificationsRead } = useStore();

  const sorted = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.timestamp - a.timestamp;
      }),
    [notifications]
  );

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.notifications') }]}>
      <SectionHeading
        title={t('notif.title')}
        subtitle={t('notif.subtitle')}
        right={
          sorted.some((n) => !n.read) ? (
            <Pressable onPress={markAllNotificationsRead} accessibilityRole="button">
              <Text style={[styles.markAll, { fontSize: fs(12) }]}>{t('notif.markAll')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      {sorted.length === 0 ? (
        <EmptyState icon="notifications" title={t('notif.empty')} message={t('notif.emptyBody')} />
      ) : (
        sorted.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            timeLabel={relativeTime(notification.timestamp, t)}
          />
        ))
      )}

      <InfoCard>
        <Text style={[styles.channelNote, { fontSize: fs(12) }]}>
          🔌 {t('notif.channelNote')}
        </Text>
      </InfoCard>

      <View style={styles.spacer} />
      <PrimaryButton label={t('book.backDash')} onPress={() => router.push(path.dashboard as never)} small />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  markAll: {
    color: Colors.info,
    fontWeight: '700',
  },
  channelNote: {
    color: Colors.textMuted,
    lineHeight: 18,
  },
  spacer: {
    height: Spacing.sm,
  },
});