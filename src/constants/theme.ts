import { Platform } from 'react-native';

/**
 * National Land Acquisition & Management System (NLAMS) design system.
 *
 * Indian government service portal visual language — modelled on the NTA
 * JEE-Main portal: crisp white background, deep institutional navy for text
 * and authority, saffron as the secondary accent, and soft surface greys
 * that keep the layout clean and scannable on both desktop and mobile.
 */

/**
 * Portal type stack. 'IBM Plex Sans Devanagari' follows the Latin family so
 * Hindi glyphs stay in the Plex world instead of dropping to a system font;
 * Arial/Helvetica remain as the offline-safe fallback, then the system sans.
 */
export const FONT_STACK =
  "'IBM Plex Sans', 'IBM Plex Sans Devanagari', Arial, Helvetica, 'Noto Sans Devanagari', 'Noto Sans Malayalam', -apple-system, 'Segoe UI', Roboto, sans-serif";

/**
 * The family used by RN style objects.
 *
 * Web resolves to the full portal stack: a style object on a component
 * overrides the stylesheet, so a bare family name would drop the fallbacks and
 * leave those elements on the browser default (Times) while the woff2 files
 * are still downloading. Native keeps the single family name — a comma list is
 * not a valid native font family — and falls back to the platform sans until
 * IBM Plex ttf files are bundled under assets.
 */
const PLEX = Platform.OS === 'web' ? FONT_STACK : 'IBM Plex Sans';

export const Fonts = {
  // Every token resolves to IBM Plex Sans. On web the four true faces
  // (400/500/600/700) are self-hosted via /public/ibm-plex.css, so the explicit
  // `fontWeight` next to each usage selects a real face; 800 falls through to
  // the 700 Bold face.
  regular: PLEX,
  medium: PLEX,
  semiBold: PLEX,
  bold: PLEX,
  extraBold: PLEX,
} as const;

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
  successLight: '#E6F4EC',
  warning: '#B77900',
  warningLight: '#FFF3E5',
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

/** Platform font stacks. Web leads with the self-hosted IBM Plex Sans; the
 *  others are only used for the explicit mono/serif/rounded edge cases. */
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
    sans: "'IBM Plex Sans', 'IBM Plex Sans Devanagari', Arial, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif",
    serif: "'IBM Plex Sans', Georgia, 'Times New Roman', serif",
    rounded: "'IBM Plex Sans', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, sans-serif",
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

/** Desktop content width — tuned for 16:9 displays (1920×1080, 1366×768). */
export const MaxContentWidth = 1280;
export const MaxTextWidth = 880;
export const BottomTabInset = 76;

/** Shared responsive breakpoints. */
export const Breakpoint = {
  tablet: 768,
  desktop: 1024,
};

