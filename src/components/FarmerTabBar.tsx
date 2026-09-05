import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { path } from '../navigation';

const TABS = [
  { href: path.dashboard, label: 'Home', icon: 'home' as const },
  { href: path.dashboard, label: 'Dashboard', icon: 'grid' as const },
  { href: path.booking, label: 'Book Slot', icon: 'calendar' as const },
  { href: path.queue, label: 'Track Token', icon: 'pulse' as const },
  { href: path.bookings, label: 'History', icon: 'list' as const },
  { href: path.notifications, label: 'Alerts', icon: 'notifications' as const },
  { href: path.profile, label: 'Profile', icon: 'person' as const },
] as const;

/**
 * Floating popup navigation panel.
 *
 * Hidden at the top of the page; ScreenShell flips `visible` once the user
 * scrolls down, and it hides again when the user returns to the top.
 * Rendered as a large elevated panel fixed above the bottom edge.
 */
export default function FarmerTabBar({ visible = false }: { visible?: boolean }) {
  const { fs } = useI18n();
  const pathname = usePathname();

  if (!visible) return null;

  return (
    <View style={styles.popup} pointerEvents="box-none">
      <View style={styles.panel}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Pressable
              key={tab.label}
              onPress={() => router.push(tab.href as never)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons
                name={tab.icon}
                size={22}
                color={active ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.tabLabel, { fontSize: fs(11) }, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const PANEL_WIDTH = 380;

const styles = StyleSheet.create({
  popup: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  panel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: Radius.md,
        padding: Spacing.sm,
    width: '92%',
    maxWidth: PANEL_WIDTH,
    alignSelf: 'center',
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.14)' as unknown as string },
      default: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 70,
    minHeight: 60,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
});
