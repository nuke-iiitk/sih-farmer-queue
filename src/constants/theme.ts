import { Platform } from 'react-native';

/**
 * Farmer Procurement Portal design system.
 *
 * Indian government service portal visual language — modelled on the NTA
 * JEE-Main portal: crisp white background, deep institutional navy for text
 * and authority, saffron as the secondary accent, and soft surface greys
 * that keep the layout clean and scannable on both desktop and mobile.
 */
export const Fonts = {
  // Arial everywhere (system font — no loading needed on any platform).
  // Weight is carried by the explicit `fontWeight` style next to each usage;
  // the browser synthesizes the non-true weights from Arial's 400/700 faces.
  regular: 'Arial',
  medium: 'Arial',
  semiBold: 'Arial',
  bold: 'Arial',
  extraBold: 'Arial',
} as const;

export const FONT_STACK =
  "Arial, Helvetica, 'Noto Sans Devanagari', 'Noto Sans Malayalam', -apple-system, 'Segoe UI', Roboto, sans-serif";

export const Colors = {
  // Deep navy — government authority (JEE-Main style)
  primary: '#0d47a1',
  primaryDark: '#0a2f6b',
  primaryLight: '#e3f2fd',

  // Saffron — secondary government accent
  saffron: '#e65100',
  saffronDark: '#b85c0f',
  saffronLight: '#fff2e5',

  // Status green
  green: '#16823b',
  greenDark: '#0f6a2e',
  greenLight: '#e6f4ec',

  // Neutrals — crisp white background, soft grey surfaces
  white: '#ffffff',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  surfaceMuted: '#f0f4f8',

  text: '#1a1a1a',
  textSecondary: '#495057',
  textMuted: '#6c757d',
  textOnDark: '#d7e3f4',

  border: '#e0e0e0',
  borderDark: '#bdbdbd',

  success: '#16823b',
  successLight: '#e6f4ec',
  warning: '#b77900',
  warningLight: '#fff3e5',
  danger: '#c62828',
  dangerLight: '#fce8e6',
  info: '#1565c0',
  infoLight: '#e8f1fc',

  black: '#111111',

  /** India tricolour — navy, white, green for the flag strip. */
  flag: ['#040488', '#FFFFFF', '#138808'] as const,

  light: {
    text: '#1a1a1a',
    textSecondary: '#495057',
    background: '#ffffff',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e3f2fd',
  },
  dark: {
    text: '#f8f9fa',
    textSecondary: '#a8b3be',
    background: '#0a2f6b',
    backgroundElement: '#0d47a1',
    backgroundSelected: '#0a2f6b',
  },
};

export type ThemeColor = keyof typeof Colors.light;

/** System-level font-family stacks per platform (Arial is the app font). */
export const SystemFonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  half: 2,
  xs: 4,
  one: 4,
  sm: 8,
  two: 8,
  three: 12,
  md: 16,
  four: 16,
  five: 24,
  lg: 24,
  six: 32,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
};

/** Base font sizes; use with the accessibility text-size scaler (useSettings().fs). */
export const FontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  body: 15,
  base: 16,
  lg: 18,
  xl: 20,
  title: 24,
  h1: 28,
  hero: 34,
  display: 42,
};

export const MaxContentWidth = 1080;
export const MaxTextWidth = 880;
export const BottomTabInset = 76;

/** Shared responsive breakpoints. */
export const Breakpoint = {
  tablet: 768,
  desktop: 1024,
};

