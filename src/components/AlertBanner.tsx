import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { TONES, type AlertBannerProps, type Tone } from './alertShared';

export type { Tone };

/** Native (iOS/Android) alert banner — React Native styles only. */
export default function AlertBanner({
  tone = 'info',
  title,
  message,
  icon,
}: AlertBannerProps) {
  const { fs } = useI18n();
  const colors = TONES[tone];
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.bg, borderColor: colors.border }]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={(icon ?? colors.icon) as keyof typeof Ionicons.glyphMap}
        size={20}
        color={colors.fg}
      />
      <View style={styles.textWrap}>
        {title ? (
          <Text style={[styles.title, { color: colors.fg, fontSize: fs(14) }]}>{title}</Text>
        ) : null}
        <Text style={[styles.message, { color: colors.fg, fontSize: fs(13) }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    lineHeight: 19,
    fontWeight: '600',
  },
});

