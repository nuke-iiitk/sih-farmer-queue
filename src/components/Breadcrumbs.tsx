import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { path } from '../navigation';

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { fs } = useI18n();
  const pathname = usePathname();

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => router.push(path.home)} accessibilityRole="link">
        <Text style={[styles.link, { fontSize: fs(12) }]}>{'⌂ '}{`Home`}</Text>
      </Pressable>
      {items.map((crumb, index) => {
        const last = index === items.length - 1 || crumb.href === pathname;
        return (
          <View key={`${crumb.label}-${index}`} style={styles.row}>
            <Text style={[styles.sep, { fontSize: fs(12) }]}>›</Text>
            {crumb.href && !last ? (
              <Pressable onPress={() => router.push(crumb.href as never)} accessibilityRole="link">
                <Text style={[styles.link, { fontSize: fs(12) }]}>{crumb.label}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.current, { fontSize: fs(12) }]}>{crumb.label}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sep: {
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  link: {
    color: Colors.info,
    fontWeight: '600',
  },
  current: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
