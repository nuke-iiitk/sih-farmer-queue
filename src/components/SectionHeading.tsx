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
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { fontSize: fs(20) }]}>{title}</Text>
          <View style={styles.accentRow}>
            <View style={[styles.accentSeg, { backgroundColor: Colors.saffron, width: 30 }]} />
            <View style={[styles.accentSeg, { backgroundColor: Colors.green, width: 14 }]} />
          </View>
        </View>
        {right}
      </View>
      {subtitle ? <Text style={[styles.subtitle, { fontSize: fs(14) }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  titleWrap: {
    flexShrink: 1,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  accentSeg: {
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontWeight: '800',
    color: Colors.primaryDark,
    flexShrink: 1,
    letterSpacing: 0.2,
    fontFamily: Fonts.extraBold,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
});
