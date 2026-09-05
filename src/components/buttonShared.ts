import { Colors } from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  /** Ionicons glyph name (typed loosely here; cast at render). */
  icon?: string;
  accessibilityHint?: string;
};

/** Native skin per variant. */
export const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: Colors.primary, fg: Colors.white, border: Colors.primary },
  secondary: { bg: Colors.white, fg: Colors.primary, border: Colors.primary },
  success: { bg: Colors.green, fg: Colors.white, border: Colors.green },
  danger: { bg: Colors.danger, fg: Colors.white, border: Colors.danger },
  ghost: { bg: 'transparent', fg: Colors.primary, border: 'transparent' },
};

/** Foreground (icon) color per variant on web — matches the Bootstrap skin. */
export const WEB_FG: Record<ButtonVariant, string> = {
  primary: Colors.white,
  secondary: Colors.primary,
  success: Colors.white,
  danger: Colors.white,
  ghost: Colors.primary,
};

/** Bootstrap class per variant (web only). */
export const BOOTSTRAP_VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-outline-primary',
  success: 'btn btn-success',
  danger: 'btn btn-danger',
  ghost: 'btn btn-link',
};