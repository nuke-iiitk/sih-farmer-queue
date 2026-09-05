import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { APP_ICONS, AppIcon } from '../components/AppIcon';
import DemoBadge from '../components/DemoBadge';
import { PrimaryButton, SecondaryButton } from '../components/PrimaryButton';
import ScreenShell from '../components/ScreenShell';
import SectionHeading from '../components/SectionHeading';
import { Colors, Radius, Spacing, SystemFonts } from '../constants/theme';
import { analyticsSummary } from '../data/mockData';
import { useI18n } from '../i18n';
import { path } from '../navigation';

export default function HomeScreen() {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width >= 768;

  return (
    <ScreenShell>
      {/* Important Announcement / Notice Strip */}
      <View style={styles.noticeStrip}>
        <View style={styles.noticeIcon}>
          <Ionicons name="megaphone" size={12} color={Colors.white} />
          <Text style={styles.noticeIconText}>NEW</Text>
        </View>
        <Text style={[styles.noticeText, { fontSize: fs(13) }]}>
          {t('landing.noticeStrip')}
        </Text>
      </View>

      {/* Main Hero Section */}
      <View style={[styles.heroBlock, wide && styles.heroRow]}>
        <View style={styles.heroLeft}>
          <View style={styles.heroTitleLines}>
            <Text style={[styles.portalTitle, { fontSize: fs(30) }]}>{t('landing.heroTitle1')}</Text>
            <Text style={[styles.portalTitle, { fontSize: fs(30) }]}>{t('landing.heroTitle2')}</Text>
            <Text style={[styles.portalTitle, { fontSize: fs(30) }]}>{t('landing.heroTitle3')}</Text>
          </View>

          <Text style={[styles.portalDesc, { fontSize: fs(14) }]}>{t('landing.heroDesc')}</Text>

          <View style={styles.heroButtons}>
            <PrimaryButton
              label={t('landing.ctaBook')}
              onPress={() => router.push(path.booking)}
            />
            <SecondaryButton
              label={t('landing.ctaTrack')}
              onPress={() => router.push(path.queue)}
            />
          </View>
        </View>
        
        <View style={styles.heroRight}>
          <View style={styles.statusBox}>
            <View style={styles.statusHeader}>
              <Ionicons name="speedometer" size={15} color={Colors.white} />
              <Text style={[styles.statusTitle, { fontSize: fs(13) }]}>Current Procurement Cycle</Text>
              <DemoBadge />
            </View>
            <View style={styles.statusContent}>
              <View style={styles.statusRow}>
                <View style={styles.statusRowLeft}>
                  <Ionicons name="checkmark-circle" size={15} color={Colors.green} />
                  <Text style={[styles.statusLabel, { fontSize: fs(11) }]}>Status</Text>
                </View>
                <Text style={[styles.statusValue, { fontSize: fs(14), color: Colors.green }]}>ACTIVE</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <View style={styles.statusRowLeft}>
                  <Ionicons name="people" size={15} color={Colors.primary} />
                  <Text style={[styles.statusLabel, { fontSize: fs(11) }]}>Farmers Processed</Text>
                </View>
                <Text style={[styles.statusValue, { fontSize: fs(14) }]}>{analyticsSummary.farmersProcessed}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statusRow}>
                <View style={styles.statusRowLeft}>
                  <Ionicons name="pie-chart" size={15} color={Colors.saffronDark} />
                  <Text style={[styles.statusLabel, { fontSize: fs(11) }]}>Capacity Used</Text>
                </View>
                <Text style={[styles.statusValue, { fontSize: fs(14) }]}>{analyticsSummary.capacityUsedPercent}%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Services and Notices Grid */}
      <View style={[styles.mainGrid, wide && styles.mainGridRow]}>
        
        {/* Left Column: Services & Process */}
        <View style={styles.mainCol}>
          <SectionHeading title="Important Services" />
          <View style={styles.serviceList}>
            {[
              {
                title: t('nav.register'),
                desc: t('landing.step1Body'),
                href: path.register,
                icon: APP_ICONS.personAdd,
                color: Colors.info,
                bg: Colors.infoLight,
              },
              {
                title: t('nav.booking'),
                desc: t('landing.step3Body'),
                href: path.booking,
                icon: APP_ICONS.calendar,
                color: Colors.saffron,
                bg: Colors.saffronLight,
              },
              {
                title: t('nav.queue'),
                desc: t('landing.step5Body'),
                href: path.queue,
                icon: APP_ICONS.pulse,
                color: Colors.green,
                bg: Colors.greenLight,
              },
              {
                title: t('nav.centres'),
                desc: 'View procurement centres and capacities.',
                href: path.centres,
                icon: APP_ICONS.business,
                color: Colors.primary,
                bg: Colors.primaryLight,
              },
            ].map((srv, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.serviceItem,
                  wide && styles.serviceItemWide,
                  pressed && styles.serviceItemPressed,
                ]}
                onPress={() => router.push(srv.href as never)}
              >
                <View style={[styles.serviceIconWrap, { backgroundColor: srv.bg }]}>
                  <AppIcon name={srv.icon} size={22} color={srv.color} />
                </View>
                <View style={styles.serviceCopy}>
                  <Text style={[styles.serviceTitle, { fontSize: fs(14) }]}>{srv.title}</Text>
                  <Text style={[styles.serviceDesc, { fontSize: fs(12) }]}>{srv.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: Spacing.xl }}>
            <SectionHeading title={t('landing.stepsTitle')} subtitle={t('landing.stepsSub')} />
            <View style={styles.processBox}>
              {[
                { step: 1, label: t('landing.step1'), icon: 'person-add' as const },
                { step: 2, label: t('landing.step2'), icon: 'location' as const },
                { step: 3, label: t('landing.step3'), icon: 'calendar' as const },
                { step: 4, label: t('landing.step4'), icon: 'ticket' as const },
                { step: 5, label: t('landing.step5'), icon: 'pulse' as const },
                { step: 6, label: t('landing.step6'), icon: 'checkmark-done' as const },
              ].map((item, idx) => (
                <View key={idx} style={styles.processRow}>
                  <View style={styles.processNum}>
                    <Text style={styles.processNumText}>{item.step}</Text>
                  </View>
                  <Ionicons name={item.icon} size={16} color={Colors.primary} />
                  <Text style={[styles.processLabel, { fontSize: fs(13) }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Right Column: Notices */}
        <View style={styles.sideCol}>
          <SectionHeading title={t('notice.title')} />
          <View style={styles.noticeBoard}>
            <View style={styles.noticeBoardHeader}>
              <Text style={[styles.nbHeaderText, { fontSize: fs(11) }]}>{t('notice.subject')}</Text>
              <Text style={[styles.nbHeaderText, { fontSize: fs(11), width: 80, textAlign: 'right' }]}>{t('notice.date')}</Text>
            </View>
            {[
              { title: 'Procurement schedule updated for Kharif season', date: '29 Aug 2026' },
              { title: 'Slot booking opened for Kottayam district', date: '28 Aug 2026' },
              { title: 'Guidelines for bringing produce to centres', date: '25 Aug 2026' },
              { title: 'Registration portal maintenance notice', date: '20 Aug 2026' },
              { title: 'Revised capacity for major procurement centres', date: '15 Aug 2026' },
            ].map((n, idx) => (
              <View key={idx} style={styles.noticeItem}>
                <Ionicons name="document-text" size={15} color={Colors.info} style={styles.noticeItemIcon} />
                <View style={styles.noticeCopy}>
                  <Text style={[styles.noticeItemTitle, { fontSize: fs(13) }]}>{n.title}</Text>
                </View>
                <Text style={[styles.noticeItemDate, { fontSize: fs(11), width: 80, textAlign: 'right' }]}>{n.date}</Text>
              </View>
            ))}
            <Pressable style={styles.noticeMoreBtn} onPress={() => router.push(path.notices as never)}>
              <Text style={[styles.noticeMoreText, { fontSize: fs(12) }]}>{t('common.viewAll')}</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </Pressable>
          </View>
        </View>

      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  noticeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.saffronLight,
    borderWidth: 1,
    borderColor: Colors.saffron,
    padding: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  noticeIcon: {
    backgroundColor: Colors.saffronDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
  },
  noticeIconText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  noticeText: {
    color: Colors.saffronDark,
    fontWeight: '700',
    flex: 1,
  },
  heroBlock: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  heroLeft: {
    flex: 1,
  },
  portalTitle: {
    color: Colors.primaryDark,
    fontFamily: SystemFonts.serif,
    fontWeight: '400',
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  heroTitleLines: {
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  portalDesc: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 600,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  heroRight: {
    width: '100%',
    maxWidth: 320,
    marginTop: Spacing.lg,
  },
  statusBox: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.md,
    backgroundColor: Colors.primaryDark,
  },
  statusTitle: {
    color: Colors.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    flex: 1,
  },
  statusContent: {
    padding: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusValue: {
    color: Colors.text,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  mainGrid: {
    gap: Spacing.xl,
  },
  mainGridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: 2,
  },
  sideCol: {
    flex: 1,
  },
  serviceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    flexBasis: '100%',
  },
  serviceItemWide: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  serviceItemPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  serviceCopy: {
    flex: 1,
  },
  serviceTitle: {
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  serviceDesc: {
    color: Colors.textSecondary,
  },
  processBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  processRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  processNum: {
    width: 24,
    height: 24,
    backgroundColor: Colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  processNumText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  processLabel: {
    color: Colors.text,
    fontWeight: '600',
  },
  noticeBoard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeBoardHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nbHeaderText: {
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    flex: 1,
  },
  noticeItem: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  noticeItemIcon: {
    marginRight: Spacing.sm,
    alignSelf: 'center',
  },
  noticeCopy: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  noticeItemTitle: {
    color: Colors.info,
    fontWeight: '600',
    lineHeight: 18,
  },
  noticeItemDate: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  noticeMoreBtn: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.surfaceMuted,
  },
  noticeMoreText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
