import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { router, type Href } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { useI18n } from '../i18n';
import { AppIcon } from './AppIcon';
import type { AppIconName } from './AppIcon';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline-primary'
  | 'outline-secondary'
  | 'success'
  | 'danger'
  | 'link'
  | 'ghost'
  /** Plain navigation link (`.nav-link` on web) — no button chrome. */
  | 'nav';

export type ButtonProps = {
  /** Visible label. Omit for icon-only buttons. */
  label?: string;
  children?: React.ReactNode;
  /** Optional second line under the label (counts, capacity, helper text). */
  description?: string;
  onPress?: () => void;
  /** Visual style. Defaults to 'primary'. */
  variant?: ButtonVariant;
  /** Navigation destination — renders an anchor/link when provided (web only). */
  href?: Href | string;
  /** Toggle/selected state (renders the active skin). */
  active?: boolean;
  disabled?: boolean;
  /** Shows a progress indicator and blocks further clicks. */
  loading?: boolean;
  small?: boolean;
  /** Icon glyph on the leading edge. */
  icon?: AppIconName;
  /** Custom leading node (e.g. a Bootstrap Icons glyph) shown before the label. */
  leading?: React.ReactNode;
  /** Render only the icon (label omitted). */
  iconOnly?: boolean;
  /** Extra content rendered after the label (e.g. chevron icon). */
  after?: React.ReactNode;
  /** Extra Bootstrap utility classes (web only). */
  className?: string;
  /** Marks the button as a disclosure control and exposes expanded state. */
  expanded?: boolean;
  /** The control opens an overlay (mega panel, drawer) — sets aria-haspopup on web. */
  haspopup?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const VARIANT_COLORS: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string }
> = {
  primary: { bg: Colors.primary, fg: Colors.white, border: Colors.primary },
  secondary: { bg: Colors.surface, fg: Colors.text, border: Colors.borderDark },
  'outline-primary': { bg: 'transparent', fg: Colors.primary, border: Colors.primary },
  'outline-secondary': { bg: 'transparent', fg: Colors.text, border: Colors.border },
  success: { bg: Colors.green, fg: Colors.white, border: Colors.green },
  danger: { bg: Colors.danger, fg: Colors.white, border: Colors.danger },
  link: { bg: 'transparent', fg: Colors.info, border: 'transparent' },
  ghost: { bg: 'transparent', fg: Colors.primary, border: 'transparent' },
  nav: { bg: 'transparent', fg: Colors.primary, border: 'transparent' },
};

/**
 * Native (iOS/Android) button. Metro resolves Button.web.tsx on web, where a
 * real Bootstrap `<button class="btn …">` is rendered instead, so both
 * platforms present the same control vocabulary.
 */
export default function Button({
  label,
  children,
  description,
  onPress,
  variant = 'primary',
  href,
  active = false,
  disabled = false,
  loading = false,
  small = false,
  icon,
  leading,
  iconOnly = false,
  className: _className,
  accessibilityLabel,
  accessibilityHint,
  expanded,
  after,
}: ButtonProps) {
  const { fs } = useI18n();
  const tone = VARIANT_COLORS[variant];
  const showLabel = !iconOnly;
  const inactive = disabled || loading;

  // On native there are no anchors: a destination is pushed through the router.
  const handlePress = onPress ?? (href ? () => router.push(href as Href) : undefined);

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: inactive, busy: loading, expanded }}
      accessibilityLabel={accessibilityLabel ?? (showLabel ? label : undefined)}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.btn,
        active && styles.btnActive,
        small && styles.btnSmall,
        iconOnly && styles.btnIconOnly,
        {
          backgroundColor: active ? Colors.primaryLight : tone.bg,
          borderColor: tone.border,
          opacity: inactive ? 0.45 : pressed && !active ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {leading}
          {icon ? (
            <AppIcon
              name={icon}
              size={small ? 14 : 18}
              color={active ? Colors.primaryDark : tone.fg}
            />
          ) : null}
          {showLabel ? (
            <View style={styles.stack}>
              <Text
                style={[
                  styles.label,
                  { color: active ? Colors.primaryDark : tone.fg, fontSize: fs(small ? 13 : 15) },
                ]}
              >
                {label ?? children}
              </Text>
              {description ? (
                <Text
                  style={[
                    styles.description,
                    { color: active ? Colors.primaryDark : Colors.textMuted, fontSize: fs(11) },
                  ]}
                >
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}
          {after}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  btnSmall: { minHeight: 34, paddingHorizontal: Spacing.sm },
  btnIconOnly: { paddingHorizontal: Spacing.sm, minWidth: 40 },
  btnActive: {
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  label: {
    fontWeight: '700',
    fontFamily: Fonts.semiBold,
  },
  stack: {
    alignItems: 'flex-start',
  },
  description: {
    fontWeight: '600',
    marginTop: 1,
  },
});
