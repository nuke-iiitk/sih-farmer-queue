import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import AlertBanner from '../components/AlertBanner';
import InfoCard, { MetaRow } from '../components/InfoCard';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import QuickActions from '../components/QuickActions';
import QueueCard from '../components/QueueCard';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { Colors, Spacing } from '../constants/theme';
import { formatDateLong, slotRange } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import { useStore } from '../store/AppStore';

export default function DashboardScreen() {
  const { t, fs } = useI18n();
  const { farmer, auth, activeBookingFor, bookings, markArrived } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const name = farmer?.name.split(' ')[0] ?? t('nav.dashboard');
  const booking = farmer ? activeBookingFor(farmer.id) : undefined;
  const recentBookings = farmer ? bookings.filter((b) => b.farmerId === farmer.id).slice(0, 3) : [];

  return (
    <ScreenShell breadcrumbs={[{ label: t('nav.dashboard') }]}>
      {/* Welcome panel — government identity card style */}
      <View style={styles.welcomePanel}>
        <View style={styles.welcomeLeft}>
          <Text style={[styles.welcomeLabel, { fontSize: fs(12) }]}>FARMER DASHBOARD</Text>
          <Text style={[styles.welcomeName, { fontSize: fs(24) }]}>
            {t('dash.namaste', { name })}
          </Text>
          {farmer ? (
            <Text style={[styles.welcomeSub, { fontSize: fs(13) }]}>
              {t('dash.subtitle', { id: farmer.id, village: farmer.village, district: farmer.district })}
            </Text>
          ) : (
            <Text style={[styles.welcomeSub, { fontSize: fs(13) }]}>{t('profile.needLogin')}</Text>
          )}
        </View>
        {auth.role !== 'farmer' ? (
          <SecondaryButton label={t('nav.login')} onPress={() => router.push(path.login as never)} small />
        ) : null}
      </View>

      {booking ? (
        <View style={[styles.grid, wide && styles.gridRow]}>
          <View style={[styles.col, wide && styles.colWide]}>
            {/* Current procurement — structured information panel */}
            <InfoCard title="Current Procurement">
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { fontSize: fs(12) }]}>{t('dash.status')}:</Text>
                <StatusBadge status={booking.status} />
              </View>
              <MetaRow label={t('dash.centre')} value={booking.centreName} />
              <MetaRow label={t('dash.date')} value={formatDateLong(booking.date)} />
              <MetaRow label={t('dash.time')} value={slotRange(booking.slotStart, booking.slotEnd)} />
              <MetaRow label={t('dash.token')} value={booking.token} />
              <MetaRow label={t('dash.produce')} value={`${booking.produce} · ${booking.quantityKg} kg`} />

              {booking.status === 'Upcoming' || (booking.status === 'Waiting' && !booking.arrived) ? (
                <View style={styles.spacerSm}>
                  <PrimaryButton
                    label={`✓ ${t('dash.checkIn')}`}
                    onPress={() => markArrived(booking.id)}
                    variant="success"
                    small
                  />
                </View>
              ) : null}
            </InfoCard>

            {/* Live queue */}
            <QueueCard booking={booking} />

            {/* Timeline */}
            <InfoCard title={t('dash.timelineTitle')}>
              <StatusTimeline booking={booking} />
            </InfoCard>
          </View>

          <View style={styles.col}>
            <SectionHeading title={t('dash.quickActions')} />
            <QuickActions />

            {recentBookings.length > 0 ? (
              <>
                <SectionHeading
                  title={t('dash.recentNotifications')}
                  right={
                    <Pressable onPress={() => router.push(path.notifications as never)}>
                      <Text style={styles.viewAll}>{t('common.viewAll')} →</Text>
                    </Pressable>
                  }
                />
                <InfoCard padded={false}>
                  {recentBookings.map((b) => (
                    <Pressable
                      key={b.id}
                      onPress={() => router.push(path.bookings as never)}
                      style={styles.notificationRow}
                    >
                      <View style={styles.notifIcon}>
                        {b.status === 'Completed' ? (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.green} />
                        ) : b.status === 'Cancelled' ? (
                          <Ionicons name="close-circle" size={18} color={Colors.danger} />
                        ) : (
                          <Ionicons name="time" size={18} color={Colors.saffronDark} />
                        )}
                      </View>
                      <View style={styles.notifBody}>
                        <Text style={[styles.notifTitle, { fontSize: fs(14) }]}>
                          {b.token} · {b.centreName}
                        </Text>
                        <Text style={[styles.notifMeta, { fontSize: fs(12) }]}>
                          {formatDateLong(b.date)} · {slotRange(b.slotStart, b.slotEnd)}
                        </Text>
                      </View>
                      <StatusBadge status={b.status} small />
                    </Pressable>
                  ))}
                </InfoCard>
              </>
            ) : (
              <AlertBanner tone="neutral" message={t('notif.empty')} />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noBookingWrap}>
          <InfoCard title={t('dash.noBooking')}>
            <Text style={[styles.noBookingBody, { fontSize: fs(14) }]}>{t('dash.noBookingBody')}</Text>
            <View style={styles.spacerSm} />
            <PrimaryButton label={t('dash.bookNow')} onPress={() => router.push(path.booking as never)} />
          </InfoCard>
          <SectionHeading title={t('dash.quickActions')} />
          <QuickActions />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  welcomePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderLeftWidth: 4,
    borderLeftColor: Colors.saffron,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  welcomeLeft: {
    flex: 1,
    minWidth: 240,
  },
  welcomeLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  welcomeName: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  welcomeSub: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  grid: {
    gap: Spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  colWide: {
    flex: 1.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statusLabel: {
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  spacerSm: {
    height: Spacing.md,
    marginTop: Spacing.sm,
  },
  noBookingWrap: {
    gap: Spacing.lg,
  },
  noBookingBody: {
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  viewAll: {
    color: Colors.info,
    fontWeight: '700',
    fontSize: 13,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 2,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontWeight: '700',
    color: Colors.text,
  },
  notifMeta: {
    color: Colors.textMuted,
    marginTop: 2,
  },
});
