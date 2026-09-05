import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';

type Props = {
  label: string;
  value: string | number;
  tone?: 'navy' | 'green' | 'saffron' | 'grey' | 'red';
  sub?: string;
};

const TONES = {
  navy: { bg: Colors.primaryLight, fg: Colors.primary },
  green: { bg: Colors.greenLight, fg: Colors.green },
  saffron: { bg: Colors.saffronLight, fg: Colors.saffronDark },
  grey: { bg: Colors.surfaceAlt, fg: Colors.text },
  red: { bg: Colors.dangerLight, fg: Colors.danger },
};

export default function StatCard({ label, value, tone = 'navy', sub }: Props) {
  const { fs } = useI18n();
  const colors = TONES[tone];
  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <Text style={[styles.value, { color: colors.fg, fontSize: fs(28) }]}>{value}</Text>
      <Text style={[styles.label, { fontSize: fs(13) }]}>{label}</Text>
      {sub ? <Text style={[styles.sub, { fontSize: fs(11) }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 130,
  },
  value: {
    fontWeight: '800',
  },
  label: {
    marginTop: 2,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sub: {
    marginTop: 2,
    color: Colors.textMuted,
  },
});
