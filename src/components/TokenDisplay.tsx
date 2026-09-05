import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import DemoBadge from './DemoBadge';
import { useI18n } from '../i18n';

/**
 * Official examination-admit-card style token display.
 * Strong double border, header strip, rectangular layout.
 */
export default function TokenDisplay({
  token,
  label,
  subtitle,
}: {
  token: string;
  label?: string;
  subtitle?: string;
}) {
  const { t, fs } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  // Scale the giant token number so it never overflows a 360–400px phone.
  const tokenSize = fs(compact ? 34 : 52);
  const tokenLetter = compact ? 2 : 4;
  return (
    <View style={styles.wrap}>
      {/* Header strip */}
      <View style={styles.headerStrip}>
        <Text style={[styles.headerText, { fontSize: fs(13) }]}>
          {label ?? 'PROCUREMENT TOKEN'}
        </Text>
      </View>

      {/* Token body */}
      <View style={styles.body}>
        <Text style={[styles.token, { fontSize: tokenSize, letterSpacing: tokenLetter }]} accessibilityRole="text">
          {token}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { fontSize: fs(13) }]}>{subtitle}</Text> : null}
        <View style={styles.demoRow}>
          <DemoBadge />
        </View>
      </View>

      {/* Footer strip */}
      <View style={styles.footerStrip}>
        <Text style={[styles.footerText, { fontSize: fs(11) }]}>
          {t('common.appName')} · DEPARTMENT OF CONSUMER AFFAIRS
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primaryDark,
    marginBottom: Spacing.lg,
  },
  headerStrip: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  headerText: {
    color: Colors.white,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  body: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  token: {
    color: Colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 19,
  },
  demoRow: {
    marginTop: Spacing.md,
  },
  footerStrip: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 6,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
