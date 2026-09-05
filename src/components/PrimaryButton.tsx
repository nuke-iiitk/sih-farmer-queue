import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import { Fonts, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { VARIANTS, type AppButtonProps, type ButtonVariant } from './buttonShared';

export type { ButtonVariant, AppButtonProps };

/** Native (iOS/Android) button — React Native styles only. */
export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  icon,
  accessibilityHint,
}: AppButtonProps) {
  const { fs } = useI18n();
  const tone = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: tone.bg, borderColor: tone.border, opacity: pressed ? 0.85 : 1 },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={tone.fg} />
          ) : null}
          <Text style={[styles.label, { color: tone.fg, fontSize: fs(small ? 14 : 16) }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton(props: AppButtonProps) {
  return <PrimaryButton {...props} variant="secondary" />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonSmall: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  disabled: {
    opacity: 0.45,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Fonts.semiBold,
  },
});


