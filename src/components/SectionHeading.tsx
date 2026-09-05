import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

export default function SectionHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { fs } = useI18n();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.accent} />
        <Text style={[styles.title, { fontSize: fs(20) }]}>{title}</Text>
        {right}
      </View>
      {subtitle ? <Text style={[styles.subtitle, { fontSize: fs(14) }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryDark,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  accent: {
    width: 6,
    height: 24,
    backgroundColor: Colors.saffron,
  },
  title: {
    fontWeight: '800',
    color: Colors.primaryDark,
    flexShrink: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Fonts.extraBold,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 14,
    fontWeight: '500',
  },
});
