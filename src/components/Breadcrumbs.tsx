import { usePathname, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { path } from '../navigation';
import Link from './Link';

export type Crumb = { label: string; href?: Href | string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { fs, t } = useI18n();
  const pathname = usePathname();

  // A Home crumb is always rendered first below — screens that also pass an
  // explicit Home entry would otherwise render it twice.
  const crumbs = items.filter((crumb) => crumb.href !== path.home);

  return (
    <View style={styles.wrap}>
      <Link href={path.home as string} variant="breadcrumb" label={t('nav.home')} />
      {crumbs.map((crumb, index) => {
        const last = index === items.length - 1 || crumb.href === pathname;
        return (
          <View key={`${crumb.label}-${index}`} style={styles.row}>
            <Text style={[styles.sep, { fontSize: fs(12) }]}>›</Text>
            {crumb.href && !last ? (
              <Link
                href={crumb.href}
                variant="breadcrumb"
                label={crumb.label}
              />
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
  current: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});

