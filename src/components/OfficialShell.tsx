import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, MaxContentWidth, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { useStore } from '../store/AppStore';

const NAV = [
  { href: '/official', labelKey: 'off.dash.title' as const, icon: 'speedometer' as const, exact: true },
  { href: '/official/queue', labelKey: 'off.queue.title' as const, icon: 'pulse' as const },
  { href: '/official/slots', labelKey: 'off.slots.title' as const, icon: 'grid' as const },
  { href: '/official/analytics', labelKey: 'off.analytics.title' as const, icon: 'bar-chart' as const },
];

/** Government-admin chrome for the procurement officer portal. */
export default function OfficialShell({ children }: { children: React.ReactNode }) {
  const { t, fs } = useI18n();
  const { officer, officerCentreId, centres, logout } = useStore();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const sidebar = width >= 900;
  const centre = centres.find((c) => c.id === officerCentreId);

  return (
    <View style={styles.root}>
      {/* Admin top bar */}
      <View style={styles.topBar}>
                <Pressable style={styles.brand} onPress={() => router.push('/official' as never)} accessibilityRole="link">
          <View style={styles.emblem}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={[styles.portalTitle, { fontSize: fs(15) }]}>{t('off.portal')}</Text>
          </View>
        </Pressable>

        <View style={styles.topActions}>
          <Text style={[styles.officerText, { fontSize: fs(12) }]}>
            {officer ? `${officer.name} · ${officer.id}` : t('nav.officialPortal')}
          </Text>
          <Pressable
            onPress={() => {
              logout();
              router.push('/');
            }}
            style={styles.logoutBtn}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={14} color={Colors.white} />
            <Text style={[styles.logoutText, { fontSize: fs(12) }]}>{t('nav.logout')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {/* Sidebar (desktop) */}
        {sidebar ? (
          <View style={styles.sidebar}>
            <Text style={[styles.centreLabel, { fontSize: fs(11) }]}>{t('off.dash.center')}</Text>
            <View style={styles.centreBox}>
              <Text style={[styles.centreName, { fontSize: fs(13) }]}>{centre?.name ?? '—'}</Text>
              <Text style={[styles.centreMeta, { fontSize: fs(11) }]}>
                {centre?.district}, {centre?.state}
              </Text>
            </View>
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as never)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.sideItem, active && styles.sideItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={active ? Colors.saffron : Colors.textOnDark}
                  />
                  <Text
                    style={[
                      styles.sideItemText,
                      active && styles.sideItemTextActive,
                      { fontSize: fs(13) },
                    ]}
                  >
                    {t(item.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.sideDivider} />
                        <Pressable onPress={() => router.push('/')} style={styles.sideItem}>
              <Ionicons name="globe" size={16} color={Colors.textOnDark} />
              <Text style={[styles.sideItemText, { fontSize: fs(13) }]}>{t('landing.heroTitle')}</Text>
            </Pressable>
          </View>
        ) : null}

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <View style={[styles.inner, { maxWidth: MaxContentWidth }]}>
            {/* Horizontal nav (mobile) */}
            {!sidebar ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
                {NAV.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Pressable
                      key={item.href}
                      onPress={() => router.push(item.href as never)}
                      style={[styles.mobileItem, active && styles.mobileItemActive]}
                      accessibilityRole="tab"
                    >
                      <Ionicons name={item.icon} size={13} color={active ? Colors.primary : Colors.white} />
                      <Text
                        style={[
                          styles.mobileItemText,
                          active && styles.mobileItemTextActive,
                          { fontSize: fs(12) },
                        ]}
                      >
                        {t(item.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: Colors.saffron,
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalTitle: {
    color: Colors.white,
    fontWeight: '800',
  },
  portalSub: {
    color: Colors.textOnDark,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  officerText: {
    color: Colors.textOnDark,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: {
    color: Colors.white,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: 4,
  },
  centreLabel: {
    color: Colors.textOnDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  centreBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  centreName: {
    color: Colors.white,
    fontWeight: '800',
  },
  centreMeta: {
    color: Colors.textOnDark,
    marginTop: 2,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  sideItemActive: {
    backgroundColor: Colors.white,
  },
  sideItemText: {
    color: Colors.textOnDark,
    fontWeight: '700',
  },
  sideItemTextActive: {
    color: Colors.primaryDark,
  },
  sideDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  mobileNav: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  mobileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: Radius.sm,
  },
  mobileItemActive: {
    backgroundColor: Colors.white,
  },
  mobileItemText: {
    color: Colors.white,
    fontWeight: '700',
  },
  mobileItemTextActive: {
    color: Colors.primaryDark,
  },
});


